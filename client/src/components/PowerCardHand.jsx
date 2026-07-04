import { useState } from 'react'
import { useGame } from '../game.jsx'
import { fmtM, posClass } from '../lib.js'
import { Avatar } from '../pages/Lobby.jsx'

const TONE = {
  danger: 'from-rose-900/60 to-pitch-900 ring-neon-pink/40',
  warning: 'from-amber-900/50 to-pitch-900 ring-neon-gold/40',
  good: 'from-emerald-900/50 to-pitch-900 ring-neon-green/40',
}

export default function PowerCardHand() {
  const { me } = useGame()
  const [active, setActive] = useState(null) // card pending a target
  const cards = me?.cards || []

  if (cards.length === 0) return null

  return (
    <div className="panel p-4">
      <h2 className="mb-3 flex items-center gap-2 font-display text-lg font-semibold">
        🃏 Your Power Cards
        <span className="chip bg-neon-gold/20 text-neon-gold">{cards.length}</span>
      </h2>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {cards.map((card, idx) => (
          <div
            key={`${card.id}-${idx}`}
            className={`flex flex-col rounded-xl border border-white/10 bg-gradient-to-b p-3 ring-1 ${
              TONE[card.tone] || TONE.good
            }`}
          >
            <div className="text-3xl">{card.icon}</div>
            <div className="mt-1 font-display text-sm font-bold leading-tight">{card.name}</div>
            <p className="mt-1 flex-1 text-[11px] leading-snug text-slate-300">{card.desc}</p>
            <button className="btn-primary mt-2 w-full py-1.5 text-sm" onClick={() => setActive(card)}>
              Play
            </button>
          </div>
        ))}
      </div>

      {active && <TargetModal card={active} onClose={() => setActive(null)} />}
    </div>
  )
}

function TargetModal({ card, onClose }) {
  const { state, playerId, actions } = useGame()
  const opponents = state.players.filter((p) => p.id !== playerId && p.connected)
  const mine = state.players.find((p) => p.id === playerId)

  const play = async (target) => {
    const res = await actions.usePowerCard(card.id, target)
    if (res.ok) onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4" onClick={onClose}>
      <div
        className="panel w-full max-w-lg p-6 animate-pop-in"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-center gap-3">
          <span className="text-4xl">{card.icon}</span>
          <div>
            <h3 className="font-display text-xl font-bold">{card.name}</h3>
            <p className="text-sm text-slate-400">{card.desc}</p>
          </div>
        </div>

        {card.target === 'none' && (
          <button className="btn-primary w-full py-3" onClick={() => play({})}>
            Activate Now
          </button>
        )}

        {card.target === 'opponent' && (
          <div className="space-y-2">
            <div className="label">Choose an opponent</div>
            {opponents.map((p) => (
              <button
                key={p.id}
                className="flex w-full items-center gap-3 rounded-xl border border-white/10 bg-white/[0.03] p-3 text-left hover:border-neon-green/50"
                onClick={() => play({ opponentId: p.id })}
              >
                <Avatar id={p.id} name={p.nickname} size={30} />
                <span className="flex-1 font-semibold">{p.nickname}</span>
                <span className="text-xs text-slate-400">{fmtM(p.budget)}</span>
              </button>
            ))}
          </div>
        )}

        {card.target === 'opponentPlayer' && (
          <TargetPlayerList
            owners={opponents}
            reqs={state.settings.positionReqs}
            onPick={(ownerId, fpId) => play({ ownerId, fpId })}
            empty="Opponents have no players to target yet."
          />
        )}

        {card.target === 'ownPlayer' && (
          <TargetPlayerList
            owners={mine ? [mine] : []}
            onPick={(_ownerId, fpId) => play({ fpId })}
            empty="You have no players to select yet."
          />
        )}

        <button className="btn-ghost mt-4 w-full" onClick={onClose}>
          Cancel
        </button>
      </div>
    </div>
  )
}

function TargetPlayerList({ owners, onPick, empty }) {
  const anyPlayers = owners.some((o) => o.squad.length > 0)
  if (!anyPlayers) return <div className="py-6 text-center text-slate-500">{empty}</div>
  return (
    <div className="max-h-72 space-y-4 overflow-y-auto pr-1">
      {owners.map((o) => (
        <div key={o.id}>
          <div className="mb-1.5 flex items-center gap-2 text-sm font-semibold text-slate-300">
            <Avatar id={o.id} name={o.nickname} size={22} /> {o.nickname}
          </div>
          <div className="grid grid-cols-1 gap-1.5 sm:grid-cols-2">
            {o.squad.map((s) => (
              <button
                key={s.id}
                className="flex items-center gap-2 rounded-lg border border-white/10 bg-white/[0.03] p-2 text-left text-sm hover:border-neon-pink/50"
                onClick={() => onPick(o.id, s.id)}
              >
                <span className={`chip ${posClass(s.position)} w-9 justify-center text-[10px]`}>
                  {s.position}
                </span>
                <span className="flex-1 truncate">{s.name}</span>
                <span className="text-xs text-neon-gold">{fmtM(s.price)}</span>
              </button>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}
