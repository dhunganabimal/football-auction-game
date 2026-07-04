// Power card catalogue. Each entry describes how the card is presented on the
// client and what kind of target it needs so the UI can prompt correctly.
//
// target:
//   'none'            -> played instantly, no picker
//   'opponent'        -> pick another manager
//   'opponentPlayer'  -> pick a football player owned by another manager
//   'ownPlayer'       -> pick a football player from your own squad

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
}

export const POWER_CARD_LIST = Object.values(POWER_CARDS)

// Draw one random card id. `rng` lets callers inject determinism if needed.
export function drawPowerCard(rng = Math.random) {
  const ids = Object.keys(POWER_CARDS)
  return ids[Math.floor(rng() * ids.length)]
}
