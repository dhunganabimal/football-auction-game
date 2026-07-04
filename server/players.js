// Mock football player pool — 64 well-known players, 16 per position.
// `rating` is an overall (0-99). `base` is a suggested starting value in $M
// (used only as a hint on the nomination screen; the auction always opens at $1M).
// Values are illustrative placeholders for a game, not real market prices.

const raw = {
  GK: [
    ['Alisson', 'Liverpool', 89, 12],
    ['Ederson', 'Man City', 88, 11],
    ['Thibaut Courtois', 'Real Madrid', 90, 13],
    ['Marc-André ter Stegen', 'Barcelona', 88, 11],
    ['Gianluigi Donnarumma', 'PSG', 88, 12],
    ['Jan Oblak', 'Atlético', 89, 12],
    ['Mike Maignan', 'AC Milan', 87, 10],
    ['Manuel Neuer', 'Bayern', 87, 9],
    ['Emiliano Martínez', 'Aston Villa', 85, 9],
    ['David Raya', 'Arsenal', 84, 8],
    ['Diogo Costa', 'Porto', 84, 8],
    ['Gregor Kobel', 'Dortmund', 85, 8],
    ['André Onana', 'Man United', 83, 7],
    ['Unai Simón', 'Athletic Club', 83, 7],
    ['Wojciech Szczęsny', 'Juventus', 84, 7],
    ['Bono', 'Al-Hilal', 83, 6],
  ],
  DEF: [
    ['Virgil van Dijk', 'Liverpool', 90, 14],
    ['Rúben Dias', 'Man City', 89, 13],
    ['William Saliba', 'Arsenal', 87, 12],
    ['Antonio Rüdiger', 'Real Madrid', 87, 11],
    ['Alessandro Bastoni', 'Inter', 86, 11],
    ['Achraf Hakimi', 'PSG', 86, 12],
    ['Theo Hernández', 'AC Milan', 85, 11],
    ['Trent Alexander-Arnold', 'Liverpool', 87, 13],
    ['Kyle Walker', 'Man City', 84, 9],
    ['Josko Gvardiol', 'Man City', 85, 11],
    ['Ronald Araújo', 'Barcelona', 86, 11],
    ['Éder Militão', 'Real Madrid', 85, 10],
    ['Marquinhos', 'PSG', 86, 10],
    ['Kim Min-jae', 'Bayern', 85, 10],
    ['João Cancelo', 'Al-Nassr', 84, 9],
    ['Reece James', 'Chelsea', 84, 10],
  ],
  MID: [
    ['Kevin De Bruyne', 'Man City', 90, 15],
    ['Jude Bellingham', 'Real Madrid', 90, 18],
    ['Rodri', 'Man City', 90, 16],
    ['Federico Valverde', 'Real Madrid', 88, 14],
    ['Bruno Fernandes', 'Man United', 87, 12],
    ['Martin Ødegaard', 'Arsenal', 88, 13],
    ['Pedri', 'Barcelona', 87, 13],
    ['Gavi', 'Barcelona', 85, 11],
    ['Toni Kroos', 'Real Madrid', 88, 10],
    ['Luka Modrić', 'Real Madrid', 87, 8],
    ['Declan Rice', 'Arsenal', 86, 12],
    ['Nicolò Barella', 'Inter', 86, 12],
    ['Enzo Fernández', 'Chelsea', 84, 11],
    ['Jamal Musiala', 'Bayern', 87, 15],
    ['Florian Wirtz', 'Leverkusen', 87, 15],
    ['Bernardo Silva', 'Man City', 87, 12],
  ],
  FWD: [
    ['Kylian Mbappé', 'Real Madrid', 91, 20],
    ['Erling Haaland', 'Man City', 91, 20],
    ['Vinícius Júnior', 'Real Madrid', 90, 18],
    ['Harry Kane', 'Bayern', 90, 16],
    ['Mohamed Salah', 'Liverpool', 89, 15],
    ['Lautaro Martínez', 'Inter', 87, 13],
    ['Bukayo Saka', 'Arsenal', 87, 14],
    ['Lionel Messi', 'Inter Miami', 88, 12],
    ['Robert Lewandowski', 'Barcelona', 87, 11],
    ['Son Heung-min', 'Tottenham', 87, 12],
    ['Victor Osimhen', 'Napoli', 87, 14],
    ['Rafael Leão', 'AC Milan', 86, 13],
    ['Ousmane Dembélé', 'PSG', 85, 12],
    ['Phil Foden', 'Man City', 87, 14],
    ['Cristiano Ronaldo', 'Al-Nassr', 86, 10],
    ['Julián Álvarez', 'Atlético', 85, 13],
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
