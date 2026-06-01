import { prisma } from "./db";
import { calculatePoints } from "./scoring";
import type { StandingsEntry, TeamStandings } from "./types";

export async function getStandings(): Promise<StandingsEntry[]> {
  const [players, config, tips] = await Promise.all([
    prisma.player.findMany({ include: { team: true } }),
    prisma.scoringConfig.findFirst(),
    prisma.tip.findMany({
      include: { match: true },
      orderBy: { id: "asc" },
    }),
  ]);

  const scoringConfig = config ?? { exactScore: 3, exactDiff: 2, tendency: 1 };

  return players.map((player) => {
    const playerTips = tips.filter((t) => t.playerId === player.id);
    const finishedTips = playerTips.filter(
      (t) => t.match.status === "FINISHED" && t.match.homeScore !== null
    );

    let totalPoints = 0;
    let exactScores = 0;
    let exactDiffs = 0;
    let tendencies = 0;
    let maxStreak = 0;
    let currentStreak = 0;
    const lastFive: (number | null)[] = [];

    for (const tip of finishedTips) {
      const pts = calculatePoints(
        tip.homeScore,
        tip.awayScore,
        tip.match.homeScore!,
        tip.match.awayScore!,
        scoringConfig
      );
      totalPoints += pts;
      if (pts === scoringConfig.exactScore) exactScores++;
      else if (pts === scoringConfig.exactDiff) exactDiffs++;
      else if (pts === scoringConfig.tendency) tendencies++;

      if (pts > 0) {
        currentStreak++;
        if (currentStreak > maxStreak) maxStreak = currentStreak;
      } else {
        currentStreak = 0;
      }
    }
    const streak = currentStreak;

    const last5 = finishedTips.slice(-5);
    for (const tip of last5) {
      const pts = calculatePoints(
        tip.homeScore,
        tip.awayScore,
        tip.match.homeScore!,
        tip.match.awayScore!,
        scoringConfig
      );
      lastFive.push(pts);
    }
    while (lastFive.length < 5) lastFive.unshift(null);

    return {
      playerId: player.id,
      playerName: player.name,
      teamId: player.teamId,
      teamName: player.team?.name ?? null,
      totalPoints,
      tippedCount: finishedTips.length,
      exactScores,
      exactDiffs,
      tendencies,
      streak,
      maxStreak,
      lastFive,
    };
  });
}

export async function getTeamStandings(): Promise<TeamStandings[]> {
  const standings = await getStandings();
  const teams = await prisma.team.findMany({ include: { players: true } });

  return teams.map((team) => {
    const playerStandings = standings.filter((s) => s.teamId === team.id);
    return {
      teamId: team.id,
      teamName: team.name,
      totalPoints: playerStandings.reduce((sum, p) => sum + p.totalPoints, 0),
      players: playerStandings.map((p) => ({
        id: p.playerId,
        name: p.playerName,
        points: p.totalPoints,
      })),
    };
  });
}
