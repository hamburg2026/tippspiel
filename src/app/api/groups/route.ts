import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getTendency } from "@/lib/scoring";

export async function GET() {
  try {
    const groups = await prisma.wcGroup.findMany({
      include: {
        teams: true,
        matches: {
          where: { status: "FINISHED" },
        },
      },
      orderBy: { name: "asc" },
    });

    const result = groups.map((group) => {
      // Build standing for each team in this group
      const teamStats = group.teams.map((team) => {
        let played = 0;
        let won = 0;
        let drawn = 0;
        let lost = 0;
        let goalsFor = 0;
        let goalsAgainst = 0;

        for (const match of group.matches) {
          const isHome = match.homeTeam === team.name;
          const isAway = match.awayTeam === team.name;
          if (!isHome && !isAway) continue;
          if (match.homeScore === null || match.awayScore === null) continue;

          played++;
          const tendency = getTendency(match.homeScore, match.awayScore);

          if (isHome) {
            goalsFor += match.homeScore;
            goalsAgainst += match.awayScore;
            if (tendency === "H") won++;
            else if (tendency === "D") drawn++;
            else lost++;
          } else {
            goalsFor += match.awayScore;
            goalsAgainst += match.homeScore;
            if (tendency === "A") won++;
            else if (tendency === "D") drawn++;
            else lost++;
          }
        }

        const points = won * 3 + drawn;
        const goalDiff = goalsFor - goalsAgainst;

        return {
          id: team.id,
          name: team.name,
          flag: team.flag,
          played,
          won,
          drawn,
          lost,
          goalsFor,
          goalsAgainst,
          goalDiff,
          points,
        };
      });

      // Sort: points desc, goal diff desc, goals for desc
      teamStats.sort(
        (a, b) =>
          b.points - a.points ||
          b.goalDiff - a.goalDiff ||
          b.goalsFor - a.goalsFor ||
          a.name.localeCompare(b.name)
      );

      return {
        id: group.id,
        name: group.name,
        teams: teamStats,
        matches: group.matches,
      };
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error("GET /api/groups error:", error);
    return NextResponse.json({ error: "Failed to fetch groups" }, { status: 500 });
  }
}
