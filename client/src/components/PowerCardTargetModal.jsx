import { useGame } from '../game.jsx'
import { fmtM, posClass } from '../lib.js'
import { Avatar } from '../pages/Lobby.jsx'

// Target picker for a card being played — pick an opponent, an opponent's
// player, one of your own players, or just confirm for no-target cards.
// Shared by the regular hand (PowerCardHand) and the post-power-round
// decision gate (PowerCardGate), so both play through the exact same flow.
export default function PowerCardTargetModal({ card, onClose }) {
  const { state, playerId, actions } = useGame()
  const opponents = state.players.filter((p) => p.id !== playerId && p.connected)
  const mine = state.players.find((p) => p.id === playerId)

  const play = async (target) => {
    const res = await actions.usePowerCard(card.id, target)
    if (res.ok) onClose()
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 p-4" onClick={onClose}>
      <div className="panel w-full max-w-lg p-6 animate-pop-in" onClick={(e) => e.stopPropagation()}>
        <div className="mb-4 flex items-start gap-3">
          <span className="text-4xl">{card.icon}</span>
          <div className="min-w-0 flex-1">
            <h3 className="font-display text-xl font-bold">{card.name}</h3>
            <p className="text-sm text-slate-400">{card.desc}</p>
          </div>
          <button
            className="btn-ghost -mt-1 -mr-1 shrink-0 rounded-full px-3 py-1 text-lg leading-none"
            onClick={onClose}
            aria-label="Cancel"
            title="Cancel"
          >
            ✕
          </button>
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
