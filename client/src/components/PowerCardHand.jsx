import { useState } from 'react'
import { useGame } from '../game.jsx'
import PowerCardTargetModal from './PowerCardTargetModal.jsx'

const TONE = {
  danger: 'from-rose-900/60 to-pitch-900 ring-neon-pink/40 hover:shadow-[0_0_28px_rgba(255,77,141,0.45)]',
  warning: 'from-amber-900/50 to-pitch-900 ring-neon-gold/40 hover:shadow-[0_0_28px_rgba(255,210,74,0.45)]',
  good: 'from-emerald-900/50 to-pitch-900 ring-neon-green/40 hover:shadow-[0_0_28px_rgba(57,255,136,0.45)]',
}

export default function PowerCardHand() {
  const { state, me } = useGame()
  const [active, setActive] = useState(null) // card pending a target
  const cards = me?.cards || []
  const liveAuction = Boolean(state?.current)

  if (cards.length === 0) return null

  return (
    <div className="panel p-4">
      <h2 className="mb-3 flex items-center gap-2 font-display text-lg font-semibold">
        🃏 Your Power Cards
        <span className="chip bg-neon-gold/20 text-neon-gold animate-glow-pulse">{cards.length}</span>
      </h2>
      {liveAuction && (
        <p className="mb-3 text-xs text-slate-400">
          ⏳ Cards can only be played between lots — wait for this player to be sold.
        </p>
      )}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {cards.map((card, idx) => (
          <div
            key={`${card.id}-${idx}`}
            className={`group flex flex-col rounded-xl border border-white/10 bg-gradient-to-b p-3 ring-1 transition-transform duration-150 hover:-translate-y-1 ${
              TONE[card.tone] || TONE.good
            }`}
          >
            <div className="text-3xl transition-transform duration-150 group-hover:scale-110">{card.icon}</div>
            <div className="mt-1 font-display text-sm font-bold leading-tight">{card.name}</div>
            <p className="mt-1 flex-1 text-[11px] leading-snug text-slate-300">{card.desc}</p>
            <button
              className="btn-primary mt-2 w-full py-1.5 text-sm disabled:cursor-not-allowed disabled:opacity-40"
              disabled={liveAuction}
              onClick={() => setActive(card)}
            >
              Play
            </button>
          </div>
        ))}
      </div>

      {active && <PowerCardTargetModal card={active} onClose={() => setActive(null)} />}
    </div>
  )
}
