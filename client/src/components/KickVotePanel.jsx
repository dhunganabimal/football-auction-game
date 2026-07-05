import { useGame } from '../game.jsx'
import { Avatar } from '../pages/Lobby.jsx'

// Fixed banner shown while a vote-to-kick is live. Non-blocking (pinned to the
// top) so the auction stays fully usable while managers weigh in. Eligible
// voters who haven't answered yet get Yes / No buttons; everyone else just sees
// the running tally. Driven entirely by state.kickVote from the server.
export default function KickVotePanel() {
  const { state, playerId, actions } = useGame()
  const vote = state?.kickVote
  if (!vote) return null

  const isTarget = vote.targetId === playerId
  const hasVoted = vote.voted.includes(playerId)
  const canVote = !isTarget && !hasVoted
  const yesCount = vote.yes.length

  return (
    <div className="pointer-events-none fixed inset-x-0 top-3 z-[65] flex justify-center px-3">
      <div className="panel pointer-events-auto w-full max-w-md animate-bounce-in border-neon-pink/40 p-4 shadow-neon">
        <div className="flex items-center gap-3">
          <span className="text-2xl">🗳️</span>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 text-sm">
              <span className="text-slate-400">Vote to kick</span>
              <Avatar id={vote.targetId} name={vote.targetName} size={22} />
              <span className="truncate font-display font-bold text-neon-pink">{vote.targetName}</span>
            </div>
            <div className="mt-0.5 text-xs text-slate-400">
              Started by {vote.startedByName} · <span className="text-neon-green">{yesCount}</span> / {vote.needed}{' '}
              yes needed
              {vote.no.length > 0 && <span className="text-rose-300"> · {vote.no.length} against</span>}
            </div>
          </div>
        </div>

        {isTarget ? (
          <p className="mt-3 text-center text-sm text-rose-300">
            The other managers are voting on removing you…
          </p>
        ) : canVote ? (
          <div className="mt-3 grid grid-cols-2 gap-2">
            <button className="btn-primary py-2" onClick={() => actions.castKickVote(true)}>
              ✅ Kick
            </button>
            <button className="btn-ghost py-2" onClick={() => actions.castKickVote(false)}>
              ❌ Keep
            </button>
          </div>
        ) : (
          <p className="mt-3 text-center text-xs text-slate-500">
            You voted {vote.yes.includes(playerId) ? 'to kick' : 'to keep'} — waiting on the others.
          </p>
        )}
      </div>
    </div>
  )
}
