// Mock football player pool — 80 well-known players, 20 per position.
// `rating` is an overall (0-99). `base` is a suggested starting value in $M
// (used only as a hint on the nomination screen; the auction always opens at $1M).
// Values are illustrative placeholders for a game, not real market prices.
// Updated for the 2024-25 season.

const raw = {
  GK: [
    ['Thibaut Courtois', 'Real Madrid', 90, 13],
    ['Alisson', 'Liverpool', 89, 12],
    ['Gianluigi Donnarumma', 'PSG', 88, 12],
    ['Jan Oblak', 'Atlético', 88, 11],
    ['Ederson', 'Man City', 87, 10],
    ['Mike Maignan', 'AC Milan', 87, 10],
    ['Diogo Costa', 'Porto', 86, 9],
    ['Emiliano Martínez', 'Aston Villa', 86, 9],
    ['Manuel Neuer', 'Bayern', 86, 8],
    ['David Raya', 'Arsenal', 86, 9],
    ['Marc-André ter Stegen', 'Barcelona', 86, 9],
    ['Gregor Kobel', 'Dortmund', 85, 8],
    ['Giorgi Mamardashvili', 'Valencia', 85, 9],
    ['André Onana', 'Man United', 84, 7],
    ['Bono', 'Al-Hilal', 83, 6],
    ['Unai Simón', 'Athletic Club', 83, 7],
    ['Wojciech Szczęsny', 'Barcelona', 83, 6],
    ['Jordan Pickford', 'Everton', 82, 5],
    ['Aaron Ramsdale', 'Southampton', 82, 5],
    ['Robert Sánchez', 'Chelsea', 81, 5],
  ],
  DEF: [
    ['Rúben Dias', 'Man City', 89, 13],
    ['William Saliba', 'Arsenal', 89, 14],
    ['Virgil van Dijk', 'Liverpool', 89, 13],
    ['Trent Alexander-Arnold', 'Liverpool', 87, 13],
    ['Alessandro Bastoni', 'Inter', 87, 11],
    ['Gabriel Magalhães', 'Arsenal', 87, 11],
    ['Achraf Hakimi', 'PSG', 87, 12],
    ['Antonio Rüdiger', 'Real Madrid', 87, 11],
    ['Ronald Araújo', 'Barcelona', 86, 11],
    ['Josko Gvardiol', 'Man City', 86, 11],
    ['Theo Hernández', 'AC Milan', 86, 11],
    ['Jules Koundé', 'Barcelona', 86, 11],
    ['Marquinhos', 'PSG', 86, 10],
    ['Kim Min-jae', 'Bayern', 85, 10],
    ['Éder Militão', 'Real Madrid', 85, 10],
    ['Micky van de Ven', 'Tottenham', 85, 10],
    ['Ibrahima Konaté', 'Liverpool', 84, 9],
    ['Jeremie Frimpong', 'Leverkusen', 84, 9],
    ['Kyle Walker', 'Man City', 83, 8],
    ['Reece James', 'Chelsea', 83, 9],
  ],
  MID: [
    ['Rodri', 'Man City', 91, 18],
    ['Jude Bellingham', 'Real Madrid', 89, 17],
    ['Kevin De Bruyne', 'Man City', 89, 14],
    ['Federico Valverde', 'Real Madrid', 89, 15],
    ['Florian Wirtz', 'Leverkusen', 89, 17],
    ['Jamal Musiala', 'Bayern', 88, 16],
    ['Martin Ødegaard', 'Arsenal', 88, 13],
    ['Nicolò Barella', 'Inter', 87, 12],
    ['Bernardo Silva', 'Man City', 87, 12],
    ['Joshua Kimmich', 'Bayern', 87, 12],
    ['Pedri', 'Barcelona', 87, 13],
    ['Declan Rice', 'Arsenal', 87, 13],
    ['Bruno Fernandes', 'Man United', 86, 11],
    ['Granit Xhaka', 'Leverkusen', 86, 10],
    ['Dani Olmo', 'Barcelona', 85, 11],
    ['Luka Modrić', 'Real Madrid', 85, 8],
    ['Martin Zubimendi', 'Real Sociedad', 85, 10],
    ['Aleix García', 'Leverkusen', 84, 9],
    ['Enzo Fernández', 'Chelsea', 84, 10],
    ['Gavi', 'Barcelona', 84, 10],
  ],
  FWD: [
    ['Erling Haaland', 'Man City', 91, 20],
    ['Vinícius Júnior', 'Real Madrid', 91, 19],
    ['Harry Kane', 'Bayern', 90, 16],
    ['Kylian Mbappé', 'Real Madrid', 90, 18],
    ['Mohamed Salah', 'Liverpool', 89, 15],
    ['Bukayo Saka', 'Arsenal', 88, 15],
    ['Alexander Isak', 'Newcastle', 87, 14],
    ['Cole Palmer', 'Chelsea', 87, 14],
    ['Phil Foden', 'Man City', 87, 14],
    ['Lamine Yamal', 'Barcelona', 87, 16],
    ['Robert Lewandowski', 'Barcelona', 87, 11],
    ['Khvicha Kvaratskhelia', 'PSG', 86, 13],
    ['Marcus Thuram', 'Inter', 86, 12],
    ['Rafael Leão', 'AC Milan', 86, 12],
    ['Raphinha', 'Barcelona', 86, 11],
    ['Son Heung-min', 'Tottenham', 86, 11],
    ['Luis Díaz', 'Liverpool', 85, 11],
    ['Ousmane Dembélé', 'PSG', 85, 11],
    ['Lionel Messi', 'Inter Miami', 85, 9],
    ['Cristiano Ronaldo', 'Al-Nassr', 84, 8],
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