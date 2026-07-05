import { useMemo, useState } from 'react'
import { useGame } from '../game.jsx'
import { POSITIONS, fmtM, posClass } from '../lib.js'
import PlayerAvatar from './PlayerAvatar.jsx'

export default function NominationPanel() {
  const { state, actions } = useGame()
  const [filter, setFilter] = useState('ALL')
  const [query, setQuery] = useState('')

  const list = useMemo(() => {
    return state.pool
      .filter((p) => (filter === 'ALL' ? true : p.position === filter))
      .filter((p) => p.name.toLowerCase().includes(query.toLowerCase()))
      .sort((a, b) => b.rating - a.rating)
  }, [state.pool, filter, query])

  // Remaining players per position, so the filter chips double as a scarcity view.
  const counts = useMemo(() => {
    const c = { ALL: state.pool.length }
    for (const pos of POSITIONS) c[pos] = 0
    for (const p of state.pool) c[p.position] = (c[p.position] || 0) + 1
    return c
  }, [state.pool])

  return (
    <div className="panel p-5">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="font-display text-2xl font-bold text-neon-green">Your turn to nominate ⚡</h2>
          <p className="text-sm text-slate-400">Pick a player to bring to the auction block.</p>
        </div>
        <button className="btn-ghost text-sm" onClick={() => actions.passNomination()}>
          Pass turn
        </button>
      </div>

      <div className="mb-3 flex flex-wrap items-center gap-2">
        {['ALL', ...POSITIONS].map((pos) => (
          <button
            key={pos}
            onClick={() => setFilter(pos)}
            className={`chip px-3 py-1 ${
              filter === pos ? 'bg-neon-green text-pitch-950' : 'bg-white/5 text-slate-300 hover:bg-white/10'
            }`}
          >
            {pos} <span className="ml-1 opacity-70">{counts[pos] ?? 0}</span>
          </button>
        ))}
        <input
          className="input ml-auto max-w-[200px] py-1.5"
          placeholder="Search players…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </div>

      <div className="grid max-h-[420px] grid-cols-1 gap-2 overflow-y-auto pr-1 sm:grid-cols-2">
        {list.map((p) => (
          <button
            key={p.id}
            onClick={() => actions.nominate(p.id)}
            className="group flex items-center gap-3 rounded-xl border border-white/10 bg-white/[0.03] p-3 text-left transition hover:border-neon-green/50 hover:bg-neon-green/5"
          >
            <PlayerAvatar name={p.name} position={p.position} photo={p.photo} size={38} />
            <span className={`chip ${posClass(p.position)} w-11 justify-center`}>{p.position}</span>
            <div className="min-w-0 flex-1">
              <div className="truncate font-semibold group-hover:text-neon-green">{p.name}</div>
              <div className="truncate text-xs text-slate-400">{p.club}</div>
            </div>
            <div className="text-right">
              <div className="font-display font-bold text-neon-gold">★ {p.rating}</div>
              <div className="text-[10px] text-slate-500">~{fmtM(p.base)}</div>
            </div>
          </button>
        ))}
        {list.length === 0 && (
          <div className="col-span-full py-8 text-center text-slate-500">No players match.</div>
        )}
      </div>
    </div>
  )
}
