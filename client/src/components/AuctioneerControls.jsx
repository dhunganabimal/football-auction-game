import { useGame } from '../game.jsx'
import { fmtM } from '../lib.js'

// Shown only to the host when timerMode === 'host'. The host is the auctioneer:
// there is no countdown, so they decide when each player is sold or skipped.
export default function AuctioneerControls() {
  const { state, actions } = useGame()
  const cur = state.current
  const bidder = state.players.find((p) => p.id === cur.bidderId)

  return (
    <div className="panel border-neon-gold/30 p-4">
      <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-neon-gold">
        🔨 Auctioneer controls
        <span className="text-xs font-normal text-slate-400">— you decide when to close this lot</span>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <button className="btn-primary py-3" disabled={!bidder} onClick={() => actions.sellNow()}>
          {bidder ? `🔨 Sell to ${bidder.nickname} (${fmtM(cur.price)})` : 'No bids yet'}
        </button>
        <button className="btn-ghost py-3" onClick={() => actions.skipNow()}>
          ⏭️ Skip (no sale)
        </button>
      </div>
    </div>
  )
}
