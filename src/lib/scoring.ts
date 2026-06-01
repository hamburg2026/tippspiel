// calculatePoints: given scoring config and tip vs actual result
// Returns points based on:
// - exactScore points: correct tendency AND exact scores
// - exactDiff points: correct tendency AND exact goal difference
// - tendency points: correct tendency only
// tendency = result (home win / draw / away win)

export function getTendency(home: number, away: number): "H" | "D" | "A" {
  if (home > away) return "H";
  if (home === away) return "D";
  return "A";
}

export function calculatePoints(
  tipHome: number,
  tipAway: number,
  actualHome: number,
  actualAway: number,
  config: { exactScore: number; exactDiff: number; tendency: number }
): number {
  const tipTendency = getTendency(tipHome, tipAway);
  const actualTendency = getTendency(actualHome, actualAway);

  if (tipTendency !== actualTendency) return 0;

  if (tipHome === actualHome && tipAway === actualAway) {
    return config.exactScore;
  }

  if (tipHome - tipAway === actualHome - actualAway) {
    return config.exactDiff;
  }

  return config.tendency;
}
