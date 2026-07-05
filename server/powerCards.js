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
  SHIELD: {
    id: 'SHIELD',
    name: 'Shield',
    icon: '🛡️',
    tone: 'good',
    target: 'none',
    desc: 'Protect yourself for the next 2 players — you cannot be frozen, stolen from, raided or forced to release while your shield holds.',
  },
  MYSTERY_BOX: {
    id: 'MYSTERY_BOX',
    name: 'Mystery Box',
    icon: '🎁',
    tone: 'good',
    target: 'none',
    desc: 'Sign a random player straight from the pool into your squad for free. Needs an open squad spot.',
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
}

export const POWER_CARD_LIST = Object.values(POWER_CARDS)

// Draw one random card id. `rng` lets callers inject determinism if needed.
// `avoid` (a Set/array of ids) is a soft preference — we try to hand out a card
// the manager isn't already holding so hands don't fill up with duplicates, but
// fall back to any card once every option is already held.
export function drawPowerCard(rng = Math.random, avoid = null) {
  const ids = Object.keys(POWER_CARDS)
  const avoidSet = avoid instanceof Set ? avoid : avoid ? new Set(avoid) : null
  const pool = avoidSet ? ids.filter((id) => !avoidSet.has(id)) : ids
  const from = pool.length ? pool : ids
  return from[Math.floor(rng() * from.length)]
}
