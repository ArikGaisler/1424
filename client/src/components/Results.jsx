import Confetti from './Confetti';
import Leaderboard from './Leaderboard';

export default function Results({ socket }) {
  const { gameState, playerId, playAgain, leaveGame, error } = socket;
  const isWaiting = gameState.waitingPlayers?.some(p => p.id === playerId);
  const isHost = !isWaiting && gameState.players.find(p => p.id === playerId)?.isHost;
  const scores = gameState.finalScores || [];
  const winner = scores[0];
  const hasQualifiedWinner = winner?.qualified;

  return (
    <div className="results">
      {hasQualifiedWinner && winner.id === playerId && <Confetti />}
      <h1 className="title">Round {gameState.round} Results</h1>

      {winner && (
        <div className="winner-banner">
          <span className="trophy">&#127942;</span>
          <span className="winner-name">{winner.name}</span>
          <span className="winner-score">
            {winner.qualified ? `Score: ${winner.score}` : 'Busted'}
          </span>
        </div>
      )}

      <div className="results-table">
        {scores.map((s, rank) => (
          <div
            key={s.id}
            className={`result-row ${s.id === playerId ? 'result-you' : ''} ${rank === 0 && s.qualified ? 'result-winner' : ''}`}
          >
            <span className="result-rank">#{rank + 1}</span>
            <span className="result-name">
              {s.name}
              {s.id === playerId && <span className="you-badge">YOU</span>}
            </span>
            <span className="result-dice">
              {s.keptDice?.map((d, i) => (
                <span key={i} className="sb-mini-die">{d}</span>
              ))}
            </span>
            <span className={`result-score ${!s.qualified ? 'sb-bust' : ''}`}>
              {s.qualified ? s.score : 'BUST'}
            </span>
          </div>
        ))}
      </div>

      <Leaderboard leaderboard={gameState.leaderboard} myId={playerId} />

      {gameState.waitingPlayers?.length > 0 && (
        <div className="waiting-list">
          <h3>Joining Next Round</h3>
          {gameState.waitingPlayers.map((p) => (
            <span key={p.id} className="waiting-chip">{p.name}</span>
          ))}
        </div>
      )}

      {error && <div className="error">{error}</div>}

      {isHost && (
        <button className="btn btn-primary btn-large" onClick={playAgain}>
          Play Again
        </button>
      )}
      {!isHost && !isWaiting && <p className="waiting-text">Waiting for host to start next round...</p>}
      {isWaiting && <p className="waiting-text">You'll join the next round automatically</p>}
      <button className="btn btn-ghost" onClick={leaveGame}>Leave Game</button>
    </div>
  );
}
