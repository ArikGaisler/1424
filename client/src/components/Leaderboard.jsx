export default function Leaderboard({ leaderboard, myId }) {
  if (!leaderboard || leaderboard.length === 0) return null;

  const hasAnyWins = leaderboard.some(p => p.wins > 0);
  if (!hasAnyWins) return null;

  return (
    <div className="leaderboard">
      <h3 className="leaderboard-title">Leaderboard</h3>
      {leaderboard.map((p, i) => (
        <div key={p.id} className={`lb-row ${p.id === myId ? 'lb-me' : ''}`}>
          <span className="lb-rank">{i + 1}</span>
          <span className="lb-name">{p.name}</span>
          <span className="lb-wins">
            {p.wins} {p.wins === 1 ? 'win' : 'wins'}
          </span>
        </div>
      ))}
    </div>
  );
}
