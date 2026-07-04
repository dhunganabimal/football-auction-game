import { useState } from 'react'
import { useGame } from '../game.jsx'
import { fmtM } from '../lib.js'
import { Avatar } from '../pages/Lobby.jsx'

export default function BidControls() {
  const { state, me, playerId, actions, pushToast } = useGame()
  const cur = state.current
  const myPlayer = state.players.find((p) => p.id === playerId)
  const [custom, setCustom] = useState('')

  const maxBid = me?.maxBid ?? 0
  const minBid = cur.minBid
  const isHighest = cur.bidderId === playerId
  const frozen = (me?.frozen ?? 0) > 0
  const squadFull = myPlayer && myPlayer.squadCount >= state.settings.squadSize
  const locked = frozen || squadFull

  const turns = cur.biddingMode === 'turns'
  const isMyTurn = turns && cur.turnId === playerId
  const iFolded = turns && (cur.folded || []).includes(playerId)
  const turnPlayer = state.players.find((p) => p.id === cur.turnId)

  const bid = async (amount) => {
    if (amount > maxBid) return pushToast('That exceeds your spendable budget.', 'warn')
    await actions.placeBid(amount)
  }

  const quick = [1, 5, 10].map((inc) => cur.price + inc)
  const canAfford = (amt) => amt <= maxBid && amt >= minBid

  // Shared raise controls (BID / +1/+5/+10 / custom) — used in both modes.
  const RaiseControls = (
    <>
      <button
        className="btn-primary w-full py-4 text-2xl animate-pulse-ring"
        disabled={isHighest || !canAfford(minBid)}
        onClick={() => bid(minBid)}
      >
        💥 BID {fmtM(minBid)}
      </button>

      <div className="mt-3 grid grid-cols-3 gap-2">
        {quick.map((amt, i) => (
          <button
            key={amt}
            className="btn-ghost py-3"
            disabled={isHighest || !canAfford(amt)}
            onClick={() => bid(amt)}
          >
            +{[1, 5, 10][i]}M
            <span className="ml-1 text-xs text-slate-400">({fmtM(amt)})</span>
          </button>
        ))}
      </div>

      <div className="mt-3 flex gap-2">
        <input
          type="number"
          className="input flex-1"
          placeholder={`Custom (min ${minBid})`}
          value={custom}
          min={minBid}
          max={maxBid}
          onChange={(e) => setCustom(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && custom) {
              bid(Number(custom))
              setCustom('')
            }
          }}
        />
        <button
          className="btn-ghost px-5"
          disabled={!custom || !canAfford(Number(custom)) || isHighest}
          onClick={() => {
            bid(Number(custom))
            setCustom('')
          }}
        >
          Bid
        </button>
      </div>
    </>
  )

  // ---- Turn-based (circular) bidding --------------------------------------
  if (turns) {
    if (locked) {
      return (
        <div className="panel p-5">
          <div className="rounded-xl border border-neon-pink/30 bg-rose-950/40 p-4 text-center text-rose-200">
            {frozen ? '🧊 You are frozen — you sit this lot out.' : '✅ Your squad is full.'}
          </div>
        </div>
      )
    }
    if (iFolded) {
      return (
        <div className="panel p-5">
          <div className="rounded-xl border border-white/10 bg-black/20 p-4 text-center text-slate-400">
            🙅 You passed on <span className="text-slate-200">{cur.fp.name}</span>. Waiting for the lot to
            close…
          </div>
        </div>
      )
    }
    if (!isMyTurn) {
      return (
        <div className="panel p-5 text-center">
          <div className="text-xs uppercase tracking-widest text-slate-400">On the clock</div>
          <div className="mt-2 flex items-center justify-center gap-2 font-display text-xl font-semibold">
            {turnPlayer && <Avatar id={turnPlayer.id} name={turnPlayer.nickname} size={28} />}
            <span className="text-neon-cyan">{turnPlayer?.nickname || '…'}</span>
          </div>
          <p className="mt-2 text-sm text-slate-400">
            {isHighest
              ? `You lead at ${fmtM(cur.price)} — waiting for others to respond.`
              : 'Waiting for your turn to bid or pass.'}
          </p>
        </div>
      )
    }
    // It's my turn.
    return (
      <div className="panel border-neon-green/40 p-5 shadow-neon">
        <div className="mb-3 flex items-center justify-between text-sm">
          <span className="chip bg-neon-green/20 text-neon-green animate-pop-in">🎯 Your turn</span>
          <span className="text-slate-400">
            Max: <span className="font-semibold text-neon-green">{fmtM(maxBid)}</span>
          </span>
        </div>
        {RaiseControls}
        <button className="btn-danger mt-3 w-full py-3 text-lg" onClick={() => actions.passBid()}>
          🙅 PASS (out for this player)
        </button>
      </div>
    )
  }

  // ---- Open bidding (timed / host) — unchanged behaviour ------------------
  return (
    <div className="panel p-5">
      {locked ? (
        <div className="rounded-xl border border-neon-pink/30 bg-rose-950/40 p-4 text-center text-rose-200">
          {frozen ? '🧊 You are frozen — you cannot bid on this player.' : '✅ Your squad is full.'}
        </div>
      ) : (
        <>
          <div className="mb-3 flex items-center justify-between text-sm">
            <span className="text-slate-400">
              Max you can bid: <span className="font-semibold text-neon-green">{fmtM(maxBid)}</span>
            </span>
            {isHighest && <span className="chip bg-neon-green/20 text-neon-green">You lead ✔</span>}
          </div>
          {RaiseControls}
        </>
      )}
    </div>
  )
}
