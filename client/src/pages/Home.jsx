import { useState } from 'react'
import { useGame } from '../game.jsx'

export default function Home() {
  const { actions, connected, pushToast } = useGame()
  const [nickname, setNickname] = useState('')
  const [code, setCode] = useState('')
  const [busy, setBusy] = useState(false)

  const create = async () => {
    if (!nickname.trim()) return pushToast('Enter a nickname first.', 'warn')
    setBusy(true)
    await actions.createRoom(nickname.trim())
    setBusy(false)
  }
  const join = async () => {
    if (!nickname.trim()) return pushToast('Enter a nickname first.', 'warn')
    if (code.trim().length < 4) return pushToast('Enter a 4-letter room code.', 'warn')
    setBusy(true)
    const res = await actions.joinRoom(code.trim().toUpperCase(), nickname.trim())
    if (!res.ok) pushToast(res.error || 'Could not join.', 'error')
    setBusy(false)
  }

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <div className="w-full max-w-md">
        <header className="mb-8 text-center">
          <div className="text-6xl">⚽</div>
          <h1 className="mt-2 font-display text-5xl font-bold tracking-tight">
            FOOTBALL <span className="text-neon-green">AUCTION</span>
          </h1>
          <p className="mt-2 text-slate-400">
            Draft your dream XI. Outbid your rivals. Weaponise Power Cards.
          </p>
        </header>

        <div className="panel p-6">
          <label className="label">Your manager nickname</label>
          <input
            className="input"
            placeholder="e.g. Gaff2K"
            maxLength={16}
            value={nickname}
            onChange={(e) => setNickname(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && create()}
          />

          <button className="btn-primary mt-4 w-full py-3 text-lg" disabled={busy || !connected} onClick={create}>
            🏟️ Create a Room
          </button>

          <div className="my-5 flex items-center gap-3 text-xs uppercase tracking-widest text-slate-500">
            <span className="h-px flex-1 bg-white/10" /> or join <span className="h-px flex-1 bg-white/10" />
          </div>

          <label className="label">Room code</label>
          <div className="flex gap-2">
            <input
              className="input flex-1 text-center font-display text-2xl uppercase tracking-[0.3em]"
              placeholder="ABCD"
              maxLength={4}
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ''))}
              onKeyDown={(e) => e.key === 'Enter' && join()}
            />
            <button className="btn-ghost px-6" disabled={busy || !connected} onClick={join}>
              Join
            </button>
          </div>
        </div>

        <div className="mt-4 text-center text-xs text-slate-500">
          {connected ? (
            <span className="text-neon-green">● Connected to auction server</span>
          ) : (
            <span className="text-neon-pink">● Connecting… make sure the server is running</span>
          )}
        </div>
      </div>
    </div>
  )
}
