export function calculateScore(keptDice) {
  const sorted = [...keptDice].sort((a, b) => a - b);
  let has1 = false;
  let has4 = false;
  const scoringDice = [];

  for (const d of sorted) {
    if (!has1 && d === 1) { has1 = true; continue; }
    if (!has4 && d === 4) { has4 = true; continue; }
    scoringDice.push(d);
  }

  if (!has1 || !has4) return { qualified: false, score: 0 };
  return { qualified: true, score: scoringDice.reduce((s, v) => s + v, 0) };
}

export function hasRequiredDice(keptDice) {
  return keptDice.includes(1) && keptDice.includes(4);
}
