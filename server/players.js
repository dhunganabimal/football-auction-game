// Mock football player pool — 100 well-known players, 25 per position.
// `rating` is an overall (0-99). `base` is a suggested starting value in $M
// (used only as a hint on the nomination screen; the auction always opens at $1M).
// Values are illustrative placeholders for a game, not real market prices.
// Updated for the 2025-26 season (post summer 2025 transfer window).
// All players listed are active professionals as of mid-2026.

const raw = {
  GK: [
    ['Thibaut Courtois', 'Real Madrid', 91, 13],
    ['Alisson', 'Liverpool', 89, 12],
    ['Gianluigi Donnarumma', 'Man City', 90, 12],
    ['Jan Oblak', 'Atlético', 87, 10],
    ['Mike Maignan', 'AC Milan', 88, 10],
    ['Diogo Costa', 'Porto', 88, 9],
    ['Emiliano Martínez', 'Aston Villa', 87, 9],
    ['Manuel Neuer', 'Bayern', 89, 8],
    ['David Raya', 'Arsenal', 88, 9],
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
    // --- new additions ---
    ['Kepa Arrizabalaga', 'Arsenal', 82, 6],
    ['Nick Pope', 'Newcastle', 82, 6],
    ['Illan Meslier', 'Leeds United', 80, 5],
    ['Stefan Ortega', 'Man City', 80, 5],
    ['Mark Flekken', 'Brentford', 79, 5],
    ['Dominik Livaković', 'Fenerbahçe', 79, 4],
    ['Ewen Jaouen', 'Newcastle', 78, 4],
    ['Martin Dubravka', 'Tottenham', 78, 4],
  ],
  DEF: [
  ['Virgil van Dijk', 'Liverpool', 90, 15],
  ['William Saliba', 'Arsenal', 89, 15],
  ['Rúben Dias', 'Manchester City', 89, 14],
  ['Alessandro Bastoni', 'Inter Milan', 89, 14],
  ['Achraf Hakimi', 'PSG', 89, 15],
  ['Gabriel Magalhães', 'Arsenal', 88, 13],
  ['Antonio Rüdiger', 'Real Madrid', 88, 13],
  ['Jules Koundé', 'Barcelona', 88, 13],
  ['Trent Alexander-Arnold', 'Real Madrid', 88, 14],
  ['Joško Gvardiol', 'Manchester City', 88, 13],
  ['Ronald Araújo', 'Barcelona', 87, 12],
  ['Marquinhos', 'PSG', 87, 12],
  ['Dean Huijsen', 'Real Madrid', 87, 12],
  ['Theo Hernández', 'Al-Hilal', 87, 12],
  ['Kim Min-jae', 'Bayern Munich', 86, 11],
  ['Éder Militão', 'Real Madrid', 86, 11],
  ['Micky van de Ven', 'Tottenham', 86, 11],
  ['Ibrahima Konaté', 'Liverpool', 86, 11],
  ['Jeremie Frimpong', 'Liverpool', 86, 11],
  ['Álvaro Carreras', 'Real Madrid', 85, 10],
  ['Reece James', 'Chelsea', 85, 10],
  ['Milos Kerkez', 'Liverpool', 85, 10],
  ['Rayan Aït-Nouri', 'Manchester City', 84, 9],
  ['Piero Hincapié', 'Bayer Leverkusen', 84, 9],
  ['Antonio Silva', 'Benfica', 84, 9],
  ['Andrew Robertson', 'Liverpool', 84, 9],
  ['Pascal Struijk', 'Leeds United', 83, 8],
  ['Marcos Senesi', 'Bournemouth', 83, 8],
  ['Jan Paul van Hecke', 'Brighton', 83, 8],
  ['Jakub Kiwior', 'Arsenal', 83, 8],
  ['Kyle Walker', 'Burnley', 82, 7],
  ['Costinha', 'Olympiacos', 81, 6],
  ['Raul Asencio', 'Real Madrid', 88, 13],

  // -------- 30 New Current Defenders --------
  ['Cristian Romero', 'Tottenham', 88, 13],
  ['David Hancko', 'Atlético Madrid', 86, 11],
  ['Murmillo', 'Nottingham Forest', 85, 10],
  ['Riccardo Calafiori', 'Arsenal', 85, 10],
  ['Destiny Udogie', 'Tottenham', 85, 10],
  ['Jorrel Hato', 'Ajax', 85, 10],
  ['Pau Cubarsí', 'Barcelona', 86, 11],
  ['Miguel Gutiérrez', 'Girona', 84, 9],
  ['Alejandro Balde', 'Barcelona', 85, 10],
  ['Malo Gusto', 'Chelsea', 83, 8],
  ['Pedro Porro', 'Tottenham', 85, 10],
  ['Nuno Mendes', 'PSG', 88, 13],
  ['Nathan Aké', 'Manchester City', 85, 10],
  ['Manuel Akanji', 'Manchester City', 85, 10],
  ['Levi Colwill', 'Chelsea', 84, 9],
  ['Micky van den Berg', 'Mainz', 81, 6],
  ['Piero Comuzzo', 'Fiorentina', 82, 7],
  ['Robin Le Normand', 'Atlético Madrid', 86, 11],
  ['Jonathan Tah', 'Bayern Munich', 87, 12],
  ['Castello Lukeba', 'RB Leipzig', 85, 10],
  ['Giorgio Scalvini', 'Atalanta', 85, 10],
  ['Federico Dimarco', 'Inter Milan', 87, 12],
  ['Yann Bisseck', 'Inter Milan', 84, 9],
  ['Pervis Estupiñán', 'Brighton', 84, 9],
  ['Maxence Lacroix', 'Crystal Palace', 83, 8],
  ['Marc Guéhi', 'Crystal Palace', 86, 11],
  ['Jarrad Branthwaite', 'Everton', 85, 10],
  ['Ousmane Diomande', 'Sporting CP', 84, 9],
  ['Tomás Araújo', 'Benfica', 84, 9],
  ['Milan Škriniar', 'Fenerbahçe', 84, 9],
],
 MID: [
  ['Rodri', 'Manchester City', 91, 18],
  ['Jude Bellingham', 'Real Madrid', 91, 18],
  ['Pedri', 'Barcelona', 90, 17],
  ['Federico Valverde', 'Real Madrid', 90, 17],
  ['Florian Wirtz', 'Liverpool', 90, 18],
  ['Jamal Musiala', 'Bayern Munich', 90, 18],
  ['Declan Rice', 'Arsenal', 89, 16],
  ['Martin Ødegaard', 'Arsenal', 89, 16],
  ['Bruno Fernandes', 'Manchester United', 89, 15],
  ['Nicolò Barella', 'Inter Milan', 89, 15],
  ['Joshua Kimmich', 'Bayern Munich', 89, 15],
  ['Vitinha', 'PSG', 89, 15],
  ['Alexis Mac Allister', 'Liverpool', 88, 14],
  ['Tijjani Reijnders', 'Manchester City', 88, 14],
  ['Sandro Tonali', 'Newcastle United', 88, 14],
  ['Enzo Fernández', 'Chelsea', 87, 13],
  ['Martin Zubimendi', 'Arsenal', 87, 13],
  ['Dani Olmo', 'Barcelona', 87, 13],
  ['Gavi', 'Barcelona', 87, 13],
  ['Bernardo Silva', 'Manchester City', 87, 13],
  ['Kevin De Bruyne', 'Napoli', 87, 13],
  ['Carlos Baleba', 'Brighton', 86, 12],
  ['Xavi Simons', 'RB Leipzig', 86, 12],
  ['Rayan Cherki', 'Manchester City', 86, 12],
  ['Mohammed Kudus', 'Tottenham', 86, 12],
  ['Aleix García', 'Bayer Leverkusen', 85, 11],
  ['Luka Modrić', 'AC Milan', 85, 10],
  ['Adam Wharton', 'Crystal Palace', 85, 11],
  ['Morgan Rogers', 'Aston Villa', 85, 11],
  ['Manuel Ugarte', 'Manchester United', 84, 10],
  ['Mateus Fernandes', 'Southampton', 84, 10],
  ['Elliot Anderson', 'Nottingham Forest', 84, 10],
  ['Granit Xhaka', 'Sunderland', 84, 10],
  ['Hayden Hackney', 'Middlesbrough', 82, 8],
  ['Odin Bailey', 'Portsmouth', 78, 5],

  // -------- 30 New Current Midfielders --------
  ['Aurélien Tchouaméni', 'Real Madrid', 88, 14],
  ['Eduardo Camavinga', 'Real Madrid', 87, 13],
  ['Frenkie de Jong', 'Barcelona', 88, 14],
  ['João Neves', 'PSG', 87, 13],
  ['Fabián Ruiz', 'PSG', 87, 13],
  ['Warren Zaïre-Emery', 'PSG', 86, 12],
  ['Ryan Gravenberch', 'Liverpool', 87, 13],
  ['Curtis Jones', 'Liverpool', 85, 11],
  ['Dominik Szoboszlai', 'Liverpool', 87, 13],
  ['Moisés Caicedo', 'Chelsea', 88, 14],
  ['Kobbie Mainoo', 'Manchester United', 85, 11],
  ['Mason Mount', 'Manchester United', 83, 9],
  ['Conor Gallagher', 'Atlético Madrid', 85, 11],
  ['Adrien Rabiot', 'Marseille', 84, 10],
  ['Teun Koopmeiners', 'Juventus', 87, 13],
  ['Khéphren Thuram', 'Juventus', 85, 11],
  ['Ederson', 'Atalanta', 86, 12],
  ['Charles De Ketelaere', 'Atalanta', 85, 11],
  ['Mikel Merino', 'Arsenal', 85, 11],
  ['Youri Tielemans', 'Aston Villa', 85, 11],
  ['Douglas Luiz', 'Juventus', 85, 11],
  ['Orkun Kökçü', 'Benfica', 85, 11],
  ['Hakan Çalhanoğlu', 'Inter Milan', 88, 14],
  ['Piotr Zieliński', 'Inter Milan', 84, 10],
  ['Matt O\'Riley', 'Brighton', 84, 10],
  ['Youssouf Fofana', 'AC Milan', 85, 11],
  ['Joey Veerman', 'PSV', 84, 10],
  ['Arda Güler', 'Real Madrid', 85, 11],
  ['Giovanni Reyna', 'Borussia Dortmund', 82, 8],
  ['Exequiel Palacios', 'Bayer Leverkusen', 84, 10],
],

FWD: [
  ['Kylian Mbappé', 'Real Madrid', 92, 20],
  ['Erling Haaland', 'Manchester City', 91, 20],
  ['Vinícius Júnior', 'Real Madrid', 91, 19],
  ['Mohamed Salah', 'Liverpool', 91, 19],
  ['Harry Kane', 'Bayern Munich', 91, 18],
  ['Lamine Yamal', 'Barcelona', 90, 19],
  ['Ousmane Dembélé', 'PSG', 90, 18],
  ['Bukayo Saka', 'Arsenal', 90, 18],
  ['Raphinha', 'Barcelona', 89, 17],
  ['Cole Palmer', 'Chelsea', 89, 17],
  ['Alexander Isak', 'Liverpool', 89, 17],
  ['Phil Foden', 'Manchester City', 89, 16],
  ['Viktor Gyökeres', 'Arsenal', 89, 17],
  ['Khvicha Kvaratskhelia', 'PSG', 88, 15],
  ['Lautaro Martínez', 'Inter Milan', 89, 16],
  ['Robert Lewandowski', 'Barcelona', 88, 15],
  ['Julián Álvarez', 'Atlético Madrid', 88, 15],
  ['Marcus Thuram', 'Inter Milan', 87, 14],
  ['Rafael Leão', 'AC Milan', 87, 14],
  ['Luis Díaz', 'Bayern Munich', 87, 14],
  ['Anthony Gordon', 'Newcastle United', 86, 13],
  ['Hugo Ekitike', 'Liverpool', 86, 13],
  ['João Pedro', 'Chelsea', 86, 13],
  ['Benjamin Šeško', 'Manchester United', 86, 13],
  ['Estêvão', 'Chelsea', 85, 12],
  ['Cristiano Ronaldo', 'Al-Nassr', 85, 11],
  ['Lionel Messi', 'Inter Miami', 85, 11],
  ['Marcus Rashford', 'Barcelona', 85, 11],
  ['Rasmus Højlund', 'Napoli', 84, 10],
  ['Son Heung-min', 'LAFC', 84, 10],
  ['Hugo Cuypers', 'Chicago Fire', 82, 8],
  ['Bilal El Khannouss', 'Leicester City', 81, 7],
  ['Ismaïla Saibari', 'PSV', 84, 10],
  ['Zadok Yohanna', 'Brighton', 77, 5],

  // -------- 30 New Current Forwards --------
  ['Omar Marmoush', 'Manchester City', 88, 15],
  ['Rodrygo', 'Real Madrid', 88, 15],
  ['Nico Williams', 'Athletic Club', 87, 14],
  ['Desire Doué', 'PSG', 87, 14],
  ['Bradley Barcola', 'PSG', 87, 14],
  ['Michael Olise', 'Bayern Munich', 88, 15],
  ['Serhou Guirassy', 'Borussia Dortmund', 87, 14],
  ['Loïs Openda', 'RB Leipzig', 86, 13],
  ['Victor Osimhen', 'Galatasaray', 88, 15],
  ['Matheus Cunha', 'Manchester United', 86, 13],
  ['Bryan Mbeumo', 'Manchester United', 87, 14],
  ['Karim Adeyemi', 'Borussia Dortmund', 85, 12],
  ['Dusan Vlahović', 'Juventus', 86, 13],
  ['Kenan Yidizz', 'Juventus', 85, 12],
  ['Christian Pulisic', 'AC Milan', 86, 13],
  ['Samuel Chukwueze', 'AC Milan', 83, 9],
  ['Jonathan David', 'Juventus', 87, 14],
  ['João Félix', 'Al-Nassr', 84, 10],
  ['Ferran Torres', 'Barcelona', 85, 12],
  ['Dani Rodríguez', 'Barcelona', 81, 8],
  ['Antoine Griezmann', 'Atlético Madrid', 86, 13],
  ['Alexander Sørloth', 'Atlético Madrid', 85, 12],
  ['Jamie Gittens', 'Chelsea', 84, 11],
  ['Igor Paixão', 'Marseille', 84, 11],
  ['Semenyo', 'Bournemouth', 84, 11],
  ['Yoane Wissa', 'Brentford', 84, 11],
  ['Callum Hudson-Odoi', 'Nottingham Forest', 83, 10],
  ['Kaoru Mitoma', 'Brighton', 85, 12],
  ['Eberechi Eze', 'Crystal Palace', 86, 13],
  ['Mohamed Amoura', 'Wolfsburg', 84, 10],
],
}

// Legend / retired greats pool. Only a handful per position for now — add more
// here over time. These are tagged with era 'legend' and are only drawn into a
// game when the host picks the "Legends" or "Mix" pool (see buildPool).
const legendRaw = {
 GK: [
['Lev Yashin','Dynamo Moscow',96,18],
['Gianluigi Buffon','Juventus',95,17],
['Iker Casillas','Real Madrid',95,17],
['Oliver Kahn','Bayern Munich',94,16],
['Peter Schmeichel','Manchester United',94,16],
['Edwin van der Sar','Manchester United',94,16],
['Petr Čech','Chelsea',93,15],
['Dino Zoff','Juventus',93,15],
['Sepp Maier','Bayern Munich',92,14],
['José Luis Chilavert','Vélez Sarsfield',92,14],
['Walter Zenga','Inter Milan',91,13],
['David Seaman','Arsenal',91,13],
['Jens Lehmann','Arsenal',90,12],
['Cláudio Taffarel','Galatasaray',90,12],
['Fabien Barthez','Manchester United',90,12],
['Rinat Dasayev','Spartak Moscow',90,12],
['Gordon Banks','Stoke City',92,14],
['Pat Jennings','Tottenham',91,13],
['Ricardo Zamora','Espanyol',91,13],
['Thomas N\'Kono','Espanyol',90,12],
['Victor Valdés','Barcelona',90,12],
['Angelo Peruzzi','Juventus',90,12],
['Julio César','Inter Milan',91,13],
['Rogério Ceni','São Paulo',90,12],
['Ubaldo Fillol','River Plate',90,12],
['Harald Schumacher','Cologne',89,11],
['Ray Clemence','Liverpool',90,12],
['Oliver Reck','Werder Bremen',88,10],
['Andoni Zubizarreta','Barcelona',91,13],
['Peter Shilton','Nottingham Forest',90,12],
],
DEF: [
['Paolo Maldini','AC Milan',97,20],
['Franz Beckenbauer','Bayern Munich',97,20],
['Franco Baresi','AC Milan',96,19],
['Cafu','AC Milan',95,18],
['Roberto Carlos','Real Madrid',95,18],
['Alessandro Nesta','AC Milan',95,18],
['Carles Puyol','Barcelona',95,18],
['Fabio Cannavaro','Real Madrid',95,18],
['Philipp Lahm','Bayern Munich',95,18],
['Javier Zanetti','Inter Milan',94,17],
['Bobby Moore','West Ham',94,17],
['Ashley Cole','Chelsea',94,17],
['Rio Ferdinand','Manchester United',94,17],
['Jaap Stam','Manchester United',93,16],
['John Terry','Chelsea',93,16],
['Nemanja Vidić','Manchester United',93,16],
['Marcel Desailly','AC Milan',93,16],
['Lilian Thuram','Juventus',93,16],
['Ronald Koeman','Barcelona',93,16],
['Gaetano Scirea','Juventus',93,16],
['Daniel Passarella','River Plate',92,15],
['Giacinto Facchetti','Inter Milan',92,15],
['Bixente Lizarazu','Bayern Munich',91,14],
['Carlos Alberto','Santos',94,17],
['Ruud Krol','Ajax',92,15],
['Graham Alexander','Preston',89,11],
['Tony Adams','Arsenal',92,15],
['Giuseppe Bergomi','Inter Milan',92,15],
['Lucio','Inter Milan',91,14],
['Walter Samuel','Inter Milan',91,14],
],
MID: [
['Johan Cruyff','Barcelona',97,20],
['Zinedine Zidane','Real Madrid',97,20],
['Lothar Matthäus','Bayern Munich',96,19],
['Andrés Iniesta','Barcelona',96,19],
['Xavi','Barcelona',96,19],
['Michel Platini','Juventus',96,19],
['Ronaldinho','Barcelona',96,19],
['Kaká','AC Milan',95,18],
['Andrea Pirlo','Juventus',95,18],
['Steven Gerrard','Liverpool',95,18],
['Frank Lampard','Chelsea',95,18],
['Paul Scholes','Manchester United',95,18],
['Ruud Gullit','AC Milan',95,18],
['Rivaldo','Barcelona',95,18],
['David Beckham','Manchester United',94,17],
['Clarence Seedorf','AC Milan',94,17],
['Patrick Vieira','Arsenal',94,17],
['Claude Makélélé','Chelsea',94,17],
['Socrates','Corinthians',94,17],
['Michael Laudrup','Barcelona',94,17],
['Zico','Flamengo',95,18],
['Bobby Charlton','Manchester United',96,19],
['Pavel Nedvěd','Juventus',93,16],
['Deco','Barcelona',92,15],
['Juan Román Riquelme','Boca Juniors',93,16],
['Edgar Davids','Juventus',92,15],
['Michael Ballack','Chelsea',93,16],
['Dunga','Stuttgart',91,14],
['Hristo Stoichkov','Barcelona',94,17],
['Luis Suárez Miramontes','Inter Milan',92,15],
],
FWD: [
['Pelé','Santos',98,22],
['Diego Maradona','Napoli',97,21],
['Ronaldo Nazário','Real Madrid',97,21],
['Ferenc Puskás','Real Madrid',97,21],
['Garrincha','Botafogo',96,20],
['Marco van Basten','AC Milan',96,20],
['Eusébio','Benfica',96,20],
['George Best','Manchester United',96,20],
['Romário','Barcelona',96,20],
['Gerd Müller','Bayern Munich',96,20],
['Alfredo Di Stéfano','Real Madrid',96,20],
['Thierry Henry','Arsenal',96,20],
['Roberto Baggio','Juventus',95,19],
['Samuel Eto\'o','Barcelona',95,19],
['Wayne Rooney','Manchester United',95,19],
['Dennis Bergkamp','Arsenal',95,19],
['Raúl','Real Madrid',94,18],
['Didier Drogba','Chelsea',94,18],
['Andriy Shevchenko','AC Milan',94,18],
['Gabriel Batistuta','Fiorentina',94,18],
['Kenny Dalglish','Liverpool',95,19],
['Emilio Butragueño','Real Madrid',93,17],
['Ian Rush','Liverpool',93,17],
['Alan Shearer','Newcastle United',94,18],
['Ruud van Nistelrooy','Manchester United',94,18],
['David Villa','Barcelona',94,18],
['Hugo Sánchez','Real Madrid',94,18],
['Roberto Boninsegna','Inter Milan',91,14],
['Jean-Pierre Papin','Marseille',93,17],
['Luigi Riva','Cagliari',92,15],
]
}

// The pool "types" a host can choose from in the lobby.
//   mix     -> every player, legends and current alike
//   legend  -> retired legends only
//   current -> active players only (the classic pool)
export const POOL_TYPES = ['mix', 'legend', 'current']

let seq = 0
function flattenRaw(rawObj, era) {
  return Object.entries(rawObj).flatMap(([position, list]) =>
    list.map(([name, club, rating, base]) => ({
      id: `p${++seq}`,
      name,
      club,
      position,
      rating,
      base,
      era, // 'current' | 'legend'
    })),
  )
}

export const PLAYER_POOL = [
  ...flattenRaw(raw, 'current'),
  ...flattenRaw(legendRaw, 'legend'),
]

// Does a player belong in the chosen pool type? 'mix' includes everyone.
function matchesPoolType(p, poolType) {
  if (poolType === 'legend') return p.era === 'legend'
  if (poolType === 'current') return p.era === 'current'
  return true // 'mix' (or anything unexpected) -> everyone
}

export const POSITIONS = ['GK', 'DEF', 'MID', 'FWD']

// Fresh, shuffle-free copy so each room owns its own pool objects.
export function freshPool() {
  return PLAYER_POOL.map((p) => ({ ...p }))
}

// How many players exist in the master pool for each position — this is the
// upper bound a host can pick when limiting how many of a position go into
// the auction (e.g. "only 7 GKs this game"). Honors the chosen pool type so the
// cap reflects only the players actually eligible for that type.
export function countsByPosition(poolType = 'mix') {
  const counts = { GK: 0, DEF: 0, MID: 0, FWD: 0 }
  for (const p of PLAYER_POOL) {
    if (!matchesPoolType(p, poolType)) continue
    counts[p.position] = (counts[p.position] || 0) + 1
  }
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
// (host setting) and the chosen pool type (mix / legend / current). For each
// position we randomly pick up to `limits[pos]` players out of every eligible
// player for that position, then shuffle the combined pool so draw
// order/position isn't predictable. Missing/invalid limits fall back to
// "include everyone available for that position".
export function buildPool(limits, poolType = 'mix') {
  const byPos = {}
  for (const p of PLAYER_POOL) {
    if (!matchesPoolType(p, poolType)) continue
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