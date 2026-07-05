import { useState } from 'react'
import { useGame } from '../game.jsx'
import PowerCardTargetModal from './PowerCardTargetModal.jsx'

const TONE = {
  danger: 'from-rose-900/60 to-pitch-900 ring-neon-pink/40 hover:shadow-[0_0_28px_rgba(255,77,141,0.45)]',
  warning: 'from-amber-900/50 to-pitch-900 ring-neon-gold/40 hover:shadow-[0_0_28px_rgba(255,210,74,0.45)]',
  good: 'from-emerald-900/50 to-pitch-900 ring-neon-green/40 hover:shadow-[0_0_28px_rgba(57,255,136,0.45)]',
}

// The auction pauses between lots whenever a manager is holding a power card, so
// nobody forgets the card sitting in their hand. Two flavours, keyed by
// state.powerGate.reason:
//   'round'   -> a power-card round just dealt everyone a fresh card
//   'between' -> ordinary lot resolved; you still hold at least one card
// Either way the next player won't go up until everyone still deciding answers.
export default function PowerCardGate() {
  const { state, me, playerId, actions } = useGame()
  const [active, setActive] = useState(null)

  const gate = state?.powerGate
  const waitingOnMe = gate?.pending?.includes(playerId)
  if (!waitingOnMe) return null

  const cards = me?.cards || []
  const othersLeft = gate.pending.length - 1
  const isRound = gate.reason === 'round'
  const secondsLeft = gate.secondsLeft ?? null
  // Someone (possibly you) has the target-picker open — the countdown is frozen.
  const paused = gate.paused
  const myNick = state.players.find((p) => p.id === playerId)?.nickname
  const composing = (gate.composing || []).filter((n) => n !== myNick)
  const urgent = !paused && secondsLeft != null && secondsLeft <= 3

  return (
    <div className="fixed inset-0 z-[55] flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm">
      <div className="panel animated-border w-full max-w-lg animate-bounce-in p-6">
        <div className="mb-1 text-center text-xs font-semibold uppercase tracking-widest text-neon-gold">
          {isRound ? '⚡ Power Card Round' : '🃏 Your Power Cards'}
        </div>
        <h2 className="text-center font-display text-2xl font-bold">
          {isRound
            ? 'Use a card now, or start the next auction?'
            : 'Play a power card before the next player?'}
        </h2>
        <p className="mt-1 text-center text-sm text-slate-400">
          {isRound
            ? "The next player won't go up for auction until everyone has answered."
            : "You're holding a card — this is your window to play it between lots."}
        </p>

        {cards.length > 0 ? (
          <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
            {cards.map((card, idx) => (
              <div
                key={`${card.id}-${idx}`}
                className={`group flex flex-col rounded-xl border border-white/10 bg-gradient-to-b p-3 ring-1 transition-transform duration-150 hover:-translate-y-1 ${
                  TONE[card.tone] || TONE.good
                }`}
              >
                <div className="text-3xl transition-transform duration-150 group-hover:scale-110">
                  {card.icon}
                </div>
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

        {/* Countdown to the auto-start — or a paused banner while someone picks. */}
        <div className="mt-4 text-center text-sm">
          {paused ? (
            <span className="inline-flex items-center gap-2 rounded-full bg-fuchsia-500/15 px-3 py-1 font-medium text-fuchsia-200">
              ⏸ {composing.length > 0
                ? `${composing.join(', ')} ${composing.length === 1 ? 'is' : 'are'} playing a card…`
                : 'Playing a card…'}
            </span>
          ) : secondsLeft != null ? (
            <span
              className={`inline-flex items-center gap-2 rounded-full px-3 py-1 font-semibold ${
                urgent ? 'animate-pulse bg-neon-pink/20 text-neon-pink' : 'bg-white/5 text-slate-300'
              }`}
            >
              ⏱ Next auction {isRound ? 'starts' : 'in'}{' '}
              <span className="font-display text-base">{Math.max(0, secondsLeft)}s</span>
            </span>
          ) : null}
        </div>

        <button className="btn-primary mt-3 w-full py-3 text-lg" onClick={() => actions.acknowledgePowerRound()}>
          {isRound ? '🚀 Start Next Auction' : '▶ Continue Auction'}
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
