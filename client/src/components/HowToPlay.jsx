import { useState } from 'react';

export default function HowToPlay() {
  const [open, setOpen] = useState(false);

  return (
    <div className="how-to-play">
      <button className="htp-toggle" onClick={() => setOpen(!open)} type="button">
        How to Play {open ? '\u25B2' : '\u25BC'}
      </button>
      {open && (
        <div className="htp-content">
          <ol>
            <li>Roll all <strong>6 dice</strong> on your turn.</li>
            <li>You <strong>must keep at least 1 die</strong> after each roll.</li>
            <li>Set aside a <strong>1</strong> and a <strong>4</strong> to qualify for scoring.</li>
            <li>The <strong>remaining 4 dice</strong> are summed for your score.</li>
            <li>Keep rolling or stop early &mdash; but no 1 &amp; 4 means a <strong>bust</strong> (0 points).</li>
            <li>Highest score wins! <strong>Maximum possible: 24</strong> (four 6s).</li>
          </ol>
        </div>
      )}
    </div>
  );
}
