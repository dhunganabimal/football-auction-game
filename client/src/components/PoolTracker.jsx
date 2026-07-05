import { POSITIONS, POSITION_LABEL } from '../lib.js'

// Shows how many players are still left in the pool per position, e.g.
// "12 FWD · 8 DEF · 3 GK · 7 MID". Helps managers judge scarcity before
// they blow their budget on an early forward. Optionally also shows how many
// skipped (unsold) players are waiting per position, in a separate pool so
// they don't get lost among everyone else still left to be drawn.
export default function PoolTracker({ poolPositions, total, skippedPositions, skippedTotal, className = '' }) {
  if (!poolPositions) return null
  return (
    <div className={className}>
      <div className="flex flex-wrap items-center gap-1.5">
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
      {skippedPositions && Number.isFinite(skippedTotal) && skippedTotal > 0 && (
        <div className="mt-1 flex flex-wrap items-center gap-1.5">
          <span className="text-[10px] uppercase tracking-wide text-slate-500">Skipped pool:</span>
          {POSITIONS.map((pos) => {
            const n = skippedPositions[pos] || 0
            if (n === 0) return null
            return (
              <span
                key={pos}
                className={`chip pos-${pos} text-[10px] opacity-80`}
                title={`${n} ${POSITION_LABEL[pos]}${n === 1 ? '' : 's'} sitting in the skipped pool`}
              >
                {pos} {n}
              </span>
            )
          })}
          <span className="text-[10px] text-slate-500">· {skippedTotal} total</span>
        </div>
      )}
    </div>
  )
}
