export default function Scoreboard({ players, currentPlayerId, myId, waitingPlayers }) {
  return (
    <div className="scoreboard">
      <h3>Players</h3>
      {players.map((p) => {
        const isCurrent = p.id === currentPlayerId;
        const isMe = p.id === myId;
        const turn = p.turnState;

        let statusText = '';
        if (turn?.finished) {
          statusText = turn.score?.qualified
            ? `Score: ${turn.score.score}`
            : 'Busted!';
        } else if (isCurrent) {
          statusText = 'Rolling...';
        } else {
          statusText = 'Waiting';
        }

        return (
          <div key={p.id} className={`sb-player ${isCurrent ? 'sb-active' : ''} ${isMe ? 'sb-me' : ''} ${p.disconnected ? 'sb-disconnected' : ''}`}>
            <div className="sb-name">
              {p.name}
              {isMe && <span className="you-badge">YOU</span>}
              {p.disconnected && <span className="dc-badge">DC</span>}
            </div>
            <div className="sb-kept">
              {turn?.keptDice?.map((d, i) => (
                <span key={i} className="sb-mini-die">{d}</span>
              ))}
            </div>
            <div className={`sb-status ${turn?.finished && !turn.score?.qualified ? 'sb-bust' : ''}`}>
              {statusText}
            </div>
          </div>
        );
      })}

      {waitingPlayers?.length > 0 && (
        <>
          <h3 className="sb-waiting-header">Joining Next Round</h3>
          {waitingPlayers.map((p) => (
            <div key={p.id} className="sb-player sb-waiting">
              <div className="sb-name">{p.name}</div>
              <div />
              <div className="sb-status">Waiting</div>
            </div>
          ))}
        </>
      )}
    </div>
  );
}
