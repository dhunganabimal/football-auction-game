import { POSITIONS } from '../lib.js'

// Compact position-requirement tracker: shows filled / required per position.
export default function SquadTracker({ positions, reqs, size = 'sm' }) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {POSITIONS.map((pos) => {
        const have = positions[pos] || 0
        const need = reqs[pos] || 0
        const met = have >= need
        return (
          <span
            key={pos}
            className={`chip pos-${pos} ${size === 'sm' ? 'text-[10px]' : 'text-xs'} ${
              met ? 'ring-2 ring-neon-green/60' : 'opacity-80'
            }`}
            title={`${pos}: ${have} of ${need} required`}
          >
            {pos} {have}/{need} {met && '✓'}
          </span>
        )
      })}
    </div>
  )
}
