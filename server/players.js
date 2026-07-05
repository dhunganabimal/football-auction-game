// Mock football player pool — 100 well-known players, 25 per position.
// `rating` is an overall (0-99). `base` is a suggested starting value in $M
// (used only as a hint on the nomination screen; the auction always opens at $1M).
// Values are illustrative placeholders for a game, not real market prices.
// Updated for the 2025-26 season (post summer 2025 transfer window).
// All players listed are active professionals as of mid-2026.

const raw = {
  GK: [
    ['Thibaut Courtois', 'Real Madrid', 90, 13],
    ['Alisson', 'Liverpool', 89, 12],
    ['Gianluigi Donnarumma', 'Man City', 88, 12],
    ['Jan Oblak', 'Atlético', 87, 10],
    ['Mike Maignan', 'AC Milan', 87, 10],
    ['Giorgi Mamardashvili', 'Liverpool', 87, 10],
    ['Diogo Costa', 'Porto', 86, 9],
    ['Emiliano Martínez', 'Aston Villa', 86, 9],
    ['Manuel Neuer', 'Bayern', 86, 8],
    ['David Raya', 'Arsenal', 86, 9],
    ['Marc-André ter Stegen', 'Barcelona', 85, 8],
    ['Gregor Kobel', 'Dortmund', 85, 8],
    ['Lucas Chevalier', 'PSG', 85, 9],
    ['James Trafford', 'Man City', 84, 8],
    ['André Onana', 'Man United', 83, 7],
    ['Bono', 'Al-Hilal', 83, 6],
    ['Unai Simón', 'Athletic Club', 83, 7],
    ['Wojciech Szczęsny', 'Barcelona', 83, 6],
    ['Jordan Pickford', 'Everton', 82, 5],
    ['Robert Sánchez', 'Chelsea', 81, 5],
    ['Ederson', 'Fenerbahçe', 81, 6],
    ['Yann Sommer', 'Inter', 81, 5],
    ['Matz Sels', 'Nottingham Forest', 80, 5],
    ['Bart Verbruggen', 'Brighton', 79, 5],
    ['Aaron Ramsdale', 'Southampton', 79, 5],
  ],
  DEF: [
    ['Rúben Dias', 'Man City', 89, 13],
    ['William Saliba', 'Arsenal', 89, 14],
    ['Virgil van Dijk', 'Liverpool', 89, 13],
    ['Trent Alexander-Arnold', 'Real Madrid', 87, 13],
    ['Alessandro Bastoni', 'Inter', 87, 11],
    ['Gabriel Magalhães', 'Arsenal', 87, 11],
    ['Achraf Hakimi', 'PSG', 87, 12],
    ['Antonio Rüdiger', 'Real Madrid', 87, 11],
    ['Ronald Araújo', 'Barcelona', 86, 11],
    ['Josko Gvardiol', 'Man City', 86, 11],
    ['Jules Koundé', 'Barcelona', 86, 11],
    ['Marquinhos', 'PSG', 86, 10],
    ['Dean Huijsen', 'Real Madrid', 85, 11],
    ['Kim Min-jae', 'Bayern', 85, 10],
    ['Éder Militão', 'Real Madrid', 85, 10],
    ['Micky van de Ven', 'Tottenham', 85, 10],
    ['Ibrahima Konaté', 'Liverpool', 84, 9],
    ['Jeremie Frimpong', 'Liverpool', 84, 9],
    ['Álvaro Carreras', 'Real Madrid', 84, 9],
    ['Milos Kerkez', 'Liverpool', 83, 8],
    ['Rayan Aït-Nouri', 'Man City', 83, 8],
    ['Piero Hincapié', 'Arsenal', 83, 8],
    ['Reece James', 'Chelsea', 83, 9],
    ['Theo Hernández', 'Al-Hilal', 83, 8],
    ['Kyle Walker', 'Burnley', 80, 6],
  ],
  MID: [
    ['Rodri', 'Man City', 91, 18],
    ['Jude Bellingham', 'Real Madrid', 89, 17],
    ['Federico Valverde', 'Real Madrid', 89, 15],
    ['Florian Wirtz', 'Liverpool', 89, 17],
    ['Jamal Musiala', 'Bayern', 88, 16],
    ['Martin Ødegaard', 'Arsenal', 88, 13],
    ['Kevin De Bruyne', 'Napoli', 87, 11],
    ['Nicolò Barella', 'Inter', 87, 12],
    ['Bernardo Silva', 'Man City', 87, 12],
    ['Joshua Kimmich', 'Bayern', 87, 12],
    ['Pedri', 'Barcelona', 87, 13],
    ['Declan Rice', 'Arsenal', 87, 13],
    ['Martin Zubimendi', 'Arsenal', 86, 11],
    ['Bruno Fernandes', 'Man United', 86, 11],
    ['Tijjani Reijnders', 'Man City', 86, 11],
    ['Dani Olmo', 'Barcelona', 85, 11],
    ['Mohammed Kudus', 'Tottenham', 85, 11],
    ['Aleix García', 'Leverkusen', 84, 9],
    ['Enzo Fernández', 'Chelsea', 84, 10],
    ['Gavi', 'Barcelona', 84, 10],
    ['Granit Xhaka', 'Sunderland', 84, 8],
    ['Xavi Simons', 'Tottenham', 84, 10],
    ['Rayan Cherki', 'Man City', 83, 9],
    ['Carlos Baleba', 'Brighton', 83, 9],
    ['Luka Modrić', 'AC Milan', 83, 6],
  ],
  FWD: [
    ['Erling Haaland', 'Man City', 91, 20],
    ['Vinícius Júnior', 'Real Madrid', 91, 19],
    ['Kylian Mbappé', 'Real Madrid', 90, 18],
    ['Harry Kane', 'Bayern', 90, 16],
    ['Mohamed Salah', 'Liverpool', 89, 15],
    ['Bukayo Saka', 'Arsenal', 88, 15],
    ['Alexander Isak', 'Liverpool', 88, 16],
    ['Cole Palmer', 'Chelsea', 87, 14],
    ['Phil Foden', 'Man City', 87, 14],
    ['Lamine Yamal', 'Barcelona', 87, 16],
    ['Viktor Gyökeres', 'Arsenal', 87, 14],
    ['Robert Lewandowski', 'Barcelona', 86, 10],
    ['Khvicha Kvaratskhelia', 'PSG', 86, 13],
    ['Marcus Thuram', 'Inter', 86, 12],
    ['Rafael Leão', 'AC Milan', 86, 12],
    ['Raphinha', 'Barcelona', 86, 11],
    ['Hugo Ekitike', 'Liverpool', 85, 12],
    ['Ousmane Dembélé', 'PSG', 85, 11],
    ['Benjamin Šeško', 'Man United', 84, 11],
    ['João Pedro', 'Chelsea', 84, 11],
    ['Luis Díaz', 'Bayern', 84, 10],
    ['Estêvão', 'Chelsea', 83, 10],
    ['Son Heung-min', 'LAFC', 82, 7],
    ['Lionel Messi', 'Inter Miami', 84, 8],
    ['Cristiano Ronaldo', 'Al-Nassr', 83, 8],
  ],
}

let seq = 0
export const PLAYER_POOL = Object.entries(raw).flatMap(([position, list]) =>
  list.map(([name, club, rating, base]) => ({
    id: `p${++seq}`,
    name,
    club,
    position,
    rating,
    base,
  }))
)

export const POSITIONS = ['GK', 'DEF', 'MID', 'FWD']

// Fresh, shuffle-free copy so each room owns its own pool objects.
export function freshPool() {
  return PLAYER_POOL.map((p) => ({ ...p }))
}

// How many players exist in the master pool for each position — this is the
// upper bound a host can pick when limiting how many of a position go into
// the auction (e.g. "only 7 GKs this game").
export function countsByPosition() {
  const counts = { GK: 0, DEF: 0, MID: 0, FWD: 0 }
  for (const p of PLAYER_POOL) counts[p.position] = (counts[p.position] || 0) + 1
  return counts
}

function shuffle(arr) {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

function clampInt(n, lo, hi) {
  return Math.max(lo, Math.min(hi, Math.floor(n)))
}

// Build the pool actually used for an auction, honoring a per-position cap
// (host setting). For each position we randomly pick up to `limits[pos]`
// players out of every player available for that position, then shuffle the
// combined pool so draw order/position isn't predictable. Missing/invalid
// limits fall back to "include everyone available for that position".
export function buildPool(limits) {
  const byPos = {}
  for (const p of PLAYER_POOL) {
    ;(byPos[p.position] ||= []).push({ ...p })
  }
  let result = []
  for (const pos of POSITIONS) {
    const list = byPos[pos] || []
    const requested = limits && Number.isFinite(limits[pos]) ? limits[pos] : list.length
    const limit = clampInt(requested, 0, list.length)
    result = result.concat(shuffle(list).slice(0, limit))
  }
  return shuffle(result)
}