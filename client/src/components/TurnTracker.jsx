import { useGame } from '../game.jsx'
import { fmtM } from '../lib.js'
import { Avatar } from '../pages/Lobby.jsx'

// Horizontal queue for circular (turn-based) bidding: shows the seating order,
// highlights who's on the clock, greys out managers who have passed, and crowns
// the current high bidder.
export default function TurnTracker() {
  const { state } = useGame()
  const cur = state.current
  if (!cur || cur.biddingMode !== 'turns' || !cur.turnOrder) return null

  const folded = new Set(cur.folded || [])
  const byId = (id) => state.players.find((p) => p.id === id)

  return (
    <div className="panel p-4">
      <div className="mb-3 flex items-center justify-between">
        <div className="text-xs font-semibold uppercase tracking-widest text-neon-cyan">
          🔄 Bidding order
        </div>
        <div className="text-xs text-slate-400">Raise or pass — pass = out for this player</div>
      </div>

      <div className="flex flex-wrap gap-2">
        {cur.turnOrder.map((id) => {
          const p = byId(id)
          if (!p) return null
          const isTurn = id === cur.turnId
          const isLeader = id === cur.bidderId
          const hasFolded = folded.has(id)
          return (
            <div
              key={id}
              className={[
                'flex items-center gap-2 rounded-xl border px-3 py-2 transition',
                isTurn
                  ? 'border-neon-green/60 bg-neon-green/10 shadow-neon animate-pulse-ring'
                  : 'border-white/10 bg-white/[0.03]',
                hasFolded ? 'opacity-40 grayscale' : '',
              ].join(' ')}
            >
              <Avatar id={p.id} name={p.nickname} size={26} />
              <span
                className={`font-display text-sm font-semibold ${
                  hasFolded ? 'text-slate-500 line-through' : 'text-slate-100'
                }`}
              >
                {p.nickname}
              </span>
              {isLeader && !hasFolded && (
                <span className="chip shimmer-gold text-amber-100 ring-1 ring-neon-gold/40">
                  👑 {fmtM(cur.price)}
                </span>
              )}
              {isTurn && <span className="chip bg-neon-green/20 text-neon-green">⏳ now</span>}
              {hasFolded && <span className="chip bg-white/10 text-slate-400">out</span>}
            </div>
          )
        })}
      </div>
    </div>
  )
}
