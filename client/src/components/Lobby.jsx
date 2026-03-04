import { useState, useEffect } from 'react';
import HowToPlay from './HowToPlay';
import InviteButton from './InviteButton';

export default function Lobby({ socket }) {
  const { gameState, playerId, error, setError, createGame, joinGame, startGame, leaveGame } = socket;
  const [playerName, setPlayerName] = useState('');
  const [joinCode, setJoinCode] = useState('');
  const [view, setView] = useState('landing'); // landing | join

  const inRoom = gameState?.state === 'lobby';
  const isHost = gameState?.players?.find(p => p.id === playerId)?.isHost;
  const myName = gameState?.players?.find(p => p.id === playerId)?.name;

  // Read ?room= from URL and pre-fill join flow
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const roomCode = params.get('room');
    if (roomCode && !inRoom) {
      setJoinCode(roomCode.toUpperCase());
      setView('join');
    }
  }, []);

  if (inRoom) {
    return (
      <div className="lobby">
        <h1 className="title">1-4-24</h1>
        <div className="card room-card">
          <div className="room-code-section">
            <span className="room-label">Room Code</span>
            <span className="room-code">{gameState.code}</span>
          </div>
          <InviteButton gameCode={gameState.code} playerName={myName} />
          <div className="player-list">
            <h3>Players ({gameState.players.length})</h3>
            {gameState.players.map((p) => (
              <div key={p.id} className={`player-item ${p.id === playerId ? 'you' : ''}`}>
                <span className="player-name">
                  {p.name}
                  {p.isHost && <span className="host-badge">HOST</span>}
                  {p.id === playerId && <span className="you-badge">YOU</span>}
                </span>
              </div>
            ))}
          </div>
          {error && <div className="error">{error}</div>}
          {isHost && (
            <button
              className="btn btn-primary btn-large"
              onClick={startGame}
              disabled={gameState.players.length < 2}
            >
              {gameState.players.length < 2 ? 'Waiting for players...' : 'Start Game'}
            </button>
          )}
          {!isHost && <p className="waiting-text">Waiting for host to start...</p>}
          <HowToPlay />
          <button className="btn btn-ghost" onClick={leaveGame}>Leave Game</button>
        </div>
      </div>
    );
  }

  const handleCreate = async () => {
    if (!playerName.trim()) return setError('Enter your name');
    await createGame(playerName.trim());
  };

  const handleJoin = async () => {
    if (!playerName.trim()) return setError('Enter your name');
    if (!joinCode.trim()) return setError('Enter a room code');
    const res = await joinGame(joinCode.trim().toUpperCase(), playerName.trim());
    if (res.success) {
      // Strip the ?room= param from the URL after joining
      const url = new URL(window.location.href);
      url.searchParams.delete('room');
      window.history.replaceState({}, '', url.toString());
    }
  };

  // Determine if we arrived via an invite link
  const isInviteFlow = view === 'join' && !!new URLSearchParams(window.location.search).get('room');

  return (
    <div className="lobby">
      <h1 className="title">1-4-24</h1>
      {isInviteFlow
        ? <p className="subtitle">You've been invited! Enter your name to join.</p>
        : <p className="subtitle">The Classic Dice Game</p>
      }

      {view === 'landing' && (
        <div className="card landing-card">
          <input
            type="text"
            className="input"
            placeholder="Your name"
            value={playerName}
            onChange={(e) => setPlayerName(e.target.value)}
            maxLength={16}
            onKeyDown={(e) => e.key === 'Enter' && playerName.trim() && handleCreate()}
          />
          {error && <div className="error">{error}</div>}
          <button className="btn btn-primary" onClick={() => {
            if (!playerName.trim()) return setError('Enter your name');
            setError(null);
            handleCreate();
          }}>
            Create Game
          </button>
          <button className="btn btn-secondary" onClick={() => {
            if (!playerName.trim()) return setError('Enter your name');
            setError(null);
            setView('join');
          }}>
            Join Game
          </button>
        </div>
      )}

      <HowToPlay />

      {view === 'join' && (
        <div className="card">
          <input
            type="text"
            className="input"
            placeholder="Your name"
            value={playerName}
            onChange={(e) => setPlayerName(e.target.value)}
            maxLength={16}
            autoFocus
            onKeyDown={(e) => e.key === 'Enter' && playerName.trim() && handleJoin()}
          />
          <input
            type="text"
            className="input input-code"
            placeholder="Room code"
            value={joinCode}
            onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
            maxLength={4}
            onKeyDown={(e) => e.key === 'Enter' && handleJoin()}
          />
          {error && <div className="error">{error}</div>}
          <button className="btn btn-primary" onClick={handleJoin}>Join</button>
          <button className="btn btn-ghost" onClick={() => {
            setView('landing');
            setError(null);
            // Also clear pre-filled code if user backs out of invite flow
            const url = new URL(window.location.href);
            url.searchParams.delete('room');
            window.history.replaceState({}, '', url.toString());
            setJoinCode('');
          }}>Back</button>
        </div>
      )}
    </div>
  );
}
