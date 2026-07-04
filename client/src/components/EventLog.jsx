import { useGame } from '../game.jsx'

const STYLE = {
  system: 'text-slate-400',
  nominate: 'text-neon-cyan',
  bid: 'text-slate-200',
  sold: 'text-neon-green font-semibold',
  skip: 'text-amber-300',
  power: 'text-neon-gold font-semibold',
}
const ICON = {
  system: 'ℹ️',
  nominate: '📢',
  bid: '💸',
  sold: '✅',
  skip: '⏭️',
  power: '⚡',
}

export default function EventLog() {
  const { state } = useGame()
  const items = [...state.log].reverse()

  return (
    <div className="panel flex h-full max-h-[600px] flex-col p-4">
      <h2 className="mb-3 font-display text-lg font-semibold">Live Feed</h2>
      <div className="flex-1 space-y-1.5 overflow-y-auto pr-1">
        {items.length === 0 && <div className="text-sm text-slate-500">The auction is about to begin…</div>}
        {items.map((e, i) => (
          <div
            key={`${e.at}-${i}`}
            className={`flex gap-2 rounded-lg px-2 py-1.5 text-sm ${i === 0 ? 'bg-white/[0.04] animate-slide-up' : ''} ${
              STYLE[e.type] || 'text-slate-300'
            }`}
          >
            <span className="shrink-0">{ICON[e.type] || '•'}</span>
            <span className="leading-snug">{e.text}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
