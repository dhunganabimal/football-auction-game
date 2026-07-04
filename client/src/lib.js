export const POSITIONS = ['GK', 'DEF', 'MID', 'FWD']

export const POSITION_LABEL = {
  GK: 'Goalkeeper',
  DEF: 'Defender',
  MID: 'Midfielder',
  FWD: 'Forward',
}

export const fmtM = (n) => `$${n ?? 0}M`

export const posClass = (pos) => `pos-${pos}`

// Deterministic accent color per manager id (for avatars / highlights).
const ACCENTS = ['#39ff88', '#25e5ff', '#ffd24a', '#ff4d8d', '#c6ff4d', '#a78bfa', '#fb923c', '#34d399']
export function accentFor(id = '') {
  let h = 0
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) >>> 0
  return ACCENTS[h % ACCENTS.length]
}

export function initials(name = '') {
  return name.trim().slice(0, 2).toUpperCase() || '??'
}

// Player initials for the jersey avatar — prefer first letter of first + last
// name (e.g. "Kylian Mbappé" -> "KM") so two different players rarely collide.
export function playerInitials(name = '') {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return '??'
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
}

// Position accent colors, matching the .pos-XX chip classes in index.css.
export const POSITION_COLORS = {
  GK: '#fbbf24', // amber-400
  DEF: '#38bdf8', // sky-400
  MID: '#34d399', // emerald-400
  FWD: '#fb7185', // rose-400
}
