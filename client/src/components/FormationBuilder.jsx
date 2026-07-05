import { useEffect, useMemo, useRef, useState } from 'react'
import PlayerAvatar from './PlayerAvatar.jsx'
import { fmtM, posClass } from '../lib.js'

// Outfield shape per formation (10 players); a GK slot is always prepended,
// giving 11 starting slots. Rows render forwards-at-top like a lineup card.
const FORMATIONS = {
  '4-4-2': ['DEF', 'DEF', 'DEF', 'DEF', 'MID', 'MID', 'MID', 'MID', 'FWD', 'FWD'],
  '4-3-3': ['DEF', 'DEF', 'DEF', 'DEF', 'MID', 'MID', 'MID', 'FWD', 'FWD', 'FWD'],
  '3-5-2': ['DEF', 'DEF', 'DEF', 'MID', 'MID', 'MID', 'MID', 'MID', 'FWD', 'FWD'],
  '4-5-1': ['DEF', 'DEF', 'DEF', 'DEF', 'MID', 'MID', 'MID', 'MID', 'MID', 'FWD'],
  '5-3-2': ['DEF', 'DEF', 'DEF', 'DEF', 'DEF', 'MID', 'MID', 'MID', 'FWD', 'FWD'],
  '3-4-3': ['DEF', 'DEF', 'DEF', 'MID', 'MID', 'MID', 'MID', 'FWD', 'FWD', 'FWD'],
  '4-2-4': ['DEF', 'DEF', 'DEF', 'DEF', 'MID', 'MID', 'FWD', 'FWD', 'FWD', 'FWD'],
}
const ROW_ORDER = ['FWD', 'MID', 'DEF', 'GK']
const rolesFor = (name) => ['GK', ...FORMATIONS[name]]

// Greedily fill each slot with the best-rated unused player of the matching
// position, then backfill any empty slots with whoever's left. Overflow (a
// squad of more than 11) drops onto the bench.
function buildLineup(squad, roles) {
  const pool = [...squad].sort((a, b) => b.rating - a.rating)
  const used = new Set()
  const slots = roles.map((role) => {
    const pick = pool.find((p) => !used.has(p.id) && p.position === role)
    if (pick) used.add(pick.id)
    return pick ? pick.id : null
  })
  for (let i = 0; i < slots.length; i++) {
    if (slots[i] == null) {
      const pick = pool.find((p) => !used.has(p.id))
      if (pick) {
        used.add(pick.id)
        slots[i] = pick.id
      }
    }
  }
  const bench = pool.filter((p) => !used.has(p.id)).map((p) => p.id)
  return { slots, bench }
}

export default function FormationBuilder({ squad, storageKey }) {
  const byId = useMemo(() => new Map(squad.map((s) => [s.id, s])), [squad])
  const squadKey = useMemo(() => squad.map((s) => s.id).sort().join(','), [squad])

  const [formation, setFormation] = useState('4-3-3')
  const [lineup, setLineup] = useState(() => buildLineup(squad, rolesFor('4-3-3')))
  const [sel, setSel] = useState(null) // tap-to-move selection: {kind, index?/id}
  const dragRef = useRef(null) // active native-drag source

  // Restore a saved formation for this squad, else auto-build one.
  useEffect(() => {
    let restored = null
    try {
      const raw = storageKey && localStorage.getItem(storageKey)
      if (raw) {
        const saved = JSON.parse(raw)
        const savedIds = [...(saved.slots || []).filter(Boolean), ...(saved.bench || [])].sort().join(',')
        if (saved.formation && FORMATIONS[saved.formation] && savedIds === squadKey) restored = saved
      }
    } catch {
      restored = null
    }
    if (restored) {
      setFormation(restored.formation)
      setLineup({ slots: restored.slots, bench: restored.bench })
    } else {
      setFormation('4-3-3')
      setLineup(buildLineup(squad, rolesFor('4-3-3')))
    }
    setSel(null)
    // Re-run only when the underlying squad changes (per manager card).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [squadKey, storageKey])

  // Persist edits so a reload keeps each manager's chosen XI.
  useEffect(() => {
    if (!storageKey) return
    try {
      localStorage.setItem(storageKey, JSON.stringify({ formation, ...lineup }))
    } catch {
      /* storage full / unavailable — non-fatal */
    }
  }, [formation, lineup, storageKey])

  const roles = rolesFor(formation)

  const chooseFormation = (name) => {
    setFormation(name)
    setLineup(buildLineup(squad, rolesFor(name)))
    setSel(null)
  }

  // Move whatever is being dragged/selected onto a destination.
  //   dest: { kind: 'slot', index } | { kind: 'bench' }
  const drop = (dest) => {
    const src = dragRef.current || sel
    dragRef.current = null
    setSel(null)
    if (!src) return
    setLineup((prev) => {
      const slots = [...prev.slots]
      let bench = [...prev.bench]
      const draggedId = src.kind === 'slot' ? slots[src.index] : src.id
      if (draggedId == null) return prev
      if (src.kind === 'slot') slots[src.index] = null
      else bench = bench.filter((id) => id !== draggedId)

      if (dest.kind === 'slot') {
        const occupant = slots[dest.index]
        slots[dest.index] = draggedId
        if (occupant != null) {
          if (src.kind === 'slot') slots[src.index] = occupant // swap slots
          else bench.push(occupant) // bump the displaced starter to the bench
        }
      } else if (!bench.includes(draggedId)) {
        bench.push(draggedId)
      }
      return { slots, bench }
    })
  }

  // Tap handling: first tap picks a player up, second tap drops them.
  const tapSource = (src) => setSel((cur) => (isSame(cur, src) ? null : src))
  const onPlayerTap = (src, filled) => {
    if (sel) drop(src.kind === 'slot' ? { kind: 'slot', index: src.index } : { kind: 'bench' })
    else if (filled) tapSource(src)
  }

  const rows = ROW_ORDER.map((role) => ({
    role,
    slots: roles.map((r, i) => ({ role: r, index: i })).filter((s) => s.role === role),
  })).filter((row) => row.slots.length > 0)

  return (
    <div>
      {/* Formation picker */}
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <span className="text-xs uppercase tracking-widest text-slate-400">Formation</span>
        {Object.keys(FORMATIONS).map((name) => (
          <button
            key={name}
            onClick={() => chooseFormation(name)}
            className={`chip px-2.5 py-1 text-xs ${
              formation === name ? 'bg-neon-green text-pitch-950' : 'bg-white/5 text-slate-300 hover:bg-white/10'
            }`}
          >
            {name}
          </button>
        ))}
        <span className="ml-auto text-[11px] text-slate-500">Drag or tap players to rearrange</span>
      </div>

      {/* Pitch */}
      <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-b from-emerald-900/50 to-emerald-950/70 p-4">
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
        </svg>

        <div className="relative flex min-h-[380px] flex-col justify-between gap-3 py-2">
          {rows.map((row) => (
            <div key={row.role} className="flex flex-wrap items-start justify-center gap-3">
              {row.slots.map(({ role, index }) => (
                <Slot
                  key={index}
                  role={role}
                  player={lineup.slots[index] ? byId.get(lineup.slots[index]) : null}
                  selected={isSame(sel, { kind: 'slot', index })}
                  onDragStartSrc={() => (dragRef.current = { kind: 'slot', index })}
                  onDropHere={() => drop({ kind: 'slot', index })}
                  onTap={(filled) => onPlayerTap({ kind: 'slot', index }, filled)}
                />
              ))}
            </div>
          ))}
        </div>
      </div>

      {/* Bench */}
      <div
        className="mt-3 rounded-2xl border border-dashed border-white/15 bg-white/[0.02] p-3"
        onDragOver={(e) => e.preventDefault()}
        onDrop={() => drop({ kind: 'bench' })}
        onClick={() => sel && drop({ kind: 'bench' })}
      >
        <div className="mb-2 flex items-center gap-2 text-xs uppercase tracking-widest text-slate-400">
          🪑 Bench
          <span className="chip bg-white/10 text-slate-300">{lineup.bench.length}</span>
        </div>
        {lineup.bench.length === 0 ? (
          <p className="py-2 text-center text-[11px] text-slate-500">
            No subs — drop a starter here to bench them.
          </p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {lineup.bench.map((id) => {
              const p = byId.get(id)
              if (!p) return null
              return (
                <div
                  key={id}
                  draggable
                  onDragStart={() => (dragRef.current = { kind: 'bench', id })}
                  onClick={(e) => {
                    e.stopPropagation()
                    onPlayerTap({ kind: 'bench', id }, true)
                  }}
                  className={`flex cursor-grab items-center gap-2 rounded-lg border bg-white/[0.03] p-1.5 pr-2.5 text-sm active:cursor-grabbing ${
                    isSame(sel, { kind: 'bench', id }) ? 'border-neon-green ring-2 ring-neon-green/50' : 'border-white/10'
                  }`}
                >
                  <PlayerAvatar name={p.name} position={p.position} photo={p.photo} size={26} />
                  <span className={`chip ${posClass(p.position)} w-9 justify-center text-[10px]`}>{p.position}</span>
                  <span className="max-w-[110px] truncate">{p.name}</span>
                  <span className="text-xs text-neon-gold">{fmtM(p.price)}</span>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

function Slot({ role, player, selected, onDragStartSrc, onDropHere, onTap }) {
  const mismatch = player && player.position !== role
  return (
    <div
      onDragOver={(e) => e.preventDefault()}
      onDrop={onDropHere}
      onClick={() => onTap(Boolean(player))}
      draggable={Boolean(player)}
      onDragStart={player ? onDragStartSrc : undefined}
      className={`flex w-16 flex-col items-center rounded-xl p-1 text-center transition ${
        selected ? 'ring-2 ring-neon-green bg-neon-green/10' : ''
      } ${player ? 'cursor-grab active:cursor-grabbing' : 'cursor-pointer'}`}
      title={player ? `${player.name} · ${player.position}` : `Empty ${role} slot`}
    >
      {player ? (
        <>
          <div className={mismatch ? 'rounded-full ring-2 ring-amber-400' : ''}>
            <PlayerAvatar name={player.name} position={player.position} photo={player.photo} size={46} />
          </div>
          <span className="mt-1 w-full truncate text-[10px] font-semibold leading-tight text-white drop-shadow">
            {player.name.split(' ').slice(-1)[0]}
          </span>
          <span className="text-[9px] font-semibold text-neon-gold">{fmtM(player.price)}</span>
        </>
      ) : (
        <>
          <div className="flex h-[46px] w-[46px] items-center justify-center rounded-full border-2 border-dashed border-white/25 text-[10px] text-white/40">
            {role}
          </div>
          <span className="mt-1 text-[9px] uppercase tracking-wider text-white/30">empty</span>
        </>
      )}
    </div>
  )
}

function isSame(a, b) {
  if (!a || !b || a.kind !== b.kind) return false
  return a.kind === 'slot' ? a.index === b.index : a.id === b.id
}
