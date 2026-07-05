import { POSITIONS, POSITION_LABEL } from '../lib.js'

// Shows how many players are still left in the pool per position, e.g.
// "12 FWD · 8 DEF · 3 GK · 7 MID". Helps managers judge scarcity before
// they blow their budget on an early forward.
export default function PoolTracker({ poolPositions, total, className = '' }) {
  if (!poolPositions) return null
  return (
    <div className={`flex flex-wrap items-center gap-1.5 ${className}`}>
      {POSITIONS.map((pos) => {
        const n = poolPositions[pos] || 0
        return (
          <span
            key={pos}
            className={`chip pos-${pos} text-[10px] ${n === 0 ? 'opacity-40' : ''}`}
            title={`${n} ${POSITION_LABEL[pos]}${n === 1 ? '' : 's'} left in the pool`}
          >
            {pos} {n}
          </span>
        )
      })}
      {Number.isFinite(total) && (
        <span className="text-[10px] text-slate-500">· {total} left</span>
      )}
    </div>
  )
}
