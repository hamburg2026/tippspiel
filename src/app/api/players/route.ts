import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET() {
  try {
    const players = await prisma.player.findMany({
      include: { team: true },
      orderBy: { name: "asc" },
    });
    return NextResponse.json(players);
  } catch (error) {
    console.error("GET /api/players error:", error);
    return NextResponse.json({ error: "Failed to fetch players" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, teamId } = body;

    if (!name || typeof name !== "string" || name.trim() === "") {
      return NextResponse.json({ error: "name is required" }, { status: 400 });
    }

    const player = await prisma.player.create({
      data: {
        name: name.trim(),
        teamId: teamId != null ? Number(teamId) : null,
      },
      include: { team: true },
    });

    return NextResponse.json(player, { status: 201 });
  } catch (error) {
    console.error("POST /api/players error:", error);
    return NextResponse.json({ error: "Failed to create player" }, { status: 500 });
  }
}
