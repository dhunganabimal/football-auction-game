import { freshPool, POSITIONS } from './players.js'
import { POWER_CARDS, drawPowerCard } from './powerCards.js'

// ---- Tunable game constants -------------------------------------------------
const STARTING_BID = 1 // $1M opening price for every auction
const MIN_RESERVE_PER_SPOT = 1 // must keep $1M in reserve per unfilled required spot
const SNIPE_RESET = 5 // a bid below this many seconds left bumps the clock back to 5s
const POWER_TRIGGER_EVERY = 10 // power round after every N sold players
const DEFAULT_AUCTION_SECONDS = 20
const FREEZE_DURATION = 2 // frozen for the next 2 auctions
const MAX_LOG = 40
const AUTO_DRAW_DELAY = 3500 // ms breather between auctions in random mode
const AUTO_START_DELAY = 1500 // ms before the very first random draw

// One live game room. Owns its own pool, players, timer and event log.
export class Room {
  constructor(code, io) {
    this.code = code
    this.io = io
    this.hostId = null
    this.settings = {
      budget: 100,
      squadSize: 11,
      positionReqs: { GK: 1, DEF: 4, MID: 4, FWD: 2 },
      auctionSeconds: DEFAULT_AUCTION_SECONDS,
      timerMode: 'timed', // 'timed' = countdown, 'host' = host closes each auction manually
      nominationMode: 'random', // 'random' = auto-draw, 'manual' = players nominate
      biddingMode: 'open', // 'open' = free-for-all, 'turns' = circular one-at-a-time
    }
    this.players = new Map() // playerId -> player
    this.order = [] // playerId nomination order
    this.pool = freshPool() // available football players
    this.status = 'lobby' // lobby | auction | ended
    this.nominatorIndex = 0
    this.current = null // active auction
    this.soldCount = 0
    this.log = []
    this.lastPowerDraw = null // { assignments, at } — kept for late joiners' animation skip
    this.awaitingAuto = false // random mode: a draw is scheduled between auctions
    this.autoTimer = null // pending setTimeout handle for the next auto-draw
    this.timer = setInterval(() => this.tick(), 1000)
  }

  destroy() {
    clearInterval(this.timer)
    clearTimeout(this.autoTimer)
  }

  isEmpty() {
    return [...this.players.values()].every((p) => !p.connected)
  }

  // ---- players ------------------------------------------------------------
  addPlayer(playerId, socketId, nickname) {
    const isHost = this.players.size === 0
    if (isHost) this.hostId = playerId
    const player = {
      id: playerId,
      socketId,
      nickname: nickname.slice(0, 16) || `Manager ${this.players.size + 1}`,
      budget: this.settings.budget,
      squad: [], // { ...fp, price }
      cards: [], // card ids in hand
      frozen: 0, // auctions remaining frozen
      connected: true,
      isHost,
    }
    this.players.set(playerId, player)
    if (this.status === 'lobby') this.order.push(playerId)
    return player
  }

  reconnect(playerId, socketId) {
    const p = this.players.get(playerId)
    if (!p) return null
    p.socketId = socketId
    p.connected = true
    return p
  }

  disconnect(socketId) {
    const p = [...this.players.values()].find((x) => x.socketId === socketId)
    if (!p) return null
    p.connected = false
    // If it was this manager's turn to nominate and nothing is live, move on.
    if (
      this.settings.nominationMode === 'manual' &&
      this.status === 'auction' &&
      !this.current &&
      this.nominatorId() === p.id
    ) {
      this.advanceNominator()
    }
    // Turn-based: if the leaver was on the clock, fold them and move on.
    if (
      this.settings.biddingMode === 'turns' &&
      this.status === 'auction' &&
      this.current &&
      this.current.turnId === p.id
    ) {
      this.current.folded.add(p.id)
      this.advanceTurn()
    }
    return p
  }

  nominatorId() {
    if (this.settings.nominationMode === 'random') return null
    return this.order[this.nominatorIndex] ?? null
  }

  connectedPlayers() {
    return this.order.map((id) => this.players.get(id)).filter((p) => p && p.connected)
  }

  // ---- lobby / start ------------------------------------------------------
  configure(settings) {
    if (this.status !== 'lobby') return
    const s = this.settings
    if (Number.isFinite(settings.budget)) s.budget = clamp(settings.budget, 10, 1000)
    if (Number.isFinite(settings.squadSize)) s.squadSize = clamp(settings.squadSize, 1, 25)
    if (Number.isFinite(settings.auctionSeconds))
      s.auctionSeconds = clamp(settings.auctionSeconds, 8, 60)
    if (settings.nominationMode === 'random' || settings.nominationMode === 'manual')
      s.nominationMode = settings.nominationMode
    if (settings.timerMode === 'timed' || settings.timerMode === 'host')
      s.timerMode = settings.timerMode
    if (settings.biddingMode === 'open' || settings.biddingMode === 'turns')
      s.biddingMode = settings.biddingMode
    if (settings.positionReqs) {
      for (const pos of POSITIONS) {
        const v = settings.positionReqs[pos]
        if (Number.isFinite(v)) s.positionReqs[pos] = clamp(v, 0, 15)
      }
    }
    // Keep every manager's live budget in sync with the configured budget.
    for (const p of this.players.values()) p.budget = s.budget
  }

  canStart() {
    const reqTotal = POSITIONS.reduce((n, pos) => n + this.settings.positionReqs[pos], 0)
    return (
      this.status === 'lobby' &&
      this.players.size >= 2 &&
      reqTotal <= this.settings.squadSize &&
      this.settings.squadSize <= this.pool.length
    )
  }

  start(byPlayerId) {
    if (byPlayerId !== this.hostId || !this.canStart()) return false
    this.status = 'auction'
    this.nominatorIndex = 0
    this.pushLog('system', `Auction started — ${this.settings.budget}M budget, ${this.settings.squadSize}-player squads.`)
    if (this.settings.nominationMode === 'random') {
      this.scheduleAutoNominate(AUTO_START_DELAY)
    } else {
      this.ensureActiveNominator()
    }
    return true
  }

  // ---- random mode auto-draw ---------------------------------------------
  scheduleAutoNominate(delay) {
    clearTimeout(this.autoTimer)
    if (this.status !== 'auction') return
    if (this.pool.length === 0) {
      this.endGame()
      return
    }
    this.awaitingAuto = true
    this.autoTimer = setTimeout(() => this.autoNominate(), delay)
  }

  autoNominate() {
    this.autoTimer = null
    this.awaitingAuto = false
    if (this.status !== 'auction' || this.current) return
    if (this.pool.length === 0) {
      this.endGame()
      this.broadcast()
      return
    }
    const idx = Math.floor(Math.random() * this.pool.length)
    const fp = this.pool.splice(idx, 1)[0]
    this.pushLog('nominate', `🎲 ${fp.name} (${fp.position}) is up for auction!`)
    this.openAuction(fp, null, STARTING_BID)
  }

  // After an auction resolves, either pass the turn (manual) or queue the
  // next random draw (random). Ends the game first if squads are full / pool dry.
  advanceOrSchedule() {
    this.maybeEndGame()
    if (this.status === 'ended') return
    if (this.settings.nominationMode === 'random') {
      this.scheduleAutoNominate(AUTO_DRAW_DELAY)
    } else {
      this.advanceNominator()
    }
  }

  // ---- nomination ---------------------------------------------------------
  ensureActiveNominator() {
    // Skip disconnected managers or those with a full squad.
    let guard = 0
    while (guard++ < this.order.length) {
      const p = this.players.get(this.nominatorId())
      if (p && p.connected && p.squad.length < this.settings.squadSize) return
      this.nominatorIndex = (this.nominatorIndex + 1) % this.order.length
    }
  }

  advanceNominator() {
    if (this.order.length === 0) return
    this.nominatorIndex = (this.nominatorIndex + 1) % this.order.length
    this.ensureActiveNominator()
    this.maybeEndGame()
  }

  nominate(playerId, footballPlayerId) {
    if (this.settings.nominationMode === 'random')
      return err('Players are drawn automatically in this room.')
    if (this.status !== 'auction' || this.current) return err('An auction is already live.')
    if (this.nominatorId() !== playerId) return err('It is not your turn to nominate.')
    const idx = this.pool.findIndex((fp) => fp.id === footballPlayerId)
    if (idx === -1) return err('That player is no longer in the pool.')
    const player = this.players.get(playerId)
    if (player.squad.length >= this.settings.squadSize) return err('Your squad is already full.')
    const fp = this.pool.splice(idx, 1)[0]
    this.openAuction(fp, playerId, STARTING_BID)
    this.pushLog('nominate', `${player.nickname} nominated ${fp.name} (${fp.position}).`)
    return ok()
  }

  passNomination(playerId) {
    if (this.status !== 'auction' || this.current) return err('Cannot pass right now.')
    if (this.nominatorId() !== playerId) return err('It is not your turn.')
    const p = this.players.get(playerId)
    this.pushLog('system', `${p.nickname} passed their nomination.`)
    this.advanceNominator()
    return ok()
  }

  openAuction(fp, nominatorId, startPrice, discounted = false) {
    clearTimeout(this.autoTimer)
    this.autoTimer = null
    this.awaitingAuto = false
    const turns = this.settings.biddingMode === 'turns'

    if (turns) {
      const turnOrder = this.eligibleBidders()
      if (turnOrder.length === 0) {
        // Nobody can bid on this lot — return it straight to the pool.
        this.pool.push(fp)
        this.pushLog('skip', `${fp.name} was skipped (no eligible bidders) and returns to the pool.`)
        this.advanceOrSchedule()
        this.broadcast()
        return
      }
      this.current = {
        fp,
        price: startPrice,
        bidderId: null,
        bidderName: null,
        timeLeft: this.settings.auctionSeconds, // per-turn countdown
        nominatorId,
        discounted,
        turnOrder,
        turnPtr: 0,
        turnId: turnOrder[0],
        folded: new Set(),
      }
    } else {
      this.current = {
        fp,
        price: startPrice,
        bidderId: null,
        bidderName: null,
        timeLeft: this.settings.timerMode === 'host' ? null : this.settings.auctionSeconds,
        nominatorId,
        discounted,
        turnOrder: null,
        turnPtr: 0,
        turnId: null,
        folded: null,
      }
    }
    this.broadcast()
    this.io.to(this.code).emit('auction:new', { fp, discounted })
  }

  // ---- turn-based (circular) bidding --------------------------------------
  isBidderLive(id) {
    const p = this.players.get(id)
    return !!(p && p.connected && p.frozen === 0 && p.squad.length < this.settings.squadSize)
  }

  eligibleBidders() {
    // Managers who can legally bid on a lot, in seating order (player 1 first).
    return this.order.filter((id) => this.isBidderLive(id))
  }

  // Resolve or hand the turn to the next contender. Called after every bid/pass.
  advanceTurn() {
    const cur = this.current
    if (!cur || this.settings.biddingMode !== 'turns') return
    const active = cur.turnOrder.filter((id) => !cur.folded.has(id) && this.isBidderLive(id))
    const contenders = active.filter((id) => id !== cur.bidderId)
    // Sold: a leader stands and nobody else can raise.
    if (cur.bidderId && contenders.length === 0) return this.resolveAuction()
    // Skipped: no leader and nobody left to open a bid.
    if (!cur.bidderId && active.length === 0) return this.resolveAuction()
    // Pass the turn to the next active, non-leader bidder.
    const n = cur.turnOrder.length
    let guard = 0
    do {
      cur.turnPtr = (cur.turnPtr + 1) % n
    } while (
      ++guard <= n &&
      (cur.folded.has(cur.turnOrder[cur.turnPtr]) ||
        !this.isBidderLive(cur.turnOrder[cur.turnPtr]) ||
        cur.turnOrder[cur.turnPtr] === cur.bidderId)
    )
    cur.turnId = cur.turnOrder[cur.turnPtr]
    cur.timeLeft = this.settings.auctionSeconds
    this.broadcast()
    this.io.to(this.code).emit('tick', { timeLeft: cur.timeLeft })
  }

  passBid(playerId) {
    if (this.status !== 'auction' || !this.current) return err('No live auction.')
    if (this.settings.biddingMode !== 'turns') return err('Passing is only for turn-based bidding.')
    if (this.current.turnId !== playerId) return err('It is not your turn.')
    const p = this.players.get(playerId)
    this.current.folded.add(playerId)
    this.pushLog('skip', `${p?.nickname ?? 'A manager'} passed on ${this.current.fp.name}.`)
    this.advanceTurn()
    return ok()
  }

  // ---- bidding ------------------------------------------------------------
  maxBid(player) {
    if (player.squad.length >= this.settings.squadSize) return 0
    const spotsAfter = Math.max(0, this.settings.squadSize - player.squad.length - 1)
    // Reserve $1M per still-required position that this purchase would not fill.
    const reserve = spotsAfter * MIN_RESERVE_PER_SPOT
    return player.budget - reserve
  }

  minAcceptableBid() {
    if (!this.current) return STARTING_BID
    return this.current.bidderId ? this.current.price + 1 : this.current.price
  }

  placeBid(playerId, amount) {
    if (this.status !== 'auction' || !this.current) return err('No live auction.')
    const player = this.players.get(playerId)
    if (!player || !player.connected) return err('You are not in this auction.')
    if (player.frozen > 0) return err('You are frozen and cannot bid right now.')
    if (this.settings.biddingMode === 'turns' && this.current.turnId !== playerId)
      return err('It is not your turn to bid.')
    if (this.current.bidderId === playerId) return err('You are already the highest bidder.')
    if (player.squad.length >= this.settings.squadSize) return err('Your squad is full.')
    amount = Math.floor(Number(amount))
    if (!Number.isFinite(amount)) return err('Invalid bid.')
    if (amount < this.minAcceptableBid()) return err(`Bid must be at least ${this.minAcceptableBid()}M.`)
    if (amount > this.maxBid(player))
      return err(`Over your limit — you must reserve $1M per remaining squad spot.`)

    this.current.price = amount
    this.current.bidderId = playerId
    this.current.bidderName = player.nickname
    this.pushLog('bid', `${player.nickname} bid ${amount}M on ${this.current.fp.name}.`)
    this.io.to(this.code).emit('auction:bid', {
      bidderName: player.nickname,
      amount,
      fpName: this.current.fp.name,
    })
    if (this.settings.biddingMode === 'turns') {
      // Circular mode: the raise ends this manager's turn; hand off / resolve.
      this.advanceTurn()
    } else {
      if (this.settings.timerMode === 'timed' && this.current.timeLeft < SNIPE_RESET)
        this.current.timeLeft = SNIPE_RESET
      this.broadcast()
    }
    return ok()
  }

  tick() {
    if (this.status !== 'auction' || !this.current) return
    if (this.settings.biddingMode === 'turns') {
      if (this.current.timeLeft == null) return
      this.current.timeLeft -= 1
      if (this.current.timeLeft <= 0) {
        // The manager on the clock ran out of time — auto-pass them.
        const p = this.players.get(this.current.turnId)
        this.current.folded.add(this.current.turnId)
        this.pushLog('skip', `${p?.nickname ?? 'A manager'} ran out of time and passed.`)
        this.advanceTurn()
      } else {
        this.io.to(this.code).emit('tick', { timeLeft: this.current.timeLeft })
      }
      return
    }
    if (this.settings.timerMode !== 'timed') return // host closes the auction manually
    this.current.timeLeft -= 1
    if (this.current.timeLeft <= 0) {
      this.resolveAuction()
    } else {
      this.io.to(this.code).emit('tick', { timeLeft: this.current.timeLeft })
    }
  }

  resolveAuction() {
    const cur = this.current
    this.current = null
    if (cur.bidderId) {
      const buyer = this.players.get(cur.bidderId)
      buyer.budget -= cur.price
      buyer.squad.push({ ...cur.fp, price: cur.price })
      this.soldCount += 1
      this.pushLog('sold', `${cur.fp.name} SOLD to ${buyer.nickname} for ${cur.price}M!`)
      this.io.to(this.code).emit('auction:sold', {
        fp: cur.fp,
        price: cur.price,
        buyerName: buyer.nickname,
        buyerId: buyer.id,
      })
      this.tickFreezes()
      if (this.soldCount % POWER_TRIGGER_EVERY === 0) this.triggerPowerRound()
    } else {
      // Nobody bid — return to the pool so it can resurface later.
      this.pool.push(cur.fp)
      this.pushLog('skip', `${cur.fp.name} was skipped (no bids) and returns to the pool.`)
      this.io.to(this.code).emit('auction:skipped', { fp: cur.fp })
      this.tickFreezes()
    }
    this.advanceOrSchedule()
    this.broadcast()
  }

  tickFreezes() {
    for (const p of this.players.values()) if (p.frozen > 0) p.frozen -= 1
  }

  // ---- host auctioneer (only when timerMode === 'host') -------------------
  hostSell(byPlayerId) {
    if (byPlayerId !== this.hostId) return err('Only the host can sell.')
    if (this.settings.timerMode !== 'host') return err('Not in host-auctioneer mode.')
    if (!this.current) return err('No live auction to sell.')
    // resolveAuction sells to the highest bidder, or skips if there were none.
    this.resolveAuction()
    return ok()
  }

  hostSkip(byPlayerId) {
    if (byPlayerId !== this.hostId) return err('Only the host can skip.')
    if (this.settings.timerMode !== 'host' && this.settings.biddingMode !== 'turns')
      return err('Not in host-auctioneer mode.')
    if (!this.current) return err('No live auction to skip.')
    // Force a no-sale even if bids exist — the player returns to the pool.
    this.current.bidderId = null
    this.current.bidderName = null
    this.resolveAuction()
    return ok()
  }

  // ---- power cards --------------------------------------------------------
  triggerPowerRound() {
    const assignments = {}
    for (const p of this.connectedPlayers()) {
      const card = drawPowerCard()
      p.cards.push(card)
      assignments[p.id] = { nickname: p.nickname, card }
    }
    this.lastPowerDraw = { assignments }
    this.pushLog('power', `⚡ Power Card Round! ${this.connectedPlayers().length} managers drew a card.`)
    // Reveal each manager's own card privately; broadcast that a round happened.
    this.io.to(this.code).emit('power:round', {
      players: Object.entries(assignments).map(([id, a]) => ({ id, nickname: a.nickname })),
    })
    for (const p of this.connectedPlayers()) {
      this.io.to(p.socketId).emit('power:card', { card: POWER_CARDS[assignments[p.id].card] })
    }
    this.broadcast()
  }

  usePowerCard(playerId, cardId, target = {}) {
    const player = this.players.get(playerId)
    if (!player) return err('Unknown manager.')
    const handIdx = player.cards.indexOf(cardId)
    if (handIdx === -1) return err('You do not hold that card.')
    const def = POWER_CARDS[cardId]
    if (!def) return err('Unknown card.')

    const result = this.applyPower(player, def, target)
    if (result.error) return result
    player.cards.splice(handIdx, 1)
    this.broadcast()
    return ok()
  }

  applyPower(player, def, target) {
    switch (def.id) {
      case 'BUDGET_BOOST': {
        const boost = Math.random() < 0.5 ? 5 : 10
        player.budget += boost
        this.announcePower(player, def, `gained +${boost}M budget 💰`)
        return ok()
      }
      case 'BID_FREEZE': {
        const victim = this.players.get(target.opponentId)
        if (!victim || victim.id === player.id) return err('Pick a valid opponent to freeze.')
        victim.frozen = FREEZE_DURATION
        this.announcePower(player, def, `froze ${victim.nickname} 🧊 for ${FREEZE_DURATION} players`)
        return ok()
      }
      case 'STEAL': {
        const victim = this.players.get(target.ownerId)
        if (!victim || victim.id === player.id) return err('Pick another manager.')
        const idx = victim.squad.findIndex((s) => s.id === target.fpId)
        if (idx === -1) return err('That player is not in their squad anymore.')
        if (player.squad.length >= this.settings.squadSize) return err('Your squad is full.')
        const [fp] = victim.squad.splice(idx, 1)
        player.squad.push({ ...fp, price: 0 }) // stolen for free
        this.announcePower(player, def, `stole ${fp.name} from ${victim.nickname} 🫳`)
        return ok()
      }
      case 'FORCED_RELEASE': {
        const victim = this.players.get(target.ownerId)
        if (!victim || victim.id === player.id) return err('Pick another manager.')
        const idx = victim.squad.findIndex((s) => s.id === target.fpId)
        if (idx === -1) return err('That player is not in their squad anymore.')
        const [fp] = victim.squad.splice(idx, 1)
        victim.budget += fp.price // refunded
        this.pool.push(stripPrice(fp))
        this.announcePower(player, def, `forced ${victim.nickname} to release ${fp.name} ⛓️‍💥`)
        return ok()
      }
      case 'FIRE_SALE': {
        if (this.current) return err('Wait until the current auction ends.')
        const idx = player.squad.findIndex((s) => s.id === target.fpId)
        if (idx === -1) return err('Pick one of your own players.')
        const [fp] = player.squad.splice(idx, 1)
        player.budget += fp.price // refunded now; re-earns on resale
        const startPrice = Math.max(STARTING_BID, Math.round(fp.price * 0.5))
        this.announcePower(player, def, `put ${fp.name} on a 🔥 Fire Sale (from ${startPrice}M)`)
        this.openAuction(stripPrice(fp), player.id, startPrice, true)
        return ok()
      }
      default:
        return err('That power is not implemented.')
    }
  }

  announcePower(player, def, text) {
    this.pushLog('power', `${def.icon} ${player.nickname} ${text}`)
    this.io.to(this.code).emit('power:played', {
      byId: player.id,
      byName: player.nickname,
      card: def,
      text,
    })
  }

  // ---- end game -----------------------------------------------------------
  maybeEndGame() {
    const active = this.connectedPlayers()
    if (active.length === 0) return
    const allFull = active.every((p) => p.squad.length >= this.settings.squadSize)
    if (allFull || this.pool.length === 0) this.endGame()
  }

  endGame() {
    if (this.status === 'ended') return
    this.status = 'ended'
    this.current = null
    this.pushLog('system', '🏁 Auction complete! Final squads locked in.')
    this.broadcast()
  }

  forceEnd(byPlayerId) {
    if (byPlayerId !== this.hostId) return err('Only the host can end the game.')
    this.endGame()
    return ok()
  }

  // ---- serialization ------------------------------------------------------
  positionCounts(squad) {
    const counts = { GK: 0, DEF: 0, MID: 0, FWD: 0 }
    for (const s of squad) counts[s.position] = (counts[s.position] || 0) + 1
    return counts
  }

  squadComplete(player) {
    const counts = this.positionCounts(player.squad)
    const meetsPos = POSITIONS.every((pos) => counts[pos] >= this.settings.positionReqs[pos])
    return meetsPos && player.squad.length >= this.settings.squadSize
  }

  publicPlayer(p) {
    return {
      id: p.id,
      nickname: p.nickname,
      budget: p.budget,
      squad: p.squad,
      positions: this.positionCounts(p.squad),
      squadCount: p.squad.length,
      cardCount: p.cards.length,
      frozen: p.frozen,
      connected: p.connected,
      isHost: p.isHost,
      complete: this.squadComplete(p),
    }
  }

  publicState() {
    return {
      code: this.code,
      status: this.status,
      settings: this.settings,
      hostId: this.hostId,
      nominatorId: this.nominatorId(),
      awaitingAuto: this.awaitingAuto,
      soldCount: this.soldCount,
      poolCount: this.pool.length,
      pool: this.pool,
      current: this.current
        ? {
            fp: this.current.fp,
            price: this.current.price,
            bidderId: this.current.bidderId,
            bidderName: this.current.bidderName,
            timeLeft: this.current.timeLeft,
            nominatorId: this.current.nominatorId,
            discounted: this.current.discounted,
            minBid: this.minAcceptableBid(),
            biddingMode: this.settings.biddingMode,
            turnId: this.current.turnId,
            turnOrder: this.current.turnOrder,
            folded: this.current.folded ? [...this.current.folded] : [],
          }
        : null,
      players: this.order.map((id) => this.publicPlayer(this.players.get(id))).filter(Boolean),
      log: this.log.slice(-30),
    }
  }

  privateFor(player) {
    return {
      id: player.id,
      isHost: player.isHost,
      cards: player.cards.map((c) => POWER_CARDS[c]),
      maxBid: this.maxBid(player),
      frozen: player.frozen,
    }
  }

  broadcast() {
    const state = this.publicState()
    this.io.to(this.code).emit('state', state)
    for (const p of this.players.values()) {
      if (p.connected) this.io.to(p.socketId).emit('me', this.privateFor(p))
    }
  }

  pushLog(type, text) {
    this.log.push({ type, text, at: Date.now() })
    if (this.log.length > MAX_LOG) this.log.shift()
  }
}

// ---- helpers ----------------------------------------------------------------
function clamp(n, lo, hi) {
  return Math.max(lo, Math.min(hi, Math.floor(n)))
}
function stripPrice(fp) {
  const { price, ...rest } = fp
  return rest
}
function ok() {
  return { ok: true }
}
function err(message) {
  return { ok: false, error: message }
}
