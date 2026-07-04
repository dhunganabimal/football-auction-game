import { useGame } from '../game.jsx'
import { fmtM, posClass } from '../lib.js'

const TONE_RING = {
  danger: 'ring-neon-pink/60 shadow-[0_0_40px_rgba(255,77,141,0.5)]',
  warning: 'ring-neon-gold/60 shadow-[0_0_40px_rgba(255,210,74,0.5)]',
  good: 'ring-neon-green/60 shadow-[0_0_40px_rgba(57,255,136,0.5)]',
}

// Full-screen animated overlay for nominations, sales, and power cards.
export default function PowerOverlay() {
  const { overlay, dismissOverlay } = useGame()
  if (!overlay) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
      onClick={dismissOverlay}
    >
      {overlay.kind === 'nominate' && <NominateCard {...overlay} />}
      {overlay.kind === 'sold' && <SoldCard {...overlay} />}
      {overlay.kind === 'powerRound' && <PowerRoundBanner />}
      {overlay.kind === 'draw' && <DrawCard card={overlay.card} />}
      {overlay.kind === 'played' && <PlayedCard {...overlay} />}
    </div>
  )
}

function NominateCard({ fp, discounted }) {
  return (
    <div className="animate-pop-in panel px-8 py-6 text-center">
      <div className="text-xs font-semibold uppercase tracking-widest text-neon-cyan">
        {discounted ? '🔥 Fire Sale — on the block' : 'On the block'}
      </div>
      <div className="mt-2 font-display text-4xl font-bold">{fp.name}</div>
      <div className="mt-2 flex items-center justify-center gap-3">
        <span className={`chip ${posClass(fp.position)}`}>{fp.position}</span>
        <span className="text-slate-400">{fp.club}</span>
        <span className="chip bg-white/10 text-white">★ {fp.rating}</span>
      </div>
    </div>
  )
}

function SoldCard({ fp, price, buyerName }) {
  return (
    <div className="animate-pop-in text-center">
      <div className="font-display text-6xl font-bold text-neon-green drop-shadow-[0_0_30px_rgba(57,255,136,0.6)]">
        SOLD!
      </div>
      <div className="mt-3 text-2xl font-semibold">{fp.name}</div>
      <div className="mt-1 text-lg text-slate-300">
        to <span className="text-neon-cyan">{buyerName}</span> for{' '}
        <span className="text-neon-gold">{fmtM(price)}</span>
      </div>
    </div>
  )
}

function PowerRoundBanner() {
  return (
    <div className="animate-pop-in text-center">
      <div className="text-7xl">⚡</div>
      <div className="mt-2 font-display text-5xl font-bold text-neon-gold drop-shadow-[0_0_30px_rgba(255,210,74,0.6)]">
        POWER CARD ROUND
      </div>
      <div className="mt-2 text-slate-300">Every manager draws a card…</div>
    </div>
  )
}

function DrawCard({ card }) {
  return (
    <div className="text-center">
      <div className="mb-3 text-sm font-semibold uppercase tracking-widest text-neon-cyan">
        You drew a Power Card
      </div>
      <div
        className={`animate-card-flip mx-auto w-72 rounded-2xl border border-white/15 bg-gradient-to-b from-slate-800 to-pitch-900 p-6 ring-2 ${
          TONE_RING[card.tone] || TONE_RING.good
        }`}
      >
        <div className="text-6xl">{card.icon}</div>
        <div className="mt-3 font-display text-2xl font-bold">{card.name}</div>
        <div className="mt-2 text-sm text-slate-300">{card.desc}</div>
      </div>
      <div className="mt-3 text-xs text-slate-400">Play it from your hand when the time is right.</div>
    </div>
  )
}

function PlayedCard({ byName, card, text }) {
  return (
    <div className="animate-pop-in text-center">
      <div className="text-6xl">{card.icon}</div>
      <div className="mt-2 font-display text-3xl font-bold text-neon-gold">{card.name}</div>
      <div className="mt-2 text-lg">
        <span className="text-neon-cyan">{byName}</span> {text.replace(card.icon, '')}
      </div>
    </div>
  )
}
