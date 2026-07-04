import { useState } from 'react'
import { useGame } from '../game.jsx'
import { fmtM, posClass } from '../lib.js'
import { Avatar } from '../pages/Lobby.jsx'
import PlayerAvatar from './PlayerAvatar.jsx'
import SquadTracker from './SquadTracker.jsx'

export default function ManagerBoard() {
  const { state, playerId } = useGame()
  const [openId, setOpenId] = useState(playerId)

  const ranked = [...state.players].sort(
    (a, b) => Number(b.complete) - Number(a.complete) || b.squadCount - a.squadCount || b.budget - a.budget
  )

  return (
    <div className="panel p-4">
      <h2 className="mb-3 font-display text-lg font-semibold">Managers</h2>
      <div className="space-y-2">
        {ranked.map((p, i) => {
          const isYou = p.id === playerId
          const nominating = state.nominatorId === p.id && !state.current
          const leading = state.current?.bidderId === p.id
          const open = openId === p.id
          return (
            <div
              key={p.id}
              className={`rounded-xl border bg-white/[0.02] transition ${
                isYou ? 'border-neon-green/40' : 'border-white/10'
              }`}
            >
              <button
                className="flex w-full items-center gap-2.5 p-2.5 text-left"
                onClick={() => setOpenId(open ? null : p.id)}
              >
                <span className="w-4 text-center font-display text-sm text-slate-500">{i + 1}</span>
                <Avatar id={p.id} name={p.nickname} size={30} />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    <span className="truncate font-semibold">{p.nickname}</span>
                    {p.isHost && <span className="text-[10px] text-neon-gold">★</span>}
                    {!p.connected && <span className="text-[10px] text-rose-400">offline</span>}
                  </div>
                  <div className="text-xs text-slate-400">
                    {fmtM(p.budget)} · {p.squadCount}/{state.settings.squadSize} players
                  </div>
                </div>
                <div className="flex flex-col items-end gap-1">
                  {nominating && <span className="chip bg-neon-cyan/20 text-neon-cyan">nominating</span>}
                  {leading && <span className="chip bg-neon-green/20 text-neon-green">leading</span>}
                  {p.frozen > 0 && <span className="chip bg-sky-400/20 text-sky-200">🧊 {p.frozen}</span>}
                  {p.cardCount > 0 && <span className="chip bg-neon-gold/20 text-neon-gold">🃏 {p.cardCount}</span>}
                  {p.complete && <span className="chip bg-neon-green/20 text-neon-green">✓ set</span>}
                </div>
              </button>

              {open && (
                <div className="border-t border-white/10 p-3">
                  <SquadTracker positions={p.positions} reqs={state.settings.positionReqs} />
                  <ul className="mt-2 space-y-1">
                    {p.squad.length === 0 && <li className="text-xs text-slate-500">No players yet.</li>}
                    {p.squad.map((s) => (
                      <li key={s.id} className="flex items-center gap-2 text-sm">
                        <PlayerAvatar name={s.name} position={s.position} photo={s.photo} size={22} />
                        <span className={`chip ${posClass(s.position)} w-10 justify-center text-[10px]`}>
                          {s.position}
                        </span>
                        <span className="flex-1 truncate">{s.name}</span>
                        <span className="text-xs text-neon-gold">{fmtM(s.price)}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
