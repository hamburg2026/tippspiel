export type Stage = "GROUP" | "R32" | "R16" | "QF" | "SF" | "THIRD" | "FINAL";
export type MatchStatus = "UPCOMING" | "FINISHED";
export type Tendency = "H" | "D" | "A";

export interface StandingsEntry {
  playerId: number;
  playerName: string;
  teamId: number | null;
  teamName: string | null;
  totalPoints: number;
  tippedCount: number;
  exactScores: number;    // tips with max points
  exactDiffs: number;     // tips with exactDiff points
  tendencies: number;     // tips with tendency points
  streak: number;         // current streak of correct tendency tips
  maxStreak: number;
  lastFive: (number | null)[];  // points for last 5 tips
}

export interface TeamStandings {
  teamId: number;
  teamName: string;
  totalPoints: number;
  players: { id: number; name: string; points: number }[];
}
