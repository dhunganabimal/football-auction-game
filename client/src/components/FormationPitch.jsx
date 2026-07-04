import PlayerAvatar from './PlayerAvatar.jsx'
import { fmtM } from '../lib.js'

// Renders a squad on a pitch, grouped into rows by position — forwards at
// the top, goalkeeper at the bottom — like a FotMob/formation lineup card.
// Rows size themselves to however many players a manager actually bought at
// each position (this game doesn't enforce a fixed XI), so a squad heavy on
// forwards just gets a wider forward row.
const ROW_ORDER = ['FWD', 'MID', 'DEF', 'GK']

export default function FormationPitch({ squad }) {
  const rows = ROW_ORDER.map((pos) => ({
    pos,
    players: squad.filter((s) => s.position === pos),
  }))

  return (
    <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-b from-emerald-900/50 to-emerald-950/70 p-4">
      {/* Pitch line markings */}
      <svg
        className="pointer-events-none absolute inset-0 h-full w-full opacity-25"
        viewBox="0 0 100 140"
        preserveAspectRatio="none"
      >
        <rect x="1" y="1" width="98" height="138" fill="none" stroke="white" strokeWidth="0.5" />
        <line x1="1" y1="70" x2="99" y2="70" stroke="white" strokeWidth="0.5" />
        <circle cx="50" cy="70" r="10" fill="none" stroke="white" strokeWidth="0.5" />
        <rect x="25" y="1" width="50" height="20" fill="none" stroke="white" strokeWidth="0.5" />
        <rect x="25" y="119" width="50" height="20" fill="none" stroke="white" strokeWidth="0.5" />
        <circle cx="50" cy="70" r="0.8" fill="white" />
      </svg>

      <div className="relative flex min-h-[380px] flex-col justify-between gap-3 py-2">
        {rows.map(({ pos, players }) => (
          <div key={pos} className="flex flex-wrap items-start justify-center gap-3">
            {players.length === 0 ? (
              <span className="text-[11px] uppercase tracking-widest text-white/30">no {pos}</span>
            ) : (
              players.map((s) => (
                <div key={s.id} className="flex w-16 flex-col items-center text-center">
                  <PlayerAvatar name={s.name} position={s.position} photo={s.photo} size={46} />
                  <span className="mt-1 w-full truncate text-[10px] font-semibold leading-tight text-white drop-shadow">
                    {s.name.split(' ').slice(-1)[0]}
                  </span>
                  <span className="text-[9px] font-semibold text-neon-gold">{fmtM(s.price)}</span>
                </div>
              ))
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
