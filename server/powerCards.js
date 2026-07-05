// Power card catalogue. Each entry describes how the card is presented on the
// client and what kind of target it needs so the UI can prompt correctly.
//
// target:
//   'none'            -> played instantly, no picker
//   'opponent'        -> pick another manager
//   'opponentPlayer'  -> pick a football player owned by another manager
//   'ownPlayer'       -> pick a football player from your own squad
//   'swap'            -> pick one of YOUR players, then an opponent's player of
//                        the same position to trade it for
//
// auto: true            -> a "curse" card. It never enters the hand and is never
//                          chosen by the holder — the moment it is drawn the
//                          server applies its (negative) effect automatically.

export const POWER_CARDS = {
  STEAL: {
    id: 'STEAL',
    name: 'Steal / Snatch',
    icon: '🫳',
    tone: 'danger',
    target: 'opponentPlayer',
    desc: "Forcefully take a player from another manager's squad into yours. You still pay nothing, but you must have squad room and it cannot break your budget reserve.",
  },
  FORCED_RELEASE: {
    id: 'FORCED_RELEASE',
    name: 'Forced Release',
    icon: '⛓️‍💥',
    tone: 'danger',
    target: 'opponentPlayer',
    desc: 'Force an opponent to release one of their players back into the pool. They are refunded the price they paid.',
  },
  FIRE_SALE: {
    id: 'FIRE_SALE',
    name: 'Fire Sale',
    icon: '🔥',
    tone: 'warning',
    target: 'ownPlayer',
    desc: 'Put one of YOUR players straight back on the auction block at a 50% discounted starting price. You are refunded when it re-sells.',
  },
  BUDGET_BOOST: {
    id: 'BUDGET_BOOST',
    name: 'Budget Boost',
    icon: '💰',
    tone: 'good',
    target: 'none',
    desc: 'Instant cash injection of +$5M or +$10M added to your remaining budget.',
  },
  BID_FREEZE: {
    id: 'BID_FREEZE',
    name: 'Bid Freeze',
    icon: '🧊',
    tone: 'warning',
    target: 'opponent',
    desc: 'Freeze an opponent so they cannot bid on the next 2 football players.',
  },
  THAW: {
    id: 'THAW',
    name: 'Thaw Out',
    icon: '🌤️',
    tone: 'good',
    target: 'none',
    desc: 'Instantly melt any freeze on yourself so you can bid again right away. The perfect counter to a Bid Freeze.',
  },
  MYSTERY_BOX: {
    id: 'MYSTERY_BOX',
    name: 'Mystery Box',
    icon: '🎁',
    tone: 'good',
    target: 'none',
    desc: 'Sign a random player straight from the pool into your squad for free. Needs an open squad spot.',
  },
  MYSTERY_AUCTION: {
    id: 'MYSTERY_AUCTION',
    name: 'Mystery Auction',
    icon: '🎭',
    tone: 'warning',
    target: 'none',
    desc: 'Put a hidden player from the pool on the block. Only YOU can see who it really is — everyone else bids totally blind. Could be a world-beater… could be a dud. Their identity is revealed the instant the hammer falls.',
  },
  RAID: {
    id: 'RAID',
    name: 'Cash Raid',
    icon: '💸',
    tone: 'danger',
    target: 'opponent',
    desc: 'Snatch up to $10M straight out of an opponent’s budget and add it to your own.',
  },
  FREEZE_ALL: {
    id: 'FREEZE_ALL',
    name: 'Cold Snap',
    icon: '❄️',
    tone: 'warning',
    target: 'none',
    desc: 'Freeze every other manager for the next 1 player — nobody but you can bid on it.',
  },
  POSITION_SWAP: {
    id: 'POSITION_SWAP',
    name: 'Position Swap',
    icon: '🔄',
    tone: 'warning',
    target: 'swap',
    desc: 'Trade one of your players for an opponent’s player in the SAME position. No money changes hands — each side keeps the price they paid.',
  },
  POACH: {
    id: 'POACH',
    name: 'Poach',
    icon: '🤝',
    tone: 'danger',
    target: 'opponentPlayer',
    desc: 'Sign a player straight out of a rival’s squad — but you pay them the price they paid for it. You need squad room and enough budget to keep your reserve.',
  },
  BARGAIN: {
    id: 'BARGAIN',
    name: 'Bargain',
    icon: '🏷️',
    tone: 'good',
    target: 'none',
    desc: 'The next player you win is 25% off — the discount is applied automatically when the hammer falls.',
  },
  WILDCARD: {
    id: 'WILDCARD',
    name: 'Wildcard',
    icon: '🎲',
    tone: 'good',
    target: 'none',
    desc: 'Not the card you wanted? Discard it and draw TWO fresh power cards in its place.',
  },
  LOOT: {
    id: 'LOOT',
    name: 'Loot',
    icon: '🎯',
    tone: 'good',
    target: 'none',
    desc: 'Grab a random player from the skipped pile for free. Needs an open squad spot and at least one skipped player waiting.',
  },

  // ---- auto-applied "curse" cards (never enter the hand) -------------------
  FINE: {
    id: 'FINE',
    name: 'Tax Bill',
    icon: '🧾',
    tone: 'danger',
    target: 'none',
    auto: true,
    desc: 'Ouch — the taxman cometh. A slice of your remaining budget is deducted the moment you draw this. Applies automatically.',
  },
  INJURY: {
    id: 'INJURY',
    name: 'Injury Blow',
    icon: '🚑',
    tone: 'danger',
    target: 'none',
    auto: true,
    desc: 'Your most recent signing limps off injured and is released straight back into the pool — you get your money back, but you lose the player. Applies automatically.',
  },
  COLD_FEET: {
    id: 'COLD_FEET',
    name: 'Cold Feet',
    icon: '🥶',
    tone: 'danger',
    target: 'none',
    auto: true,
    desc: 'Nerves get the better of you — you seize up and cannot bid on the next player. Applies automatically.',
  },
}

export const POWER_CARD_LIST = Object.values(POWER_CARDS)

// Draw one random card id. `rng` lets callers inject determinism if needed.
//   avoid        (Set/array) soft preference — try not to hand out a card the
//                manager already holds, so hands don't fill up with duplicates.
//   exclude      (Set/array) hard block — never draw these (e.g. a card already
//                dealt the maximum number of times), UNLESS excluding them would
//                leave nothing to draw, in which case the block is ignored.
//   playableOnly (bool)      skip auto "curse" cards — used by Wildcard, which
//                should only ever draw cards you can actually choose to play.
export function drawPowerCard(rng = Math.random, { avoid = null, exclude = null, playableOnly = false } = {}) {
  const toSet = (v) => (v instanceof Set ? v : v ? new Set(v) : null)
  const avoidSet = toSet(avoid)
  const excludeSet = toSet(exclude)

  let ids = Object.keys(POWER_CARDS)
  if (playableOnly) ids = ids.filter((id) => !POWER_CARDS[id].auto)
  // Hard exclusion, but never let it empty the pool.
  let pool = excludeSet ? ids.filter((id) => !excludeSet.has(id)) : ids
  if (pool.length === 0) pool = ids
  // Soft preference: skip in-hand duplicates when we still have other options.
  const preferred = avoidSet ? pool.filter((id) => !avoidSet.has(id)) : pool
  const from = preferred.length ? preferred : pool
  return from[Math.floor(rng() * from.length)]
}
