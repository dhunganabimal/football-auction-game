import { useGame } from '../game.jsx'

const TONES = {
  info: 'border-white/15 bg-slate-800/90',
  error: 'border-neon-pink/40 bg-rose-950/90 text-rose-100',
  warn: 'border-neon-gold/40 bg-amber-950/80 text-amber-100',
  success: 'border-neon-green/40 bg-emerald-950/80 text-emerald-100',
}

export default function Toasts() {
  const { toasts } = useGame()
  return (
    <div className="pointer-events-none fixed inset-x-0 top-4 z-[80] flex flex-col items-center gap-2 px-4">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={`animate-slide-up pointer-events-auto max-w-md rounded-xl border px-4 py-2.5 text-sm font-medium shadow-lg backdrop-blur ${
            TONES[t.tone] || TONES.info
          }`}
        >
          {t.text}
        </div>
      ))}
    </div>
  )
}
