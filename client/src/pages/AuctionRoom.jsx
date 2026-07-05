import { useGame } from '../game.jsx'
import AuctionBlock from '../components/AuctionBlock.jsx'
import BidControls from '../components/BidControls.jsx'
import TurnTracker from '../components/TurnTracker.jsx'
import AuctioneerControls from '../components/AuctioneerControls.jsx'
import NominationPanel from '../components/NominationPanel.jsx'
import ManagerBoard from '../components/ManagerBoard.jsx'
import PowerCardHand from '../components/PowerCardHand.jsx'
import EventLog from '../components/EventLog.jsx'
import EndScreen from '../components/EndScreen.jsx'
import PoolTracker from '../components/PoolTracker.jsx'
import { fmtM } from '../lib.js'

export default function AuctionRoom() {
  const { state, me, playerId, actions } = useGame()
  const myPlayer = state.players.find((p) => p.id === playerId)
  const isHost = state.hostId === playerId
  const isRandom = state.settings.nominationMode === 'random'
  const isMyNomination =
    !isRandom && state.status === 'auction' && !state.current && state.nominatorId === playerId
  const nominator = state.players.find((p) => p.id === state.nominatorId)

  if (state.status === 'ended') return <EndScreen />

  return (
    <div className="mx-auto max-w-[1400px] p-3 md:p-5">
      {/* Header */}
      <header className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="animate-float text-3xl">⚽</span>
          <div>
            <div className="font-display text-xl font-bold leading-none">
              Room <span className="text-gradient">{state.code}</span>
            </div>
            <div className="text-xs text-slate-400">
              {state.soldCount} sold · {state.poolCount} in pool
              {state.settings.powerCardInterval > 0 &&
                ` · next power card at ${(Math.floor(state.soldCount / state.settings.powerCardInterval) + 1) * state.settings.powerCardInterval}`}
            </div>
            <PoolTracker
              poolPositions={state.poolPositions}
              skippedPositions={state.skippedPositions}
              skippedTotal={state.skippedCount}
              className="mt-1.5"
            />
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="panel px-4 py-2 text-right">
            <div className="text-[10px] uppercase tracking-widest text-slate-400">Your budget</div>
            <div className="font-display text-xl font-bold text-neon-gold">{fmtM(myPlayer?.budget)}</div>
          </div>
          {isHost && (
            <button className="btn-ghost text-sm" onClick={() => actions.endGame()}>
              End Game
            </button>
          )}
        </div>
      </header>

      <div className="grid gap-4 lg:grid-cols-[300px_1fr_320px]">
        {/* Left — managers / leaderboard */}
        <div className="order-2 animate-fade-in lg:order-1">
          <ManagerBoard />
        </div>

        {/* Center — auction stage */}
        <div className="order-1 space-y-4 lg:order-2">
          {state.current ? (
            <div key={state.current.fp.id} className="animate-slide-up space-y-4">
              <AuctionBlock />
              {state.current.biddingMode === 'turns' && <TurnTracker />}
              <BidControls />
              {isHost && state.settings.timerMode === 'host' && <AuctioneerControls />}
            </div>
          ) : isMyNomination ? (
            <div className="animate-slide-up">
              <NominationPanel />
            </div>
          ) : (
            <WaitingForNomination random={isRandom} nominator={nominator} />
          )}
          <PowerCardHand />
        </div>

        {/* Right — live feed */}
        <div className="order-3 animate-fade-in">
          <EventLog />
        </div>
      </div>
    </div>
  )
}

function WaitingForNomination({ random, nominator }) {
  if (random) {
    return (
      <div className="panel pitch-stripes flex flex-col items-center justify-center gap-3 p-12 text-center">
        <div className="animate-pulse text-5xl">🎲</div>
        <div className="font-display text-2xl font-semibold">Drawing the next player…</div>
        <p className="text-slate-400">A random footballer is about to hit the auction block.</p>
      </div>
    )
  }
  return (
    <div className="panel pitch-stripes flex flex-col items-center justify-center gap-3 p-12 text-center">
      <div className="animate-pulse text-5xl">⏳</div>
      <div className="font-display text-2xl font-semibold">
        Waiting for <span className="text-neon-cyan">{nominator?.nickname || 'the next manager'}</span>
      </div>
      <p className="text-slate-400">They are choosing the next player to bring to auction.</p>
    </div>
  )
}
