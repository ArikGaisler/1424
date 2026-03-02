import { useState, useCallback } from 'react';
import Dice from './Dice';
import Scoreboard from './Scoreboard';
import Leaderboard from './Leaderboard';
import { hasRequiredDice } from '../game/logic';

export default function GameBoard({ socket, spectating }) {
  const { gameState, playerId, error, rollDice, keepDice, stopTurn, leaveGame } = socket;
  const [selectedIndices, setSelectedIndices] = useState([]);
  const [rolling, setRolling] = useState(false);

  const currentPlayer = gameState.players.find(p => p.id === gameState.currentPlayerId);
  const isMyTurn = !spectating && gameState.currentPlayerId === playerId;
  const myTurnState = gameState.players.find(p => p.id === playerId)?.turnState;
  const activeTurn = currentPlayer?.turnState;

  const currentRoll = activeTurn?.currentRoll || [];
  const keptDice = activeTurn?.keptDice || [];
  const hasRolled = currentRoll.length > 0;
  const canStop = isMyTurn && !hasRolled && (myTurnState?.rollNumber || 0) > 0;
  const allDiceKept = keptDice.length >= 6;

  const handleRoll = useCallback(async () => {
    setSelectedIndices([]);
    setRolling(true);
    await rollDice();
    setTimeout(() => setRolling(false), 400);
  }, [rollDice]);

  const toggleSelect = useCallback((index) => {
    setSelectedIndices(prev =>
      prev.includes(index) ? prev.filter(i => i !== index) : [...prev, index]
    );
  }, []);

  const handleKeep = useCallback(async () => {
    if (selectedIndices.length === 0) return;
    await keepDice(selectedIndices);
    setSelectedIndices([]);
  }, [keepDice, selectedIndices]);

  const handleStop = useCallback(async () => {
    await stopTurn();
  }, [stopTurn]);

  const qualifyHint = isMyTurn && myTurnState && !hasRequiredDice(keptDice);

  return (
    <div className="game-board">
      <div className="game-header">
        <span className="room-badge">Room: {gameState.code}</span>
        <span className="round-badge">Round {gameState.round}</span>
        <button className="btn btn-ghost btn-small" onClick={leaveGame}>Leave</button>
      </div>

      {spectating && (
        <div className="spectator-banner">
          Spectating — you'll join next round
        </div>
      )}

      <div className="turn-indicator">
        {isMyTurn ? (
          <h2 className="your-turn">Your Turn!</h2>
        ) : (
          <h2 className="other-turn">{currentPlayer?.name}'s Turn</h2>
        )}
      </div>

      <div className="dice-area">
        {keptDice.length > 0 && (
          <div className="kept-section">
            <span className="section-label">Kept</span>
            <div className="dice-row">
              {keptDice.map((val, i) => (
                <Dice key={`kept-${i}`} value={val} kept disabled />
              ))}
            </div>
          </div>
        )}

        {currentRoll.length > 0 && (
          <div className="roll-section">
            <span className="section-label">
              {isMyTurn ? 'Select dice to keep (at least 1)' : 'Rolled'}
            </span>
            <div className="dice-row">
              {currentRoll.map((val, i) => (
                <Dice
                  key={`roll-${i}`}
                  value={val}
                  selected={selectedIndices.includes(i)}
                  onClick={() => isMyTurn && toggleSelect(i)}
                  disabled={!isMyTurn}
                  rolling={rolling}
                />
              ))}
            </div>
          </div>
        )}

        {!hasRolled && keptDice.length === 0 && !allDiceKept && (
          <div className="empty-roll">
            {isMyTurn ? 'Roll the dice to begin!' : `Waiting for ${currentPlayer?.name} to roll...`}
          </div>
        )}
      </div>

      {qualifyHint && (
        <div className="hint">You need a 1 and a 4 among kept dice to score</div>
      )}

      {error && <div className="error">{error}</div>}

      {isMyTurn && (
        <div className="controls">
          {!hasRolled && !allDiceKept && (
            <button className="btn btn-primary btn-large" onClick={handleRoll}>
              {(myTurnState?.rollNumber || 0) === 0 ? 'Roll Dice' : 'Roll Again'}
            </button>
          )}
          {hasRolled && (
            <button
              className="btn btn-primary btn-large"
              onClick={handleKeep}
              disabled={selectedIndices.length === 0}
            >
              Keep Selected ({selectedIndices.length})
            </button>
          )}
          {canStop && (
            <button className="btn btn-secondary" onClick={handleStop}>
              Stop &amp; Score
            </button>
          )}
        </div>
      )}

      <Scoreboard
        players={gameState.players}
        currentPlayerId={gameState.currentPlayerId}
        myId={playerId}
        waitingPlayers={gameState.waitingPlayers}
      />
      <Leaderboard leaderboard={gameState.leaderboard} myId={playerId} />
    </div>
  );
}
