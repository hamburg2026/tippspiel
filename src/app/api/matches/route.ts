import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const playerIdParam = searchParams.get("playerId");
    const stage = searchParams.get("stage");
    const groupIdParam = searchParams.get("groupId");

    const playerId = playerIdParam ? Number(playerIdParam) : null;
    const groupId = groupIdParam ? Number(groupIdParam) : null;

    // Build where clause
    const where: Record<string, unknown> = {};
    if (stage) where.stage = stage;
    if (groupId) where.groupId = groupId;

    const matches = await prisma.match.findMany({
      where,
      include: {
        group: true,
        tips: playerId
          ? { where: { playerId } }
          : false,
      },
      orderBy: [{ matchDay: "asc" }, { id: "asc" }],
    });

    return NextResponse.json(matches);
  } catch (error) {
    console.error("GET /api/matches error:", error);
    return NextResponse.json({ error: "Failed to fetch matches" }, { status: 500 });
  }
}
