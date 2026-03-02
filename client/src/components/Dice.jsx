const pipPositions = {
  1: [[50, 50]],
  2: [[25, 25], [75, 75]],
  3: [[25, 25], [50, 50], [75, 75]],
  4: [[25, 25], [75, 25], [25, 75], [75, 75]],
  5: [[25, 25], [75, 25], [50, 50], [25, 75], [75, 75]],
  6: [[25, 25], [75, 25], [25, 50], [75, 50], [25, 75], [75, 75]],
};

export default function Dice({ value, kept, selected, onClick, disabled, rolling }) {
  const pips = pipPositions[value] || [];
  const classes = [
    'die',
    kept && 'die-kept',
    selected && 'die-selected',
    disabled && 'die-disabled',
    rolling && 'die-rolling',
  ].filter(Boolean).join(' ');

  return (
    <button className={classes} onClick={onClick} disabled={disabled} type="button">
      <svg viewBox="0 0 100 100" className="die-face">
        {pips.map(([cx, cy], i) => (
          <circle key={i} cx={cx} cy={cy} r={10} className="pip" />
        ))}
      </svg>
    </button>
  );
}
