import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { calculatePoints } from "@/lib/scoring";

export async function GET() {
  try {
    const [players, finishedMatches, config] = await Promise.all([
      prisma.player.findMany({
        include: { team: true, tips: { include: { match: true }, orderBy: { matchId: "asc" } } },
        orderBy: { name: "asc" },
      }),
      prisma.match.findMany({
        where: { status: "FINISHED" },
        orderBy: { id: "asc" },
      }),
      prisma.scoringConfig.findFirst(),
    ]);

    const scoringConfig = config ?? { exactScore: 3, exactDiff: 2, tendency: 1 };

    // Build cumulative points timeline per player
    // Each entry: { matchId, matchLabel, cumulativePoints }
    const timelines = players.map((player) => {
      const finishedTips = player.tips.filter(
        (tip) =>
          tip.match.status === "FINISHED" &&
          tip.match.homeScore !== null &&
          tip.match.awayScore !== null
      );

      let cumulative = 0;
      const points: { matchId: number; cumulative: number; pts: number }[] = [];

      for (const tip of finishedTips) {
        const pts = calculatePoints(
          tip.homeScore,
          tip.awayScore,
          tip.match.homeScore!,
          tip.match.awayScore!,
          scoringConfig
        );
        cumulative += pts;
        points.push({ matchId: tip.matchId, cumulative, pts });
      }

      return {
        playerId: player.id,
        playerName: player.name,
        team: player.team?.name ?? null,
        points,
      };
    });

    // Overall tip distribution across all players
    let totalExact = 0;
    let totalDiff = 0;
    let totalTendency = 0;
    let totalWrong = 0;

    for (const player of players) {
      for (const tip of player.tips) {
        if (
          tip.match.status !== "FINISHED" ||
          tip.match.homeScore === null ||
          tip.match.awayScore === null
        )
          continue;
        const pts = calculatePoints(
          tip.homeScore,
          tip.awayScore,
          tip.match.homeScore!,
          tip.match.awayScore!,
          scoringConfig
        );
        if (pts === scoringConfig.exactScore) totalExact++;
        else if (pts === scoringConfig.exactDiff) totalDiff++;
        else if (pts === scoringConfig.tendency) totalTendency++;
        else totalWrong++;
      }
    }

    // Per-player summary with hit rate
    const playerStats = players.map((player) => {
      const finishedTips = player.tips.filter(
        (tip) =>
          tip.match.status === "FINISHED" &&
          tip.match.homeScore !== null &&
          tip.match.awayScore !== null
      );

      let exact = 0;
      let diff = 0;
      let tendency = 0;
      let wrong = 0;
      let maxStreak = 0;
      let tempStreak = 0;

      for (const tip of finishedTips) {
        const pts = calculatePoints(
          tip.homeScore,
          tip.awayScore,
          tip.match.homeScore!,
          tip.match.awayScore!,
          scoringConfig
        );
        if (pts === scoringConfig.exactScore) exact++;
        else if (pts === scoringConfig.exactDiff) diff++;
        else if (pts === scoringConfig.tendency) tendency++;
        else wrong++;

        if (pts > 0) {
          tempStreak++;
          if (tempStreak > maxStreak) maxStreak = tempStreak;
        } else {
          tempStreak = 0;
        }
      }

      const total = finishedTips.length;
      const hitting = exact + diff + tendency;
      const hitRate = total > 0 ? Math.round((hitting / total) * 100) : 0;

      return {
        id: player.id,
        name: player.name,
        team: player.team?.name ?? null,
        exact,
        diff,
        tendency,
        wrong,
        total,
        hitRate,
        maxStreak,
      };
    });

    return NextResponse.json({
      timelines,
      distribution: { exact: totalExact, diff: totalDiff, tendency: totalTendency, wrong: totalWrong },
      playerStats,
      finishedMatchCount: finishedMatches.length,
    });
  } catch (error) {
    console.error("GET /api/stats error:", error);
    return NextResponse.json({ error: "Failed to fetch stats" }, { status: 500 });
  }
}
