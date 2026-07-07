import { freshPool, buildPool, countsByPosition, POSITIONS, POOL_TYPES } from './players.js'
import { POWER_CARDS, drawPowerCard } from './powerCards.js'

// ---- Tunable game constants -------------------------------------------------
const STARTING_BID = 1 // $1M opening price for every auction
const MIN_RESERVE_PER_SPOT = 1 // must keep $1M in reserve per unfilled required spot
const SNIPE_RESET = 5 // a bid below this many seconds left bumps the clock back to 5s
const POWER_TRIGGER_EVERY = 10 // power round after every N sold players
const GATE_COUNTDOWN = 12 // seconds managers get to play a card before the next lot auto-starts
const COMPOSE_MAX = 45 // safety cap: max seconds the countdown stays paused while someone is mid-selection
const DEFAULT_AUCTION_SECONDS = 20
const FREEZE_DURATION = 2 // frozen for the next 2 auctions
const BARGAIN_DISCOUNT = 0.25 // Bargain card: % knocked off the holder's next win
const MAX_CARD_DRAWS = 2 // a manager is never dealt the same card more than this many times
const FINE_PCT = 0.15 // Tax Bill curse: fraction of the drawer's budget deducted
const COLD_FEET_FREEZE = 1 // Cold Feet curse: frozen for the next N players
const KICK_VOTE_TIMEOUT = 30 // seconds a vote-to-kick stays open before it lapses
const MAX_LOG = 40
const AUTO_DRAW_DELAY = 3500 // ms breather between auctions in random mode
const AUTO_START_DELAY = 1500 // ms before the very first random draw

// One live game room. Owns its own pool, players, timer and event log.
export class Room {
  constructor(code, io) {
    this.code = code
    this.io = io
    this.hostId = null
    this.poolType = 'mix' // which player set to draw from: 'mix' | 'legend' | 'current'
    this.maxPerPosition = countsByPosition(this.poolType) // upper bound per position for the chosen pool type
    this.settings = {
      budget: 100,
      squadSize: 11,
      positionReqs: { GK: 1, DEF: 4, MID: 4, FWD: 2 },
      auctionSeconds: DEFAULT_AUCTION_SECONDS,
      timerMode: 'timed', // 'timed' = countdown, 'host' = host closes each auction manually
      nominationMode: 'random', // 'random' = auto-draw, 'manual' = players nominate
      biddingMode: 'open', // 'open' = free-for-all, 'turns' = circular one-at-a-time
      poolType: this.poolType, // legends / current players / both (see players.js)
      poolLimits: { ...this.maxPerPosition }, // how many of each position are drawn into this game
      powerCardInterval: POWER_TRIGGER_EVERY, // power round after every N sold players (0 = never)
    }
    this.players = new Map() // playerId -> player
    this.order = [] // playerId nomination order
    this.pool = freshPool() // available football players (rebuilt to poolLimits at start())
    this.skippedPool = [] // players nobody bid on — held here instead of muddying the main pool
    this.status = 'lobby' // lobby | auction | ended
    this.nominatorIndex = 0
    this.bidRotation = 0 // turn-based: which seat gets first dibs, rotates per lot
    this.current = null // active auction
    this.soldCount = 0
    this.log = []
    this.lastPowerDraw = null // { assignments, at } — kept for late joiners' animation skip
    this.pendingPowerAck = null // Set of playerIds still deciding on a fresh power card
    this.powerGateReason = null // 'round' (just drew) | 'between' (holding cards between lots)
    this.gateSecondsLeft = 0 // visible countdown until the next lot auto-starts (tick-driven)
    this.gateComposers = new Set() // playerIds with the card target-picker open — pauses the countdown
    this.gateComposeCap = 0 // safety: seconds the pause may last before we assume they wandered off
    this.awaitingAuto = false // random mode: a draw is scheduled between auctions
    this.autoTimer = null // pending setTimeout handle for the next auto-draw
    this.kickVote = null // { targetId, targetName, startedById, startedByName, votes: Map<id,bool> }
    this.kickVoteTimer = null // auto-lapses an unresolved vote-to-kick
    this.timer = setInterval(() => this.tick(), 1000)
  }

  destroy() {
    clearInterval(this.timer)
    clearTimeout(this.autoTimer)
    clearTimeout(this.kickVoteTimer)
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
      drawCounts: {}, // cardId -> how many times ever dealt to this manager (caps repeats)
      frozen: 0, // auctions remaining frozen
      pendingDiscount: 0, // Bargain card: fraction off the next player they win
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
    // Don't let a disconnected manager stall everyone else's power-card decision.
    if (this.pendingPowerAck?.has(p.id)) this.checkPowerGate()
    // A vote in progress may now pass, fail, or be void (if its target left).
    if (this.kickVote) {
      if (this.kickVote.targetId === p.id) {
        this.cancelKickVote()
        this.pushLog('system', `🗳️ Vote to kick ${p.nickname} cancelled — they left the room.`)
      } else {
        this.evaluateKickVote()
      }
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
    // Pool type governs which player set is drawn from and thus the per-position
    // caps. Apply it before poolLimits below. On a type change we reset the
    // per-position limits to the new maxima — picking "Legends" should hand the
    // host the whole legend pool, not a stale cap left over from the last type.
    const poolTypeChanged =
      POOL_TYPES.includes(settings.poolType) && settings.poolType !== s.poolType
    if (poolTypeChanged) {
      s.poolType = settings.poolType
      this.poolType = settings.poolType
      this.maxPerPosition = countsByPosition(this.poolType)
      s.poolLimits = { ...this.maxPerPosition }
    }
    if (settings.positionReqs) {
      for (const pos of POSITIONS) {
        const v = settings.positionReqs[pos]
        if (Number.isFinite(v)) s.positionReqs[pos] = clamp(v, 0, 15)
      }
    }
    // Skip on a type change: the block above already reset the limits to the new
    // pool's maxima, and the incoming poolLimits still reflect the OLD pool.
    if (settings.poolLimits && !poolTypeChanged) {
      for (const pos of POSITIONS) {
        const v = settings.poolLimits[pos]
        if (Number.isFinite(v)) s.poolLimits[pos] = clamp(v, 0, this.maxPerPosition[pos])
      }
    }
    if (Number.isFinite(settings.powerCardInterval))
      s.powerCardInterval = clamp(settings.powerCardInterval, 0, 50)
    // Keep every manager's live budget in sync with the configured budget.
    for (const p of this.players.values()) p.budget = s.budget
  }

  poolLimitTotal() {
    return POSITIONS.reduce((n, pos) => n + this.settings.poolLimits[pos], 0)
  }

  canStart() {
    const reqTotal = POSITIONS.reduce((n, pos) => n + this.settings.positionReqs[pos], 0)
    return (
      this.status === 'lobby' &&
      this.players.size >= 2 &&
      reqTotal <= this.settings.squadSize &&
      this.settings.squadSize <= this.poolLimitTotal()
    )
  }

  start(byPlayerId) {
    if (byPlayerId !== this.hostId || !this.canStart()) return false
    this.status = 'auction'
    // Randomly select this game's pool from the master player list, honoring
    // the host's per-position caps (e.g. "only 7 GKs this game").
    this.pool = buildPool(this.settings.poolLimits, this.settings.poolType)
    this.skippedPool = []
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
    this.recycleSkippedIfNeeded()
    this.maybeEndGame()
    if (this.status === 'ended') return
    if (this.settings.nominationMode === 'random') {
      this.scheduleAutoNominate(AUTO_DRAW_DELAY)
    } else {
      this.advanceNominator()
    }
  }

  // Once the main pool runs dry, bring back everything sitting in the skipped
  // pool so the game can keep going (and eventually end normally) instead of
  // stopping early while skipped players are still unclaimed.
  recycleSkippedIfNeeded() {
    if (this.pool.length === 0 && this.skippedPool.length > 0) {
      const n = this.skippedPool.length
      this.pool.push(...this.skippedPool)
      this.skippedPool = []
      this.pushLog('system', `♻️ ${n} skipped player${n === 1 ? '' : 's'} returned to the pool.`)
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

  openAuction(fp, nominatorId, startPrice, opts = {}) {
    const { discounted = false, mystery = false, mysteryOwnerId = null } = opts
    clearTimeout(this.autoTimer)
    this.autoTimer = null
    this.awaitingAuto = false
    const turns = this.settings.biddingMode === 'turns'
    const eligible = this.eligibleBidders()

    // Nobody can legally bid on this lot right now — everyone is either frozen
    // or has a full squad. Don't stall the room on a timer/turn nobody can
    // answer: tick the freeze counters (a skipped lot still counts as a passed
    // "player" for freeze purposes), return the lot to the pool, and move on.
    // This is what breaks a mutual-freeze standoff — e.g. one full squad plus
    // two managers who froze each other — instead of looping forever.
    if (eligible.length === 0) {
      this.skippedPool.push(fp)
      this.pushLog('skip', `${fp.name} was skipped (no eligible bidders) and moved to the skipped pool.`)
      this.tickFreezes()
      this.io.to(this.code).emit('auction:skipped', { fp })
      this.advanceOrSchedule()
      this.broadcast()
      return
    }

    if (turns) {
      // Start this lot's turn order from the rotating seat, then advance the
      // rotation so the next lot's opening bidder is the following manager.
      const turnOrder = this.eligibleBidders(this.bidRotation)
      this.bidRotation = (this.bidRotation + 1) % this.order.length
      this.current = {
        fp,
        price: startPrice,
        startPrice, // floor to restore if a leading bidder leaves mid-lot
        bidderId: null,
        bidderName: null,
        timeLeft: this.settings.auctionSeconds, // per-turn countdown
        nominatorId,
        discounted,
        mystery,
        mysteryOwnerId,
        turnOrder,
        turnPtr: 0,
        turnId: turnOrder[0],
        folded: new Set(),
      }
    } else {
      this.current = {
        fp,
        price: startPrice,
        startPrice, // floor to restore if a leading bidder leaves mid-lot
        bidderId: null,
        bidderName: null,
        timeLeft: this.settings.timerMode === 'host' ? null : this.settings.auctionSeconds,
        nominatorId,
        discounted,
        mystery,
        mysteryOwnerId,
        turnOrder: null,
        turnPtr: 0,
        turnId: null,
        folded: null,
      }
    }
    this.broadcast()
    // On a mystery lot, hide who's really up for everyone in the room-wide event
    // (the owner still sees the real player via their private `mysteryReveal`).
    this.io.to(this.code).emit('auction:new', {
      fp: mystery ? mysteryFp(fp) : fp,
      discounted,
      mystery,
    })
  }

  // ---- turn-based (circular) bidding --------------------------------------
  isBidderLive(id) {
    const p = this.players.get(id)
    return !!(p && p.connected && p.frozen === 0 && p.squad.length < this.settings.squadSize)
  }

  eligibleBidders(start = 0) {
    // Managers who can legally bid on a lot, in seating order but starting from
    // seat `start` and wrapping around — so the manager who bids first can be
    // rotated from one lot to the next instead of always being player 1.
    const n = this.order.length
    if (n === 0) return []
    const rotated = Array.from({ length: n }, (_, i) => this.order[(start + i) % n])
    return rotated.filter((id) => this.isBidderLive(id))
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
    if (this.status !== 'auction') return
    // Between lots, drive the power-card decision gate's countdown instead.
    if (!this.current) {
      if (this.pendingPowerAck) this.tickGate()
      return
    }
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
      // Bargain card: knock a fixed % off this one win, then spend the card.
      let price = cur.price
      if (buyer.pendingDiscount > 0) {
        const discounted = Math.max(STARTING_BID, Math.ceil(cur.price * (1 - buyer.pendingDiscount)))
        if (discounted < price) {
          this.pushLog('power', `🏷️ ${buyer.nickname}'s Bargain saved ${price - discounted}M on ${cur.fp.name}.`)
          price = discounted
        }
        buyer.pendingDiscount = 0
      }
      buyer.budget -= price
      buyer.squad.push({ ...cur.fp, price })
      this.soldCount += 1
      this.pushLog('sold', `${cur.fp.name} SOLD to ${buyer.nickname} for ${price}M!`)
      this.io.to(this.code).emit('auction:sold', {
        fp: cur.fp,
        price,
        buyerName: buyer.nickname,
        buyerId: buyer.id,
      })
      this.tickFreezes()
      const interval = this.settings.powerCardInterval
      if (interval > 0 && this.soldCount % interval === 0) {
        this.triggerPowerRound() // draws cards and opens a 'round' decision gate
      }
    } else {
      // Nobody bid — move it to the skipped pool instead of dumping it back
      // into the main pool, where it could resurface after dozens of other
      // players. Managers can see it waiting there (by position) and it gets
      // recycled back into the draw automatically once the main pool runs dry.
      this.skippedPool.push(cur.fp)
      this.pushLog('skip', `${cur.fp.name} was skipped (no bids) and moved to the skipped pool.`)
      this.io.to(this.code).emit('auction:skipped', { fp: cur.fp })
      this.tickFreezes()
    }
    // Hold the next lot until every manager has confirmed they're done deciding
    // whether to play a card — see openDecisionGate() / resolvePowerGate(). This
    // is what stops someone's card decision from colliding with (and losing them
    // a shot at) the next player already going up for auction. A power round may
    // have already opened a 'round' gate above (pendingPowerAck set); otherwise
    // prompt anyone still holding a card between this lot and the next.
    if (this.pendingPowerAck || this.openDecisionGate('between')) {
      this.broadcast()
      return
    }
    this.advanceOrSchedule()
    this.broadcast()
  }

  tickFreezes() {
    // One "player" has passed — wind down every temporary status by a tick.
    for (const p of this.players.values()) {
      if (p.frozen > 0) p.frozen -= 1
    }
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
    const drew = this.connectedPlayers()
    const assignments = {} // playable cards that actually landed in a hand
    const curses = [] // { player, def } auto "curse" cards to spring after the banner
    for (const p of drew) {
      const card = this.drawCardFor(p)
      const def = POWER_CARDS[card]
      if (def.auto) {
        curses.push({ player: p, def }) // never enters the hand — resolved below
      } else {
        p.cards.push(card)
        assignments[p.id] = { nickname: p.nickname, card }
      }
    }
    this.lastPowerDraw = { assignments }
    this.pushLog('power', `⚡ Power Card Round! ${drew.length} managers drew a card.`)
    // Announce the round, then reveal each manager's own playable card privately.
    this.io.to(this.code).emit('power:round', {
      players: drew.map((p) => ({ id: p.id, nickname: p.nickname })),
    })
    for (const [id, a] of Object.entries(assignments)) {
      const p = this.players.get(id)
      if (p?.connected) this.io.to(p.socketId).emit('power:card', { card: POWER_CARDS[a.card] })
    }
    // Spring any curse cards — they hit their drawer immediately and are
    // announced to the whole room (lost cash / a released player / a freeze).
    for (const { player, def } of curses) this.applyAutoCard(player, def)

    // Gate the next auction: nobody goes up for sale again until every
    // manager still HOLDING a card has either played it or chosen to keep it.
    this.openDecisionGate('round')
    this.broadcast()
  }

  // Deal one card to a manager, respecting the per-manager repeat cap: a card is
  // never dealt again until every other candidate has been dealt at least as
  // often. Normally that just means excluding anything already at MAX_CARD_DRAWS;
  // once the whole deck is capped it means dealing only the least-seen cards, so
  // the distribution stays flat and nothing repeats early. Cards already in hand
  // are softly avoided. This is what stops the "same card again and again" feel.
  drawCardFor(player, { playableOnly = false } = {}) {
    if (!player.drawCounts) player.drawCounts = {}
    const count = (id) => player.drawCounts[id] || 0
    let ids = Object.keys(POWER_CARDS)
    if (playableOnly) ids = ids.filter((id) => !POWER_CARDS[id].auto)
    // Raise the ceiling only once every card has reached it, so no card ever gets
    // an (n+1)th copy before all cards have n copies. The least-drawn cards are
    // therefore never excluded, so there's always something legal to deal.
    const min = Math.min(...ids.map(count))
    const ceiling = Math.max(MAX_CARD_DRAWS, min + 1)
    const exclude = ids.filter((id) => count(id) >= ceiling)
    const card = drawPowerCard(Math.random, {
      avoid: new Set(player.cards),
      exclude,
      playableOnly,
    })
    player.drawCounts[card] = count(card) + 1
    return card
  }

  // Auto "curse" cards: applied the instant they're drawn, never held. Every
  // effect here is self-inflicted and negative, so nobody picks a target.
  applyAutoCard(player, def) {
    switch (def.id) {
      case 'FINE': {
        const amount = Math.min(player.budget, Math.max(1, Math.round(player.budget * FINE_PCT)))
        if (amount <= 0) {
          this.announcePower(player, def, `drew a 🧾 Tax Bill but had nothing left to pay`)
          return
        }
        player.budget -= amount
        this.announcePower(player, def, `was hit with a 🧾 Tax Bill — lost ${amount}M`)
        return
      }
      case 'INJURY': {
        if (player.squad.length === 0) {
          this.announcePower(player, def, `dodged an 🚑 Injury Blow — no players to lose`)
          return
        }
        const fp = player.squad.pop() // their most recent signing
        player.budget += fp.price // refunded what they paid — they lose the player, not the cash
        this.pool.push(stripPrice(fp))
        this.announcePower(player, def, `lost ${fp.name} to an 🚑 injury — released back to the pool`)
        return
      }
      case 'COLD_FEET': {
        player.frozen = Math.max(player.frozen, COLD_FEET_FREEZE)
        this.announcePower(
          player,
          def,
          `got 🥶 Cold Feet — frozen for the next ${COLD_FEET_FREEZE} player${COLD_FEET_FREEZE === 1 ? '' : 's'}`,
        )
        return
      }
      default:
        return
    }
  }

  // Pause between lots and prompt every manager still holding a card to decide
  // whether to play one before the next player goes up. Returns true if a gate
  // was opened (i.e. someone actually holds a card). A visible countdown
  // (tick-driven, see tickGate) auto-continues in case someone wanders off, so
  // the room can't stall forever.
  //   reason: 'round'   -> a power-card round just dealt everyone a fresh card
  //           'between' -> ordinary lot resolved; card holders get a play window
  openDecisionGate(reason) {
    const holders = this.connectedPlayers().filter((p) => p.cards.length > 0)
    if (holders.length === 0) return false
    this.pendingPowerAck = new Set(holders.map((p) => p.id))
    this.powerGateReason = reason
    this.gateSecondsLeft = GATE_COUNTDOWN
    this.gateComposers = new Set()
    this.gateComposeCap = 0
    return true
  }

  // Runs once a second (from tick) while a decision gate is open and no auction
  // is live. Counts down to the next auto-started lot — but freezes while anyone
  // has the card target-picker open, so the auction never starts out from under
  // a manager mid-play. The freeze is capped (COMPOSE_MAX) so an abandoned
  // picker can't stall the room forever.
  tickGate() {
    if (this.gateComposers.size > 0) {
      this.gateComposeCap -= 1
      if (this.gateComposeCap > 0) {
        this.io.to(this.code).emit('gate:tick', { secondsLeft: this.gateSecondsLeft, paused: true })
        return
      }
      // Held too long — assume they walked away, drop the hold and resume.
      this.gateComposers = new Set()
      this.broadcast()
      return
    }
    this.gateSecondsLeft -= 1
    if (this.gateSecondsLeft <= 0) {
      this.resolvePowerGate()
    } else {
      this.io.to(this.code).emit('gate:tick', { secondsLeft: this.gateSecondsLeft, paused: false })
    }
  }

  // A manager opened the card target-picker — pause the countdown so the next
  // lot can't start while they choose, and let everyone see who's deciding.
  holdGate(playerId) {
    if (!this.pendingPowerAck?.has(playerId)) return err('No decision window is open for you.')
    this.gateComposers.add(playerId)
    this.gateComposeCap = COMPOSE_MAX
    this.broadcast()
    return ok()
  }

  // They closed the picker (played a card or backed out) — release the pause.
  releaseGate(playerId) {
    if (!this.gateComposers.has(playerId)) return ok()
    this.gateComposers.delete(playerId)
    this.broadcast()
    return ok()
  }

  // A manager confirms they're done deciding for this power round — whether
  // or not they actually played a card. Unblocks the next auction once every
  // manager still connected has checked in (or the timeout elapses).
  acknowledgePowerRound(playerId) {
    if (!this.pendingPowerAck) return err('No power round is awaiting a response.')
    this.pendingPowerAck.delete(playerId)
    this.checkPowerGate()
    return ok()
  }

  checkPowerGate() {
    if (!this.pendingPowerAck) return
    // Drop anyone who has since disconnected so they can't stall the room —
    // whether they were still deciding or holding the picker open (pausing it).
    for (const id of [...this.pendingPowerAck]) {
      const p = this.players.get(id)
      if (!p || !p.connected) {
        this.pendingPowerAck.delete(id)
        this.gateComposers.delete(id)
      }
    }
    if (this.pendingPowerAck.size === 0) this.resolvePowerGate()
    else this.broadcast()
  }

  resolvePowerGate() {
    if (!this.pendingPowerAck) return
    this.pendingPowerAck = null
    this.powerGateReason = null
    this.gateSecondsLeft = 0
    this.gateComposers = new Set()
    this.gateComposeCap = 0
    this.advanceOrSchedule()
    this.broadcast()
  }

  usePowerCard(playerId, cardId, target = {}) {
    const player = this.players.get(playerId)
    if (!player) return err('Unknown manager.')
    // Power cards only apply between lots — not while a player is actively
    // being bid on — so playing one never distracts you from (or costs you)
    // the auction currently on the clock.
    if (this.current) return err('Wait until the current player is sold before playing a power card.')
    const handIdx = player.cards.indexOf(cardId)
    if (handIdx === -1) return err('You do not hold that card.')
    const def = POWER_CARDS[cardId]
    if (!def) return err('Unknown card.')

    const result = this.applyPower(player, def, target)
    if (result.error) return result
    player.cards.splice(handIdx, 1)
    // Playing a card during an open power-round decision counts as your answer.
    if (this.pendingPowerAck?.has(playerId)) {
      this.pendingPowerAck.delete(playerId)
      this.checkPowerGate()
    }
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
      case 'THAW': {
        if (player.frozen === 0) return err('You are not frozen right now.')
        player.frozen = 0
        this.announcePower(player, def, `thawed out 🌤️ and can bid again`)
        return ok()
      }
      case 'FREEZE_ALL': {
        const others = this.connectedPlayers().filter((o) => o.id !== player.id)
        if (others.length === 0) return err('No opponents can be frozen right now.')
        for (const o of others) o.frozen = Math.max(o.frozen, 1)
        this.announcePower(player, def, `unleashed a Cold Snap ❄️ — froze ${others.length} rival${others.length === 1 ? '' : 's'} for the next player`)
        return ok()
      }
      case 'RAID': {
        const victim = this.players.get(target.opponentId)
        if (!victim || victim.id === player.id) return err('Pick a valid opponent to raid.')
        const amount = Math.min(victim.budget, 10)
        if (amount <= 0) return err(`${victim.nickname} has no budget left to raid.`)
        victim.budget -= amount
        player.budget += amount
        this.announcePower(player, def, `raided ${amount}M from ${victim.nickname} 💸`)
        return ok()
      }
      case 'MYSTERY_BOX': {
        if (player.squad.length >= this.settings.squadSize) return err('Your squad is already full.')
        if (this.pool.length === 0) return err('The player pool is empty.')
        const idx = Math.floor(Math.random() * this.pool.length)
        const [fp] = this.pool.splice(idx, 1)
        player.squad.push({ ...fp, price: 0 })
        this.announcePower(player, def, `opened a Mystery Box 🎁 and signed ${fp.name} (${fp.position}) for free`)
        return ok()
      }
      case 'MYSTERY_AUCTION': {
        if (this.pool.length === 0) return err('The player pool is empty — nothing to auction.')
        const idx = Math.floor(Math.random() * this.pool.length)
        const [fp] = this.pool.splice(idx, 1)
        // Everyone bids blind; only the caller sees who it is (via mysteryReveal).
        // The lot resolves like any other — the winner gets the real player and
        // their identity is revealed to the room on sale.
        this.announcePower(player, def, `sent a mystery player to the block 🎭 — only they know who it is`)
        this.openAuction(fp, player.id, STARTING_BID, { mystery: true, mysteryOwnerId: player.id })
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
        const idx = player.squad.findIndex((s) => s.id === target.fpId)
        if (idx === -1) return err('Pick one of your own players.')
        const [fp] = player.squad.splice(idx, 1)
        player.budget += fp.price // refunded now; re-earns on resale
        const startPrice = Math.max(STARTING_BID, Math.round(fp.price * 0.5))
        this.announcePower(player, def, `put ${fp.name} on a 🔥 Fire Sale (from ${startPrice}M)`)
        this.openAuction(stripPrice(fp), player.id, startPrice, { discounted: true })
        return ok()
      }
      case 'POSITION_SWAP': {
        const mineIdx = player.squad.findIndex((s) => s.id === target.fpId)
        if (mineIdx === -1) return err('Pick one of your own players to trade away.')
        const victim = this.players.get(target.ownerId)
        if (!victim || victim.id === player.id) return err('Pick another manager to swap with.')
        const theirIdx = victim.squad.findIndex((s) => s.id === target.theirFpId)
        if (theirIdx === -1) return err('That player is not in their squad anymore.')
        const mine = player.squad[mineIdx]
        const theirs = victim.squad[theirIdx]
        if (mine.position !== theirs.position)
          return err('You can only swap players in the same position.')
        // Straight one-for-one trade — each side keeps the price they paid, so
        // squad sizes and budgets are untouched.
        player.squad[mineIdx] = theirs
        victim.squad[theirIdx] = mine
        this.announcePower(player, def, `swapped ${mine.name} for ${victim.nickname}'s ${theirs.name} 🔄`)
        return ok()
      }
      case 'POACH': {
        const victim = this.players.get(target.ownerId)
        if (!victim || victim.id === player.id) return err('Pick another manager to poach from.')
        const idx = victim.squad.findIndex((s) => s.id === target.fpId)
        if (idx === -1) return err('That player is not in their squad anymore.')
        if (player.squad.length >= this.settings.squadSize) return err('Your squad is full.')
        const fp = victim.squad[idx]
        // Pay the owner what they paid, while keeping $1M in reserve per spot this
        // purchase won't fill — same rule as a normal bid (see maxBid()).
        const spotsAfter = Math.max(0, this.settings.squadSize - player.squad.length - 1)
        const reserve = spotsAfter * MIN_RESERVE_PER_SPOT
        if (player.budget - fp.price < reserve)
          return err(`Not enough budget — you must reserve $1M per remaining squad spot.`)
        victim.squad.splice(idx, 1)
        victim.budget += fp.price
        player.budget -= fp.price
        player.squad.push({ ...fp }) // keep its recorded price
        this.announcePower(player, def, `poached ${fp.name} from ${victim.nickname} for ${fp.price}M 🤝`)
        return ok()
      }
      case 'BARGAIN': {
        player.pendingDiscount = BARGAIN_DISCOUNT
        this.announcePower(player, def, `lined up a 🏷️ Bargain — ${Math.round(BARGAIN_DISCOUNT * 100)}% off their next win`)
        return ok()
      }
      case 'WILDCARD': {
        // Draw two fresh PLAYABLE cards (never a curse), honoring the per-manager
        // repeat cap. The played WILDCARD is spliced from the hand by usePowerCard()
        // after this returns.
        const drawn = [
          this.drawCardFor(player, { playableOnly: true }),
          this.drawCardFor(player, { playableOnly: true }),
        ]
        player.cards.push(...drawn)
        const names = drawn.map((id) => POWER_CARDS[id].name).join(' & ')
        this.announcePower(player, def, `played a 🎲 Wildcard and drew ${names}`)
        return ok()
      }
      case 'LOOT': {
        if (player.squad.length >= this.settings.squadSize) return err('Your squad is already full.')
        if (this.skippedPool.length === 0) return err('No skipped players to loot right now.')
        const idx = Math.floor(Math.random() * this.skippedPool.length)
        const [fp] = this.skippedPool.splice(idx, 1)
        player.squad.push({ ...fp, price: 0 })
        this.announcePower(player, def, `looted ${fp.name} (${fp.position}) from the skipped pile for free 🎯`)
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
      // Auto "curse" cards fire during the power-round burst where the big
      // overlay gets clobbered — the client surfaces these as a toast instead.
      auto: !!def.auto,
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

  // ---- kicking a manager (host action or majority vote) -------------------
  // Single teardown path used by both hostKick() and a passed vote. Mirrors the
  // clean-up concerns in disconnect(), but actually removes the seat and frees
  // their squad back into the pool.
  removePlayer(targetId, reason) {
    const p = this.players.get(targetId)
    if (!p) return err('That manager is no longer in the room.')

    // Any pending vote referencing this manager is now moot.
    if (this.kickVote && (this.kickVote.targetId === targetId || this.kickVote.votes.has(targetId))) {
      if (this.kickVote.targetId === targetId) this.cancelKickVote()
      else this.kickVote.votes.delete(targetId)
    }

    // Return their signed players to the auction pool so the game keeps flowing.
    if (p.squad.length > 0) {
      for (const s of p.squad) this.pool.push(stripPrice(s))
      this.pushLog('system', `♻️ ${p.squad.length} player${p.squad.length === 1 ? '' : 's'} from ${p.nickname} returned to the pool.`)
    }

    // Fold them out of a live lot before the seat disappears. We keep turnOrder
    // untouched (turnPtr indexes into it) — folding + deleting the seat is enough
    // for isBidderLive()/advanceTurn() to skip them cleanly.
    const wasOnTheClock =
      this.current && this.settings.biddingMode === 'turns' && this.current.turnId === targetId
    if (this.current) {
      if (this.settings.biddingMode === 'turns' && this.current.folded) {
        this.current.folded.add(targetId)
      }
      if (this.current.bidderId === targetId) {
        this.current.bidderId = null
        this.current.bidderName = null
        this.current.price = this.current.startPrice ?? STARTING_BID
      }
    }

    // Drop the seat.
    this.order = this.order.filter((id) => id !== targetId)
    this.players.delete(targetId)
    if (this.pendingPowerAck?.has(targetId)) {
      this.pendingPowerAck.delete(targetId)
    }

    // Hand the crown to the next connected manager if the host was removed.
    if (this.hostId === targetId) {
      const heir = this.connectedPlayers()[0] || this.order.map((id) => this.players.get(id)).find(Boolean)
      this.hostId = heir ? heir.id : null
      if (heir) {
        heir.isHost = true
        this.pushLog('system', `👑 ${heir.nickname} is now the host.`)
      }
    }

    this.pushLog('system', `🥾 ${p.nickname} was removed (${reason}).`)
    this.io.to(p.socketId).emit('kicked', { reason })

    // Keep turn/nomination pointers valid now that the order array shrank.
    if (this.order.length > 0) {
      this.nominatorIndex %= this.order.length
      this.bidRotation %= this.order.length
    } else {
      this.nominatorIndex = 0
      this.bidRotation = 0
    }
    if (this.settings.nominationMode === 'manual' && this.status === 'auction' && !this.current) {
      this.ensureActiveNominator()
    }

    // If the manager on the clock was removed, hand the turn on (also resolves
    // the lot if that leaves a lone standing bidder or nobody able to bid).
    if (this.current && this.settings.biddingMode === 'turns' && wasOnTheClock) this.advanceTurn()
    // Unblock a power-card gate if they were the last holdout.
    if (this.pendingPowerAck) this.checkPowerGate()

    // If the room can no longer sustain an auction, wrap it up.
    if (this.status === 'auction' && this.connectedPlayers().length < 2) this.endGame()
    else this.maybeEndGame()

    this.broadcast()
    return ok()
  }

  hostKick(byPlayerId, targetId) {
    if (byPlayerId !== this.hostId) return err('Only the host can kick a manager.')
    if (targetId === byPlayerId) return err('You cannot kick yourself.')
    if (!this.players.has(targetId)) return err('That manager is no longer in the room.')
    return this.removePlayer(targetId, 'kicked by host')
  }

  startKickVote(byPlayerId, targetId) {
    if (this.kickVote) return err('A vote to kick is already in progress.')
    const starter = this.players.get(byPlayerId)
    const target = this.players.get(targetId)
    if (!starter) return err('You are not in this room.')
    if (!target || !target.connected) return err('That manager is not available to kick.')
    if (targetId === byPlayerId) return err('You cannot vote to kick yourself.')
    if (this.connectedPlayers().length < 3) return err('Need at least 3 managers to hold a vote.')
    this.kickVote = {
      targetId,
      targetName: target.nickname,
      startedById: byPlayerId,
      startedByName: starter.nickname,
      votes: new Map([[byPlayerId, true]]), // starting a vote counts as a Yes
    }
    clearTimeout(this.kickVoteTimer)
    this.kickVoteTimer = setTimeout(() => this.resolveKickVote(), KICK_VOTE_TIMEOUT * 1000)
    this.pushLog('system', `🗳️ ${starter.nickname} started a vote to kick ${target.nickname}.`)
    const resolved = this.evaluateKickVote()
    if (!resolved) this.broadcast()
    return ok()
  }

  castKickVote(byPlayerId, agree) {
    if (!this.kickVote) return err('There is no active vote right now.')
    if (byPlayerId === this.kickVote.targetId) return err('You cannot vote on your own removal.')
    const voter = this.players.get(byPlayerId)
    if (!voter || !voter.connected) return err('You are not able to vote right now.')
    this.kickVote.votes.set(byPlayerId, !!agree)
    const resolved = this.evaluateKickVote()
    if (!resolved) this.broadcast()
    return ok()
  }

  // Tally against the CURRENT eligible electorate (connected, minus the target)
  // so the threshold shrinks correctly if managers leave mid-vote. Returns true
  // if the vote resolved (passed or failed) and cleared itself.
  evaluateKickVote() {
    if (!this.kickVote) return false
    const eligible = this.connectedPlayers().filter((p) => p.id !== this.kickVote.targetId)
    const needed = Math.floor(eligible.length / 2) + 1
    let yes = 0
    let no = 0
    for (const p of eligible) {
      const v = this.kickVote.votes.get(p.id)
      if (v === true) yes += 1
      else if (v === false) no += 1
    }
    if (yes >= needed) {
      const targetId = this.kickVote.targetId
      this.cancelKickVote()
      this.removePlayer(targetId, 'voted out by managers')
      return true
    }
    // Vote can no longer pass even if everyone left decides Yes.
    if (no > eligible.length - needed) {
      const name = this.kickVote.targetName
      this.cancelKickVote()
      this.pushLog('system', `🗳️ The vote to kick ${name} failed.`)
      this.broadcast()
      return true
    }
    return false
  }

  resolveKickVote() {
    if (!this.kickVote) return
    const resolved = this.evaluateKickVote()
    if (resolved) return
    // Timed out without a majority — let it lapse.
    const name = this.kickVote.targetName
    this.cancelKickVote()
    this.pushLog('system', `⌛ The vote to kick ${name} expired.`)
    this.broadcast()
  }

  cancelKickVote() {
    clearTimeout(this.kickVoteTimer)
    this.kickVoteTimer = null
    this.kickVote = null
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
      maxPerPosition: this.maxPerPosition,
      hostId: this.hostId,
      nominatorId: this.nominatorId(),
      awaitingAuto: this.awaitingAuto,
      soldCount: this.soldCount,
      poolCount: this.pool.length,
      poolPositions: this.positionCounts(this.pool),
      pool: this.pool,
      skippedCount: this.skippedPool.length,
      skippedPositions: this.positionCounts(this.skippedPool),
      current: this.current
        ? {
            // Mystery lots are redacted in the shared state — only the caller
            // learns who's really up, via their private `mysteryReveal`.
            fp: this.current.mystery ? mysteryFp(this.current.fp) : this.current.fp,
            price: this.current.price,
            bidderId: this.current.bidderId,
            bidderName: this.current.bidderName,
            timeLeft: this.current.timeLeft,
            nominatorId: this.current.nominatorId,
            discounted: this.current.discounted,
            mystery: !!this.current.mystery,
            mysteryOwnerId: this.current.mysteryOwnerId ?? null,
            minBid: this.minAcceptableBid(),
            biddingMode: this.settings.biddingMode,
            turnId: this.current.turnId,
            turnOrder: this.current.turnOrder,
            folded: this.current.folded ? [...this.current.folded] : [],
          }
        : null,
      players: this.order.map((id) => this.publicPlayer(this.players.get(id))).filter(Boolean),
      log: this.log.slice(-30),
      powerGate: this.pendingPowerAck
        ? {
            pending: [...this.pendingPowerAck],
            reason: this.powerGateReason,
            secondsLeft: this.gateSecondsLeft,
            paused: this.gateComposers.size > 0,
            composing: [...this.gateComposers].map((id) => this.players.get(id)?.nickname).filter(Boolean),
          }
        : null,
      kickVote: this.kickVote ? this.publicKickVote() : null,
    }
  }

  publicKickVote() {
    const v = this.kickVote
    const eligible = this.connectedPlayers().filter((p) => p.id !== v.targetId)
    const needed = Math.floor(eligible.length / 2) + 1
    const yes = []
    const no = []
    for (const [id, agree] of v.votes) {
      if (agree) yes.push(id)
      else no.push(id)
    }
    return {
      targetId: v.targetId,
      targetName: v.targetName,
      startedById: v.startedById,
      startedByName: v.startedByName,
      yes,
      no,
      voted: [...v.votes.keys()],
      eligible: eligible.length,
      needed,
    }
  }

  privateFor(player) {
    const cur = this.current
    return {
      id: player.id,
      isHost: player.isHost,
      cards: player.cards.map((c) => POWER_CARDS[c]),
      maxBid: this.maxBid(player),
      frozen: player.frozen,
      pendingDiscount: player.pendingDiscount,
      // The manager who called a Mystery Auction alone sees who's really up.
      mysteryReveal: cur && cur.mystery && cur.mysteryOwnerId === player.id ? cur.fp : null,
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
// A fully-redacted stand-in for a mystery lot: same id (so client keys/refs stay
// stable) but no identifying details until the player is sold and revealed.
function mysteryFp(fp) {
  return { id: fp.id, name: '???', club: '???', position: '??', rating: null, photo: null, mystery: true }
}
function ok() {
  return { ok: true }
}
function err(message) {
  return { ok: false, error: message }
}
