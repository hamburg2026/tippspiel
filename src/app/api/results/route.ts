import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { calculatePoints } from "@/lib/scoring";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { matchId, homeScore, awayScore, adminPassword } = body;

    if (matchId == null || homeScore == null || awayScore == null) {
      return NextResponse.json(
        { error: "matchId, homeScore, and awayScore are required" },
        { status: 400 }
      );
    }

    // Validate admin password
    const appConfig = await prisma.appConfig.findUnique({ where: { key: "adminPassword" } });
    const expectedPassword = appConfig?.value;
    if (!expectedPassword || adminPassword !== expectedPassword) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const matchIdNum = Number(matchId);
    const homeScoreNum = Number(homeScore);
    const awayScoreNum = Number(awayScore);

    if (
      !Number.isInteger(homeScoreNum) ||
      !Number.isInteger(awayScoreNum) ||
      homeScoreNum < 0 ||
      awayScoreNum < 0
    ) {
      return NextResponse.json(
        { error: "homeScore and awayScore must be non-negative integers" },
        { status: 400 }
      );
    }

    // Verify match exists
    const match = await prisma.match.findUnique({ where: { id: matchIdNum } });
    if (!match) {
      return NextResponse.json({ error: "Match not found" }, { status: 404 });
    }

    // Get scoring config (with defaults)
    const config = await prisma.scoringConfig.findFirst();
    const scoringConfig = config ?? { exactScore: 3, exactDiff: 2, tendency: 1 };

    // 1. Update match result and status
    const updatedMatch = await prisma.match.update({
      where: { id: matchIdNum },
      data: {
        homeScore: homeScoreNum,
        awayScore: awayScoreNum,
        status: "FINISHED",
      },
    });

    // 2. Find all tips for this match
    const tips = await prisma.tip.findMany({ where: { matchId: matchIdNum } });

    // 3. Calculate and update points for each tip
    const updatePromises = tips.map((tip) => {
      const points = calculatePoints(
        tip.homeScore,
        tip.awayScore,
        homeScoreNum,
        awayScoreNum,
        scoringConfig
      );
      return prisma.tip.update({
        where: { id: tip.id },
        data: { points },
      });
    });

    await Promise.all(updatePromises);

    return NextResponse.json({
      match: updatedMatch,
      tipsUpdated: tips.length,
    });
  } catch (error) {
    console.error("POST /api/results error:", error);
    return NextResponse.json({ error: "Failed to set match result" }, { status: 500 });
  }
}
