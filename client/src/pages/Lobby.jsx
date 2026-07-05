import { useGame } from '../game.jsx'
import { POSITIONS, POSITION_LABEL, accentFor, initials } from '../lib.js'

export default function Lobby() {
  const { state, playerId, actions, pushToast } = useGame()
  const isHost = state.hostId === playerId
  const s = state.settings
  const reqTotal = POSITIONS.reduce((n, p) => n + s.positionReqs[p], 0)
  const reqOk = reqTotal <= s.squadSize
  const enoughPlayers = state.players.length >= 2
  const poolOk = POSITIONS.reduce((n, p) => n + (s.poolLimits?.[p] ?? 0), 0) >= s.squadSize

  const update = (patch) => {
    if (!isHost) return
    const next = {
      budget: s.budget,
      squadSize: s.squadSize,
      auctionSeconds: s.auctionSeconds,
      nominationMode: s.nominationMode,
      timerMode: s.timerMode,
      biddingMode: s.biddingMode,
      positionReqs: { ...s.positionReqs },
      poolLimits: { ...s.poolLimits },
      powerCardInterval: s.powerCardInterval,
      ...patch,
    }
    actions.configure(next)
  }
  const updatePos = (pos, val) =>
    update({ positionReqs: { ...s.positionReqs, [pos]: Math.max(0, Number(val) || 0) } })
  const updatePoolLimit = (pos, val) =>
    update({ poolLimits: { ...s.poolLimits, [pos]: Math.max(0, Number(val) || 0) } })
  const poolLimitTotal = POSITIONS.reduce((n, p) => n + (s.poolLimits?.[p] ?? 0), 0)

  const start = async () => {
    if (!reqOk) return pushToast('Position minimums exceed squad size.', 'warn')
    if (!poolOk) return pushToast('Not enough players selected for the auction pool.', 'warn')
    if (!enoughPlayers) return pushToast('Need at least 2 managers to start.', 'warn')
    await actions.startGame()
  }

  const copyCode = () => {
    navigator.clipboard?.writeText(state.code)
    pushToast('Room code copied!', 'success')
  }

  return (
    <div className="mx-auto max-w-5xl p-4 md:p-8">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-bold">Waiting Lobby</h1>
          <p className="text-slate-400">Share the code, tweak the rules, kick off the auction.</p>
        </div>
        <button
          onClick={copyCode}
          className="panel group flex items-center gap-3 px-5 py-3 transition hover:border-neon-green/40"
          title="Click to copy"
        >
          <span className="text-xs uppercase tracking-widest text-slate-400">Room Code</span>
          <span className="font-display text-3xl font-bold tracking-[0.3em] text-neon-green">
            {state.code}
          </span>
          <span className="text-slate-500 group-hover:text-neon-green">⧉</span>
        </button>
      </div>

      <div className="grid gap-6 md:grid-cols-[1.3fr_1fr]">
        {/* Settings */}
        <div className="panel p-6">
          <h2 className="mb-4 font-display text-xl font-semibold">
            Game Settings {!isHost && <span className="text-sm text-slate-500">(host controls)</span>}
          </h2>

          <div className="grid grid-cols-2 gap-4">
            <Field label="Total Budget ($M)">
              <input type="number" min={10} max={1000} className="input" disabled={!isHost}
                value={s.budget} onChange={(e) => update({ budget: Number(e.target.value) })} />
            </Field>
            <Field label="Squad Size">
              <input type="number" min={1} max={25} className="input" disabled={!isHost}
                value={s.squadSize} onChange={(e) => update({ squadSize: Number(e.target.value) })} />
            </Field>
            <Field label={s.biddingMode === 'turns' ? 'Seconds per turn' : 'Bid Timer (sec)'}>
              <input type="number" min={8} max={60} className="input"
                disabled={!isHost || (s.biddingMode !== 'turns' && s.timerMode === 'host')}
                value={s.auctionSeconds} onChange={(e) => update({ auctionSeconds: Number(e.target.value) })} />
            </Field>
            <Field label="Managers">
              <div className="input flex items-center">{state.players.length} / 8 joined</div>
            </Field>
          </div>

          <div className="mt-5">
            <div className="label">Minimum players per position</div>
            <div className="grid grid-cols-4 gap-3">
              {POSITIONS.map((pos) => (
                <div key={pos} className="text-center">
                  <div className={`chip mb-1.5 w-full justify-center pos-${pos}`} title={POSITION_LABEL[pos]}>
                    {pos}
                  </div>
                  <input type="number" min={0} max={15} className="input text-center" disabled={!isHost}
                    value={s.positionReqs[pos]} onChange={(e) => updatePos(pos, e.target.value)} />
                </div>
              ))}
            </div>
            <p className={`mt-2 text-xs ${reqOk ? 'text-slate-500' : 'text-neon-pink'}`}>
              Minimums total {reqTotal} / {s.squadSize} squad slots.
              {!reqOk && ' Reduce minimums or increase squad size.'}
            </p>
          </div>

          <div className="mt-5">
            <div className="label">Players in auction per position</div>
            <div className="grid grid-cols-4 gap-3">
              {POSITIONS.map((pos) => {
                const max = state.maxPerPosition?.[pos] ?? 25
                return (
                  <div key={pos} className="text-center">
                    <div className={`chip mb-1.5 w-full justify-center pos-${pos}`} title={POSITION_LABEL[pos]}>
                      {pos}
                    </div>
                    <input
                      type="number"
                      min={0}
                      max={max}
                      className="input text-center"
                      disabled={!isHost}
                      value={s.poolLimits?.[pos] ?? max}
                      onChange={(e) => updatePoolLimit(pos, e.target.value)}
                    />
                    <div className="mt-1 text-[10px] text-slate-500">of {max} max</div>
                  </div>
                )
              })}
            </div>
            <p className={`mt-2 text-xs ${poolOk ? 'text-slate-500' : 'text-neon-pink'}`}>
              {poolLimitTotal} players will be randomly drawn into this auction.
              {!poolOk && ' Increase these to cover your squad size.'}
            </p>
          </div>

          <div className="mt-5">
            <div className="label">Power card frequency</div>
            <div className="flex items-center gap-3">
              <input
                type="number"
                min={0}
                max={50}
                className="input w-28 text-center"
                disabled={!isHost}
                value={s.powerCardInterval}
                onChange={(e) => update({ powerCardInterval: Math.max(0, Number(e.target.value) || 0) })}
              />
              <span className="text-xs text-slate-400">
                {Number(s.powerCardInterval) > 0
                  ? `Everyone draws a power card after every ${s.powerCardInterval} player${s.powerCardInterval === 1 ? '' : 's'} sold.`
                  : 'Power cards are disabled for this game.'}
              </span>
            </div>
          </div>

          <div className="mt-5">
            <div className="label">Player draw</div>
            <div className="grid grid-cols-2 gap-2">
              {[
                { key: 'random', icon: '🎲', title: 'Random auto-draw', sub: 'Players served automatically' },
                { key: 'manual', icon: '🧑‍⚖️', title: 'Managers nominate', sub: 'Take turns picking from the pool' },
              ].map((m) => {
                const on = s.nominationMode === m.key
                return (
                  <button
                    key={m.key}
                    disabled={!isHost}
                    onClick={() => update({ nominationMode: m.key })}
                    className={`rounded-xl border p-3 text-left transition ${
                      on
                        ? 'border-neon-green/60 bg-neon-green/10 shadow-neon'
                        : 'border-white/10 bg-white/[0.03] hover:border-white/20'
                    } ${!isHost && 'cursor-not-allowed opacity-70'}`}
                  >
                    <div className="font-display font-semibold">
                      {m.icon} {m.title}
                    </div>
                    <div className="text-xs text-slate-400">{m.sub}</div>
                  </button>
                )
              })}
            </div>
          </div>

          <div className="mt-5">
            <div className="label">Bidding mode</div>
            <div className="grid gap-2 sm:grid-cols-3">
              {[
                {
                  key: 'turns',
                  biddingMode: 'turns',
                  timerMode: 'timed',
                  icon: '🔄',
                  title: 'Turn-based (circular)',
                  sub: `Take turns — raise or pass · ${s.auctionSeconds}s/turn`,
                },
                {
                  key: 'timed',
                  biddingMode: 'open',
                  timerMode: 'timed',
                  icon: '⏱️',
                  title: 'Open · Timed',
                  sub: `Free-for-all · ${s.auctionSeconds}s per player`,
                },
                {
                  key: 'host',
                  biddingMode: 'open',
                  timerMode: 'host',
                  icon: '🔨',
                  title: 'Open · Host',
                  sub: 'No clock — host sells / skips',
                },
              ].map((m) => {
                const on =
                  s.biddingMode === m.biddingMode &&
                  (m.biddingMode === 'turns' || s.timerMode === m.timerMode)
                return (
                  <button
                    key={m.key}
                    disabled={!isHost}
                    onClick={() => update({ biddingMode: m.biddingMode, timerMode: m.timerMode })}
                    className={`rounded-xl border p-3 text-left transition ${
                      on
                        ? 'border-neon-green/60 bg-neon-green/10 shadow-neon'
                        : 'border-white/10 bg-white/[0.03] hover:border-white/20'
                    } ${!isHost && 'cursor-not-allowed opacity-70'}`}
                  >
                    <div className="font-display font-semibold">
                      {m.icon} {m.title}
                    </div>
                    <div className="text-xs text-slate-400">{m.sub}</div>
                  </button>
                )
              })}
            </div>
          </div>
        </div>

        {/* Players */}
        <div className="panel p-6">
          <h2 className="mb-4 font-display text-xl font-semibold">Managers</h2>
          <ul className="space-y-2">
            {state.players.map((p) => (
              <li key={p.id} className="flex items-center gap-3 rounded-xl bg-white/[0.03] px-3 py-2">
                <Avatar id={p.id} name={p.nickname} />
                <span className="font-semibold">{p.nickname}</span>
                {p.isHost && <span className="chip bg-neon-gold/20 text-neon-gold">HOST</span>}
                {p.id === playerId && <span className="chip bg-white/10 text-slate-300">you</span>}
                {!p.connected && <span className="chip bg-rose-500/20 text-rose-300">offline</span>}
                {isHost && p.id !== playerId && (
                  <button
                    className="btn-ghost ml-auto shrink-0 px-2 py-1 text-xs text-rose-300 hover:border-rose-400/50"
                    onClick={() => actions.kickPlayer(p.id)}
                    title={`Kick ${p.nickname}`}
                  >
                    🥾 Kick
                  </button>
                )}
              </li>
            ))}
          </ul>

          {isHost ? (
            <button className="btn-primary mt-6 w-full py-3 text-lg" disabled={!reqOk || !poolOk || !enoughPlayers} onClick={start}>
              🚀 Start Auction
            </button>
          ) : (
            <div className="mt-6 rounded-xl border border-white/10 bg-white/[0.03] p-4 text-center text-slate-400">
              Waiting for the host to start…
            </div>
          )}
          <button className="btn-ghost mt-3 w-full" onClick={actions.leave}>Leave Room</button>
        </div>
      </div>
    </div>
  )
}

function Field({ label, children }) {
  return (
    <div>
      <label className="label">{label}</label>
      {children}
    </div>
  )
}

export function Avatar({ id, name, size = 34 }) {
  const c = accentFor(id)
  return (
    <span
      className="flex items-center justify-center rounded-full font-display text-sm font-bold text-pitch-950"
      style={{ width: size, height: size, background: c, boxShadow: `0 0 12px ${c}66` }}
    >
      {initials(name)}
    </span>
  )
}
