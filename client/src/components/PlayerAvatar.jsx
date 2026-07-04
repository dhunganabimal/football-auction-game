import { useEffect, useState } from 'react'
import { playerInitials, POSITION_COLORS } from '../lib.js'
import { getPlayerPhoto } from '../wikiPhoto.js'

// Shows a real player photo whenever one can be found. If a `photo` prop is
// passed explicitly (e.g. you added your own licensed image URL to a
// player's `photo` field in server/players.js), that's used as-is. Otherwise
// this looks the player up on Wikipedia automatically by name. If no photo
// can be found (or the image fails to load), it falls back to a colorful
// jersey icon with the player's initials so there's always something to show.
export default function PlayerAvatar({ name, position, photo, size = 40, className = '' }) {
  const [autoPhoto, setAutoPhoto] = useState(null)
  const [failed, setFailed] = useState(false)
  const color = POSITION_COLORS[position] || '#94a3b8'

  useEffect(() => {
    setFailed(false)
    if (photo) return // explicit photo provided — no lookup needed
    let cancelled = false
    getPlayerPhoto(name).then((url) => {
      if (!cancelled) setAutoPhoto(url)
    })
    return () => {
      cancelled = true
    }
  }, [name, photo])

  const resolved = photo || autoPhoto
  const showPhoto = Boolean(resolved) && !failed

  return (
    <span
      className={`relative inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full ring-2 ${className}`}
      style={{ width: size, height: size, ringColor: `${color}55`, background: `${color}22` }}
    >
      {showPhoto ? (
        <img
          src={resolved}
          alt={name}
          title={photo ? name : `${name} — photo via Wikipedia`}
          onError={() => setFailed(true)}
          className="h-full w-full object-cover"
          loading="lazy"
        />
      ) : (
        <JerseyIcon color={color} initials={playerInitials(name)} size={size} />
      )}
    </span>
  )
}

function JerseyIcon({ color, initials, size }) {
  const fontSize = Math.max(9, Math.round(size * 0.32))
  return (
    <svg viewBox="0 0 48 48" width={size} height={size} className="h-full w-full">
      <path
        d="M16 6 L6 12 L11 21 L16 18 L16 42 L32 42 L32 18 L37 21 L42 12 L32 6 L28 9 L20 9 Z"
        fill={color}
        opacity="0.9"
      />
      <text
        x="24"
        y="29"
        textAnchor="middle"
        fontFamily="Rajdhani, system-ui, sans-serif"
        fontWeight="700"
        fontSize={fontSize}
        fill="#04140c"
      >
        {initials}
      </text>
    </svg>
  )
}
