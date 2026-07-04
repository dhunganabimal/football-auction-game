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
