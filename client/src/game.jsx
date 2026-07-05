import { createContext, useContext, useEffect, useRef, useState, useCallback } from 'react'
import { socket, emit } from './socket'

const GameContext = createContext(null)
export const useGame = () => useContext(GameContext)

const LS_PID = 'fa_pid'
const LS_CODE = 'fa_code'

let toastSeq = 0

export function GameProvider({ children }) {
  const [state, setState] = useState(null) // public room state
  const [me, setMe] = useState(null) // private per-player state
  const [playerId, setPlayerId] = useState(() => localStorage.getItem(LS_PID) || null)
  const [connected, setConnected] = useState(socket.connected)
  const [toasts, setToasts] = useState([])
  const [overlay, setOverlay] = useState(null) // { kind, ... } for full-screen animations
  const overlayTimer = useRef(null)

  const pushToast = useCallback((text, tone = 'info') => {
    const id = ++toastSeq
    setToasts((t) => [...t, { id, text, tone }])
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 3800)
  }, [])

  const showOverlay = useCallback((data, ms = 2600) => {
    clearTimeout(overlayTimer.current)
    setOverlay(data)
    overlayTimer.current = setTimeout(() => setOverlay(null), ms)
  }, [])

  // Drop the local seat and return to Home — used both by the Leave button and
  // when the server kicks us out of a room.
  const leaveTeardown = useCallback(() => {
    localStorage.removeItem(LS_PID)
    localStorage.removeItem(LS_CODE)
    setState(null)
    setMe(null)
    setPlayerId(null)
  }, [])

  // ---- socket lifecycle ----
  useEffect(() => {
    function onConnect() {
      setConnected(true)
      // Attempt to reclaim a seat after a reload / reconnect.
      const pid = localStorage.getItem(LS_PID)
      const code = localStorage.getItem(LS_CODE)
      if (pid && code) {
        emit('rejoinRoom', { code, playerId: pid }).then((res) => {
          if (res.ok) {
            setState(res.state)
            setMe(res.me)
            setPlayerId(res.playerId)
          } else {
            localStorage.removeItem(LS_PID)
            localStorage.removeItem(LS_CODE)
          }
        })
      }
    }
    function onDisconnect() {
      setConnected(false)
    }

    socket.on('connect', onConnect)
    socket.on('disconnect', onDisconnect)
    socket.on('state', setState)
    socket.on('me', setMe)

    socket.on('tick', ({ timeLeft }) => {
      setState((s) => (s && s.current ? { ...s, current: { ...s.current, timeLeft } } : s))
    })

    // Between-lots decision gate countdown (mirrors the auction 'tick').
    socket.on('gate:tick', ({ secondsLeft, paused }) => {
      setState((s) =>
        s && s.powerGate ? { ...s, powerGate: { ...s.powerGate, secondsLeft, paused } } : s
      )
    })

    socket.on('auction:new', ({ fp, discounted, mystery }) => {
      showOverlay({ kind: 'nominate', fp, discounted, mystery }, 1600)
    })
    socket.on('auction:sold', ({ fp, price, buyerName }) => {
      showOverlay({ kind: 'sold', fp, price, buyerName }, 2400)
    })
    socket.on('auction:skipped', ({ fp }) => {
      pushToast(`${fp.name} went unsold and returns to the pool.`, 'warn')
    })
    socket.on('power:round', () => {
      showOverlay({ kind: 'powerRound' }, 2600)
    })
    socket.on('power:card', ({ card }) => {
      // Your own drawn card — reveal it with a flip animation.
      showOverlay({ kind: 'draw', card }, 3200)
    })
    socket.on('power:played', ({ byName, card, text, auto }) => {
      // Auto "curse" cards fire mid power-round, where the flashy overlay gets
      // clobbered by the round banner / draw animations and hidden behind the
      // decision-gate modal. Surface them as a toast so nobody misses them;
      // manually-played cards still get the full overlay treatment.
      if (auto) pushToast(`${byName} ${text}`, card.tone === 'danger' ? 'error' : 'warn')
      else showOverlay({ kind: 'played', byName, card, text }, 3000)
    })
    socket.on('kicked', ({ reason }) => {
      pushToast(`You were removed from the room${reason ? ` (${reason})` : ''}.`, 'error')
      leaveTeardown()
    })

    if (socket.connected) onConnect()

    return () => {
      socket.off('connect', onConnect)
      socket.off('disconnect', onDisconnect)
      socket.off('state', setState)
      socket.off('me', setMe)
      socket.off('tick')
      socket.off('gate:tick')
      socket.off('auction:new')
      socket.off('auction:sold')
      socket.off('auction:skipped')
      socket.off('power:round')
      socket.off('power:card')
      socket.off('power:played')
      socket.off('kicked')
    }
  }, [pushToast, showOverlay, leaveTeardown])

  // Nudge the player when the circular-bidding turn lands on them.
  const lastTurnRef = useRef(null)
  useEffect(() => {
    const turnId = state?.current?.turnId ?? null
    if (turnId && turnId === playerId && lastTurnRef.current !== turnId) {
      pushToast('🎯 Your turn — bid or pass!', 'info')
    }
    lastTurnRef.current = turnId
  }, [state?.current?.turnId, playerId, pushToast])

  // ---- actions ----
  const persist = (res) => {
    if (res.ok) {
      localStorage.setItem(LS_PID, res.playerId)
      localStorage.setItem(LS_CODE, res.code)
      setState(res.state)
      setMe(res.me)
      setPlayerId(res.playerId)
    }
    return res
  }

  const run = async (event, payload) => {
    const res = await emit(event, payload)
    if (!res.ok && res.error) pushToast(res.error, 'error')
    return res
  }

  const actions = {
    createRoom: (nickname, settings) => emit('createRoom', { nickname, settings }).then(persist),
    joinRoom: (code, nickname) => emit('joinRoom', { code, nickname }).then(persist),
    configure: (settings) => run('configureRoom', { settings }),
    startGame: () => run('startGame'),
    nominate: (footballPlayerId) => run('nominate', { footballPlayerId }),
    passNomination: () => run('passNomination'),
    placeBid: (amount) => run('placeBid', { amount }),
    passBid: () => run('passBid'),
    sellNow: () => run('sellNow'),
    skipNow: () => run('skipNow'),
    usePowerCard: (cardId, target) => run('usePowerCard', { cardId, target }),
    acknowledgePowerRound: () => run('acknowledgePowerRound'),
    // Fire-and-forget: pause/resume the gate countdown while the picker is open.
    // Silent (plain emit) — a stale hold/release is a harmless no-op server-side.
    holdGate: () => emit('holdGate'),
    releaseGate: () => emit('releaseGate'),
    endGame: () => run('endGame'),
    kickPlayer: (targetId) => run('kickPlayer', { targetId }),
    startKickVote: (targetId) => run('startKickVote', { targetId }),
    castKickVote: (agree) => run('castKickVote', { agree }),
    leave: leaveTeardown,
  }

  const value = {
    state,
    me,
    playerId,
    connected,
    toasts,
    overlay,
    pushToast,
    dismissOverlay: () => setOverlay(null),
    actions,
  }

  return <GameContext.Provider value={value}>{children}</GameContext.Provider>
}
