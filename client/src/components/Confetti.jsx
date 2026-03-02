import { useEffect, useState } from 'react';

const COLORS = ['#e9c46a', '#f4a261', '#e76f51', '#52b788', '#2a9d8f', '#e0aaff', '#48cae4'];
const PARTICLE_COUNT = 80;

function randomBetween(min, max) {
  return Math.random() * (max - min) + min;
}

function createParticle(id) {
  return {
    id,
    x: randomBetween(5, 95),
    delay: randomBetween(0, 2.5),
    duration: randomBetween(2, 4.5),
    color: COLORS[Math.floor(Math.random() * COLORS.length)],
    size: randomBetween(6, 12),
    drift: randomBetween(-40, 40),
    rotation: randomBetween(0, 360),
    type: Math.random() > 0.5 ? 'rect' : 'circle',
  };
}

export default function Confetti() {
  const [particles] = useState(() =>
    Array.from({ length: PARTICLE_COUNT }, (_, i) => createParticle(i))
  );

  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setVisible(false), 6000);
    return () => clearTimeout(timer);
  }, []);

  if (!visible) return null;

  return (
    <div className="confetti-container" aria-hidden="true">
      {particles.map((p) => (
        <div
          key={p.id}
          className={`confetti-piece confetti-${p.type}`}
          style={{
            left: `${p.x}%`,
            width: p.type === 'rect' ? `${p.size}px` : `${p.size}px`,
            height: p.type === 'rect' ? `${p.size * 0.5}px` : `${p.size}px`,
            background: p.color,
            animationDelay: `${p.delay}s`,
            animationDuration: `${p.duration}s`,
            '--drift': `${p.drift}px`,
            '--rotation': `${p.rotation}deg`,
          }}
        />
      ))}
    </div>
  );
}
