import { useGame } from '../game.jsx'
import { fmtM, posClass } from '../lib.js'
import { Avatar } from '../pages/Lobby.jsx'
import PlayerAvatar from './PlayerAvatar.jsx'

export default function AuctionBlock() {
  const { state } = useGame()
  const cur = state.current
  const turns = cur.biddingMode === 'turns'
  const showTimer = turns || state.settings.timerMode !== 'host'
  const total = state.settings.auctionSeconds
  const pct = showTimer ? Math.max(0, Math.min(1, cur.timeLeft / total)) : 1
  const danger = showTimer && cur.timeLeft <= 5
  const bidder = state.players.find((p) => p.id === cur.bidderId)
  const turnPlayer = turns ? state.players.find((p) => p.id === cur.turnId) : null

  return (
    <div className="panel pitch-stripes relative overflow-hidden p-6">
      {cur.discounted && (
        <div className="absolute right-0 top-4 rotate-3 rounded-l-lg bg-neon-pink px-3 py-1 font-display text-sm font-bold text-white shadow-lg">
          🔥 FIRE SALE
        </div>
      )}

      <div className="flex flex-col items-center gap-6 md:flex-row md:items-stretch">
        {/* Player card */}
        <div className="flex-1">
          <div className="text-xs font-semibold uppercase tracking-widest text-neon-cyan">On the Block</div>
          <div className="mt-1 flex items-center gap-4">
            <PlayerAvatar name={cur.fp.name} position={cur.fp.position} photo={cur.fp.photo} size={72} />
            <h2 className="font-display text-4xl font-bold leading-tight md:text-5xl">{cur.fp.name}</h2>
          </div>
          {turns && (
            <div className="mt-2 flex items-center gap-2 text-sm text-slate-300">
              <span className="text-slate-500">On the clock:</span>
              {turnPlayer && <Avatar id={turnPlayer.id} name={turnPlayer.nickname} size={22} />}
              <span className="font-semibold text-neon-green">{turnPlayer?.nickname || '…'}</span>
            </div>
          )}
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <span className={`chip ${posClass(cur.fp.position)}`}>{cur.fp.position}</span>
            <span className="chip bg-white/10 text-slate-200">{cur.fp.club}</span>
            <span className="chip bg-neon-gold/15 text-neon-gold">★ Rating {cur.fp.rating}</span>
          </div>

          <div className="mt-6 grid grid-cols-2 gap-3">
            <Stat label="Current Bid" value={fmtM(cur.price)} accent="text-neon-gold" />
            <Stat
              label="Highest Bidder"
              value={
                bidder ? (
                  <span className="flex items-center gap-2">
                    <Avatar id={bidder.id} name={bidder.nickname} size={26} />
                    {bidder.nickname}
                  </span>
                ) : (
                  <span className="text-slate-500">No bids yet</span>
                )
              }
            />
          </div>
        </div>

        {/* Timer / no-limit */}
        <div className="flex flex-col items-center justify-center">
          {showTimer ? (
            <div className="relative h-40 w-40">
              <svg className="h-full w-full -rotate-90" viewBox="0 0 100 100">
                <circle cx="50" cy="50" r="44" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="8" />
                <circle
                  cx="50" cy="50" r="44" fill="none"
                  stroke={danger ? '#ff4d8d' : '#39ff88'}
                  strokeWidth="8"
                  strokeLinecap="round"
                  strokeDasharray={2 * Math.PI * 44}
                  strokeDashoffset={2 * Math.PI * 44 * (1 - pct)}
                  style={{ transition: 'stroke-dashoffset 1s linear, stroke 0.3s' }}
                />
              </svg>
              <div
                className={`absolute inset-0 flex flex-col items-center justify-center ${
                  danger ? 'animate-pulse text-neon-pink' : 'text-neon-green'
                }`}
              >
                <span className="font-display text-5xl font-bold">{Math.max(0, cur.timeLeft)}</span>
                <span className="text-xs uppercase tracking-widest text-slate-400">
                  {turns ? 'turn timer' : 'seconds'}
                </span>
              </div>
            </div>
          ) : (
            <div className="flex h-40 w-40 flex-col items-center justify-center rounded-full border-4 border-dashed border-neon-gold/40 text-center">
              <span className="text-4xl">🔨</span>
              <span className="mt-1 font-display text-lg font-bold text-neon-gold">NO LIMIT</span>
              <span className="text-[10px] uppercase tracking-widest text-slate-400">host sells</span>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function Stat({ label, value, accent = 'text-white' }) {
  return (
    <div className="rounded-xl border border-white/10 bg-black/20 px-4 py-3">
      <div className="text-[10px] uppercase tracking-widest text-slate-400">{label}</div>
      <div className={`mt-1 font-display text-xl font-bold ${accent}`}>{value}</div>
    </div>
  )
}
