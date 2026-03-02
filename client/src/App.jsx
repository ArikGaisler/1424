import { useSocket } from './hooks/useSocket';
import Lobby from './components/Lobby';
import GameBoard from './components/GameBoard';
import Results from './components/Results';

export default function App() {
  const socket = useSocket();
  const { gameState, playerId } = socket;

  if (!socket.connected) {
    return (
      <div className="app">
        <div className="connecting">
          <div className="spinner" />
          <p>Connecting to server...</p>
        </div>
      </div>
    );
  }

  const screen = gameState?.state;
  const isWaiting = gameState?.waitingPlayers?.some(p => p.id === playerId);

  return (
    <div className="app">
      {!gameState && <Lobby socket={socket} />}
      {gameState && screen === 'lobby' && !isWaiting && <Lobby socket={socket} />}
      {gameState && screen === 'playing' && <GameBoard socket={socket} spectating={isWaiting} />}
      {gameState && screen === 'results' && <Results socket={socket} />}
    </div>
  );
}
