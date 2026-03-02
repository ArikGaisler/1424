export default function WaitingRoom({ socket }) {
  const { gameState, playerId } = socket;
  const waitingPlayers = gameState.waitingPlayers || [];

  return (
    <div className="waiting-room">
      <h1 className="title">1-4-24</h1>
      <div className="card">
        <div className="room-code-section">
          <span className="room-label">Room Code</span>
          <span className="room-code">{gameState.code}</span>
        </div>

        <div className="waiting-message">
          <div className="spinner" />
          <p>A round is in progress. You'll join the next one!</p>
        </div>

        <div className="player-list">
          <h3>Currently Playing (Round {gameState.round})</h3>
          {gameState.players.map((p) => (
            <div key={p.id} className="player-item">
              <span className="player-name">
                {p.name}
                {p.isHost && <span className="host-badge">HOST</span>}
              </span>
            </div>
          ))}
        </div>

        {waitingPlayers.length > 0 && (
          <div className="player-list">
            <h3>Waiting for Next Round ({waitingPlayers.length})</h3>
            {waitingPlayers.map((p) => (
              <div key={p.id} className={`player-item ${p.id === playerId ? 'you' : ''}`}>
                <span className="player-name">
                  {p.name}
                  {p.id === playerId && <span className="you-badge">YOU</span>}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
