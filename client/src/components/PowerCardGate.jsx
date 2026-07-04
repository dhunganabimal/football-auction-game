import { useState } from 'react'
import { useGame } from '../game.jsx'
import PowerCardTargetModal from './PowerCardTargetModal.jsx'

const TONE = {
  danger: 'from-rose-900/60 to-pitch-900 ring-neon-pink/40',
  warning: 'from-amber-900/50 to-pitch-900 ring-neon-gold/40',
  good: 'from-emerald-900/50 to-pitch-900 ring-neon-green/40',
}

// Right after a power-card round, the next auction is paused until every
// manager has answered this: play a card now, or move on? That way nobody's
// stuck deciding whether to use a fresh card while the next player is
// already ticking away on the clock — and, since cards can only be played
// between lots anyway, this is the one guaranteed window to use one.
export default function PowerCardGate() {
  const { state, me, playerId, actions } = useGame()
  const [active, setActive] = useState(null)

  const gate = state?.powerGate
  const waitingOnMe = gate?.pending?.includes(playerId)
  if (!waitingOnMe) return null

  const cards = me?.cards || []
  const othersLeft = gate.pending.length - 1

  return (
    <div className="fixed inset-0 z-[55] flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm">
      <div className="panel w-full max-w-lg animate-pop-in p-6">
        <div className="mb-1 text-center text-xs font-semibold uppercase tracking-widest text-neon-gold">
          ⚡ Power Card Round
        </div>
        <h2 className="text-center font-display text-2xl font-bold">
          Use a card now, or start the next auction?
        </h2>
        <p className="mt-1 text-center text-sm text-slate-400">
          The next player won't go up for auction until everyone has answered.
        </p>

        {cards.length > 0 ? (
          <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
            {cards.map((card, idx) => (
              <div
                key={`${card.id}-${idx}`}
                className={`flex flex-col rounded-xl border border-white/10 bg-gradient-to-b p-3 ring-1 ${
                  TONE[card.tone] || TONE.good
                }`}
              >
                <div className="text-3xl">{card.icon}</div>
                <div className="mt-1 font-display text-sm font-bold leading-tight">{card.name}</div>
                <p className="mt-1 flex-1 text-[11px] leading-snug text-slate-300">{card.desc}</p>
                <button className="btn-primary mt-2 w-full py-1.5 text-sm" onClick={() => setActive(card)}>
                  Play
                </button>
              </div>
            ))}
          </div>
        ) : (
          <p className="mt-4 text-center text-sm text-slate-500">You have no cards to play right now.</p>
        )}

        <button className="btn-primary mt-5 w-full py-3 text-lg" onClick={() => actions.acknowledgePowerRound()}>
          🚀 Start Next Auction
        </button>
        {othersLeft > 0 && (
          <p className="mt-2 text-center text-xs text-slate-500">
            Waiting on {othersLeft} other manager{othersLeft === 1 ? '' : 's'} too.
          </p>
        )}
      </div>

      {active && <PowerCardTargetModal card={active} onClose={() => setActive(null)} />}
    </div>
  )
}
