# ⚽ Football Auction — Real-time Multiplayer Web Game

A Skribbl.io-style room-based **football player auction** game. Managers join a room
with a shared code, take turns nominating players, bid against each other on a live
timer, and sabotage rivals with **Power Cards**. Built with React + Tailwind on the
front end and Node/Express/Socket.io on the back end. All room state is kept
**in-memory** on the server (perfect for temporary game rooms).

---

## 🚀 Quick start

```bash
# from the project root
npm install            # installs 'concurrently' for the dev script
npm run install:all    # installs server + client dependencies
npm run dev            # runs server (:4000) and client (:5173) together
```

Then open **http://localhost:5173** in a couple of browser tabs/windows to play
multiplayer locally. Create a room in one tab, copy the 4-letter code, and join
from the others.

Run pieces individually if you prefer:

```bash
npm run server   # backend only  → http://localhost:4000
npm run client   # frontend only → http://localhost:5173 (proxies /socket.io to :4000)
npm run build    # production build of the client into client/dist
```

> The Vite dev server proxies `/socket.io` to `localhost:4000`, so the client always
> talks to the backend on a same-origin URL — no CORS setup needed in dev.

---

## ☁️ Deploy for free (Render — single service)

The Node/Socket.io server also serves the built React client, so the whole game
runs as **one free web service**. A [`render.yaml`](./render.yaml) blueprint is included.

1. Push this repo to GitHub.
2. Go to **[render.com](https://render.com) → New → Blueprint**, pick the repo.
3. Render reads `render.yaml`, runs the build, and gives you a public URL. Share it
   and play across devices.

Render's free plan sleeps after ~15 min idle, so the **first load after inactivity
takes ~50s** to wake up — normal for free hosting.

To reproduce the production setup locally (server serving the built client on one port):

```bash
npm run build                 # builds client → client/dist
PORT=4000 npm --prefix server start
# open http://localhost:4000
```

---

## 🎮 How to play

1. **Create a room** — enter a nickname, hit *Create a Room*. You're the host.
2. **Configure** (host only, in the lobby): total budget, squad size, per-position
   minimums (GK/DEF/MID/FWD) and the bid timer.
3. **Share the code** — others enter their nickname + code to join the lobby (2–8 players).
4. **Start** — the host kicks off the auction.
5. **Nominate** — on your turn, pick any player from the pool to put on the block.
6. **Bid** — depending on the room's **bidding mode**:
   - **Turn-based (circular)** — managers act one at a time in seating order. On your
     turn you **raise** or **PASS**. Passing folds you out of that player for good;
     the last manager still standing wins at the current price. Each turn has its own
     countdown — run out of time and you auto-pass.
   - **Open · Timed** — free-for-all: anyone can bid while the timer runs. A late bid
     (under 5s left) snaps the clock back to 5s to stop sniping.
   - **Open · Host** — no clock; the host is the auctioneer and sells / skips each lot.
   Use the big **BID** button or the `+1M / +5M / +10M` quick buttons.
7. **Power Cards** — every 10 players sold, everyone draws a random Power Card. Play
   it from your hand at the right moment.
8. **Full time** — when everyone's squad is full (or the pool empties), final
   standings are shown.

---

## 📏 Auction rules enforced by the server

- Every auction opens at **$1M**.
- A bid must beat the current high bid and **cannot exceed your spendable budget** —
  you must always reserve **$1M per still-unfilled squad spot**, so you can never
  strand yourself unable to complete a legal squad.
- You can't bid once your squad is full, and you can't out-bid yourself.
- Unsold players (no bids) return to the pool.
- **Squad completion** requires meeting every position minimum *and* the total squad size.

## 🃏 Power Cards

| Card | Effect |
|------|--------|
| 🫳 **Steal / Snatch** | Take a player from a rival's squad into yours (free; needs squad room). |
| ⛓️‍💥 **Forced Release** | Force a rival to release a player back to the pool — they're refunded. |
| 🔥 **Fire Sale** | Put one of *your* players straight back up at a 50% starting price. |
| 💰 **Budget Boost** | Instant +$5M or +$10M to your budget. |
| 🧊 **Bid Freeze** | Freeze a rival — they can't bid on the next 2 players. |

Drawing a card is private (only you see what you got); **playing** one is announced to
the whole room with an animation.

---

## 🗂️ Project structure

```
football-auction/
├─ server/                  # Node + Express + Socket.io (in-memory rooms)
│  ├─ index.js              # socket wiring, room registry, connection handling
│  ├─ room.js               # Room class: auction/bid/timer/power-card game logic
│  ├─ players.js            # 64 mock players (16 per position) with ratings/clubs
│  └─ powerCards.js         # power card catalogue + random draw
├─ client/                  # React + Vite + Tailwind
│  └─ src/
│     ├─ game.jsx           # global state + all socket events + actions
│     ├─ socket.js          # socket.io client + emit-with-ack helper
│     ├─ pages/             # Home, Lobby, AuctionRoom
│     └─ components/        # AuctionBlock, BidControls, NominationPanel,
│                           # ManagerBoard, SquadTracker, PowerCardHand,
│                           # PowerOverlay, EventLog, EndScreen, Toasts
└─ package.json            # root dev scripts (concurrently)
```

## 🔌 Socket.io events

**Client → server:** `createRoom`, `joinRoom`, `rejoinRoom`, `configureRoom`,
`startGame`, `nominate`, `passNomination`, `placeBid`, `passBid`, `sellNow`,
`skipNow`, `usePowerCard`, `endGame` (all use ack callbacks that return `{ ok, error? }`).

**Server → client:** `state` (full public room state), `me` (your private hand /
max-bid), `tick` (per-second countdown), `auction:new`, `auction:bid`,
`auction:sold`, `auction:skipped`, `power:round`, `power:card`, `power:played`.

## 🛡️ Robustness

- Authoritative server timer (one tick loop per room); clients render from
  server state so bids stay in sync across everyone.
- **Disconnects** are handled gracefully — a manager's squad/budget persist, the
  nomination turn skips absent players, and reconnecting (via `localStorage`) reclaims
  the same seat. Empty rooms are reaped automatically.

Enjoy the auction! 🏆
