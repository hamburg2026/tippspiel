import { NextRequest, NextResponse } from "next/server";
import { getStandings, getTeamStandings } from "@/lib/standings";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const type = searchParams.get("type") ?? "individual";

    if (type === "team") {
      const teamStandings = await getTeamStandings();
      return NextResponse.json(teamStandings);
    }

    const standings = await getStandings();
    // Sort by total points descending, then exactScores descending as tiebreaker
    standings.sort(
      (a, b) =>
        b.totalPoints - a.totalPoints ||
        b.exactScores - a.exactScores ||
        b.exactDiffs - a.exactDiffs
    );
    return NextResponse.json(standings);
  } catch (error) {
    console.error("GET /api/standings error:", error);
    return NextResponse.json({ error: "Failed to fetch standings" }, { status: 500 });
  }
}
