import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { playerId, matchId, homeScore, awayScore } = body;

    if (playerId == null || matchId == null || homeScore == null || awayScore == null) {
      return NextResponse.json(
        { error: "playerId, matchId, homeScore, and awayScore are required" },
        { status: 400 }
      );
    }

    const playerIdNum = Number(playerId);
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

    // Validate that match exists and is UPCOMING
    const match = await prisma.match.findUnique({ where: { id: matchIdNum } });
    if (!match) {
      return NextResponse.json({ error: "Match not found" }, { status: 404 });
    }
    if (match.status !== "UPCOMING") {
      return NextResponse.json(
        { error: "Cannot tip a match that is not UPCOMING" },
        { status: 400 }
      );
    }

    // Validate player exists
    const player = await prisma.player.findUnique({ where: { id: playerIdNum } });
    if (!player) {
      return NextResponse.json({ error: "Player not found" }, { status: 404 });
    }

    const tip = await prisma.tip.upsert({
      where: { playerId_matchId: { playerId: playerIdNum, matchId: matchIdNum } },
      create: {
        playerId: playerIdNum,
        matchId: matchIdNum,
        homeScore: homeScoreNum,
        awayScore: awayScoreNum,
      },
      update: {
        homeScore: homeScoreNum,
        awayScore: awayScoreNum,
      },
    });

    return NextResponse.json(tip, { status: 200 });
  } catch (error) {
    console.error("POST /api/tips error:", error);
    return NextResponse.json({ error: "Failed to upsert tip" }, { status: 500 });
  }
}
