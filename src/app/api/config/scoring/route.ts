import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { calculatePoints } from "@/lib/scoring";

const DEFAULT_CONFIG = { exactScore: 3, exactDiff: 2, tendency: 1 };

export async function GET() {
  try {
    const config = await prisma.scoringConfig.findFirst();
    return NextResponse.json(config ?? { id: 1, ...DEFAULT_CONFIG });
  } catch (error) {
    console.error("GET /api/config/scoring error:", error);
    return NextResponse.json({ error: "Failed to fetch scoring config" }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { exactScore, exactDiff, tendency, adminPassword } = body;

    // Validate admin password
    const appConfig = await prisma.appConfig.findUnique({ where: { key: "adminPassword" } });
    const expectedPassword = appConfig?.value;
    if (!expectedPassword || adminPassword !== expectedPassword) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (exactScore == null || exactDiff == null || tendency == null) {
      return NextResponse.json(
        { error: "exactScore, exactDiff, and tendency are required" },
        { status: 400 }
      );
    }

    const exactScoreNum = Number(exactScore);
    const exactDiffNum = Number(exactDiff);
    const tendencyNum = Number(tendency);

    if (
      !Number.isInteger(exactScoreNum) ||
      !Number.isInteger(exactDiffNum) ||
      !Number.isInteger(tendencyNum) ||
      exactScoreNum < 0 ||
      exactDiffNum < 0 ||
      tendencyNum < 0
    ) {
      return NextResponse.json(
        { error: "exactScore, exactDiff, and tendency must be non-negative integers" },
        { status: 400 }
      );
    }

    const newConfig = { exactScore: exactScoreNum, exactDiff: exactDiffNum, tendency: tendencyNum };

    // Upsert the scoring config (always id=1)
    const updatedConfig = await prisma.scoringConfig.upsert({
      where: { id: 1 },
      create: { id: 1, ...newConfig },
      update: newConfig,
    });

    // Recalculate all tip points for finished matches
    const tips = await prisma.tip.findMany({
      include: { match: true },
    });

    const finishedTips = tips.filter(
      (tip) =>
        tip.match.status === "FINISHED" &&
        tip.match.homeScore !== null &&
        tip.match.awayScore !== null
    );

    const updatePromises = finishedTips.map((tip) => {
      const points = calculatePoints(
        tip.homeScore,
        tip.awayScore,
        tip.match.homeScore!,
        tip.match.awayScore!,
        newConfig
      );
      return prisma.tip.update({
        where: { id: tip.id },
        data: { points },
      });
    });

    await Promise.all(updatePromises);

    return NextResponse.json({
      config: updatedConfig,
      tipsRecalculated: finishedTips.length,
    });
  } catch (error) {
    console.error("PUT /api/config/scoring error:", error);
    return NextResponse.json({ error: "Failed to update scoring config" }, { status: 500 });
  }
}
