import { useState } from 'react'
import { useGame } from '../game.jsx'
import { fmtM, posClass } from '../lib.js'
import { Avatar } from '../pages/Lobby.jsx'
import PlayerAvatar from './PlayerAvatar.jsx'
import SquadTracker from './SquadTracker.jsx'
import FormationPitch from './FormationPitch.jsx'
import FormationBuilder from './FormationBuilder.jsx'

// Final standings. Ranked by: complete squad first, then squad rating total.
export default function EndScreen() {
  const { state, actions, playerId } = useGame()
  const [view, setView] = useState('pitch') // 'pitch' | 'list'

  const squadRating = (p) => p.squad.reduce((n, s) => n + s.rating, 0)
  const ranked = [...state.players].sort(
    (a, b) => Number(b.complete) - Number(a.complete) || squadRating(b) - squadRating(a)
  )
  const medals = ['🥇', '🥈', '🥉']

  return (
    <div className="mx-auto max-w-4xl p-4 md:p-8">
      <header className="mb-6 text-center">
        <div className="text-5xl">🏆</div>
        <h1 className="mt-2 font-display text-4xl font-bold">Full Time!</h1>
        <p className="text-slate-400">Final squads and standings for room {state.code}.</p>

        <div className="mt-4 inline-flex rounded-full border border-white/10 bg-white/[0.03] p-1">
          {[
            { key: 'pitch', label: '⚽ Pitch' },
            { key: 'list', label: '📋 List' },
          ].map((v) => (
            <button
              key={v.key}
              onClick={() => setView(v.key)}
              className={`rounded-full px-4 py-1.5 text-sm font-semibold transition ${
                view === v.key ? 'bg-neon-green text-pitch-950 shadow-neon' : 'text-slate-300 hover:text-white'
              }`}
            >
              {v.label}
            </button>
          ))}
        </div>
      </header>

      <div className="space-y-4">
        {ranked.map((p, i) => (
          <div key={p.id} className="panel p-5">
            <div className="flex items-center gap-3">
              <span className="w-8 text-center text-2xl">{medals[i] || `#${i + 1}`}</span>
              <Avatar id={p.id} name={p.nickname} size={40} />
              <div className="flex-1">
                <div className="font-display text-xl font-bold">{p.nickname}</div>
                <div className="text-sm text-slate-400">
                  {fmtM(p.budget)} left · squad rating {squadRating(p)} ·{' '}
                  {p.complete ? (
                    <span className="text-neon-green">requirements met ✓</span>
                  ) : (
                    <span className="text-amber-300">incomplete</span>
                  )}
                </div>
              </div>
              <div className="hidden md:block">
                <SquadTracker positions={p.positions} reqs={state.settings.positionReqs} />
              </div>
            </div>

            {p.id === playerId && (
              <div className="mt-2 rounded-lg bg-neon-green/10 px-3 py-1.5 text-xs text-neon-green">
                ⚽ This is your squad — pick a formation and drag players between the XI and the bench.
              </div>
            )}

            <div className="mt-3">
              {view === 'pitch' ? (
                p.id === playerId ? (
                  <FormationBuilder squad={p.squad} storageKey={`fa_formation_${state.code}_${p.id}`} />
                ) : (
                  <FormationPitch squad={p.squad} />
                )
              ) : (
                <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-3 md:grid-cols-4">
                  {p.squad.map((s) => (
                    <div key={s.id} className="flex items-center gap-2 rounded-lg bg-white/[0.03] p-2 text-sm">
                      <PlayerAvatar name={s.name} position={s.position} photo={s.photo} size={24} />
                      <span className={`chip ${posClass(s.position)} w-9 justify-center text-[10px]`}>
                        {s.position}
                      </span>
                      <span className="flex-1 truncate">{s.name}</span>
                      <span className="text-xs text-neon-gold">{fmtM(s.price)}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      <div className="mt-6 text-center">
        <button className="btn-primary px-8 py-3" onClick={actions.leave}>
          Back to Home
        </button>
      </div>
    </div>
  )
}
