import { useGame } from './game.jsx'
import Home from './pages/Home.jsx'
import Lobby from './pages/Lobby.jsx'
import AuctionRoom from './pages/AuctionRoom.jsx'
import Toasts from './components/Toasts.jsx'
import PowerOverlay from './components/PowerOverlay.jsx'
import PowerCardGate from './components/PowerCardGate.jsx'
import KickVotePanel from './components/KickVotePanel.jsx'

export default function App() {
  const { state, playerId } = useGame()

  let view
  if (!state || !playerId) view = <Home />
  else if (state.status === 'lobby') view = <Lobby />
  else view = <AuctionRoom />

  return (
    <div className="min-h-screen">
      {view}
      <Toasts />
      <PowerOverlay />
      <PowerCardGate />
      <KickVotePanel />
    </div>
  )
}
