import { getStandings } from "@/lib/standings";
import { Trophy, Users, TrendingUp } from "lucide-react";
import { prisma } from "@/lib/db";

function PointsDot({ points }: { points: number | null }) {
  if (points === null)
    return (
      <span
        className="w-5 h-5 rounded-full bg-slate-600 inline-block flex-shrink-0"
        title="Kein Tipp"
      />
    );
  if (points >= 3)
    return (
      <span
        className="w-5 h-5 rounded-full bg-emerald-500 inline-block flex-shrink-0"
        title={`${points} Pts – Exakt`}
      />
    );
  if (points === 2)
    return (
      <span
        className="w-5 h-5 rounded-full bg-amber-400 inline-block flex-shrink-0"
        title={`${points} Pts – Differenz`}
      />
    );
  if (points === 1)
    return (
      <span
        className="w-5 h-5 rounded-full bg-orange-500 inline-block flex-shrink-0"
        title={`${points} Pt – Tendenz`}
      />
    );
  return (
    <span
      className="w-5 h-5 rounded-full bg-red-600 inline-block flex-shrink-0"
      title="0 Pts – Falsch"
    />
  );
}

function RankBadge({ rank }: { rank: number }) {
  if (rank === 1)
    return (
      <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-yellow-500 text-slate-900 text-sm font-black">
        1
      </span>
    );
  if (rank === 2)
    return (
      <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-slate-400 text-slate-900 text-sm font-black">
        2
      </span>
    );
  if (rank === 3)
    return (
      <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-amber-700 text-white text-sm font-black">
        3
      </span>
    );
  return (
    <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-slate-700 text-slate-300 text-sm font-bold">
      {rank}
    </span>
  );
}

function StreakBadge({ streak }: { streak: number }) {
  if (streak === 0)
    return <span className="text-slate-500 text-sm">–</span>;
  if (streak >= 5)
    return (
      <span className="inline-flex items-center gap-1 text-sm font-bold text-emerald-400">
        🔥 {streak}
      </span>
    );
  return <span className="text-sm font-semibold text-slate-300">{streak}</span>;
}

export default async function RanglistePage() {
  const [standings, teams] = await Promise.all([
    getStandings().catch(() => []),
    prisma.team.findMany({ include: { players: true }, orderBy: { name: "asc" } }).catch(() => []),
  ]);

  const sorted = [...standings].sort(
    (a, b) =>
      b.totalPoints - a.totalPoints ||
      b.exactScores - a.exactScores ||
      b.exactDiffs - a.exactDiffs
  );

  // Team standings
  const teamStandingsMap = new Map<string, { points: number; players: string[] }>();
  for (const entry of sorted) {
    const teamName = entry.teamName ?? "Kein Team";
    if (!teamStandingsMap.has(teamName)) {
      teamStandingsMap.set(teamName, { points: 0, players: [] });
    }
    const t = teamStandingsMap.get(teamName)!;
    t.points += entry.totalPoints;
    t.players.push(entry.playerName);
  }
  const teamStandings = Array.from(teamStandingsMap.entries())
    .filter(([name]) => name !== "Kein Team")
    .map(([name, data]) => ({ name, ...data }))
    .sort((a, b) => b.points - a.points);

  const totalTips = sorted.reduce((s, e) => s + e.tippedCount, 0);
  const totalPoints = sorted.reduce((s, e) => s + e.totalPoints, 0);
  const totalExact = sorted.reduce((s, e) => s + e.exactScores, 0);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="bg-slate-700 rounded-xl p-2.5">
          <Trophy className="w-6 h-6 text-amber-400" />
        </div>
        <div>
          <h1 className="text-2xl font-black text-white">Rangliste</h1>
          <p className="text-slate-400 text-sm">
            {sorted.length} Spieler · {totalTips} Tipps gesamt · {totalPoints} Punkte vergeben
          </p>
        </div>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap items-center gap-4 text-xs text-slate-400 bg-slate-800 rounded-xl border border-slate-700 px-4 py-3">
        <span className="font-semibold text-slate-300">Legende:</span>
        <span className="flex items-center gap-1.5">
          <span className="w-4 h-4 rounded-full bg-emerald-500 inline-block" />
          Exaktes Ergebnis
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-4 h-4 rounded-full bg-amber-400 inline-block" />
          Richtige Differenz
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-4 h-4 rounded-full bg-orange-500 inline-block" />
          Richtige Tendenz
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-4 h-4 rounded-full bg-red-600 inline-block" />
          Falsch
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-4 h-4 rounded-full bg-slate-600 inline-block" />
          Kein Tipp
        </span>
      </div>

      {/* Individual standings */}
      <div className="bg-slate-800 rounded-xl border border-slate-700 shadow-lg overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-700 flex items-center gap-2">
          <Trophy className="w-5 h-5 text-amber-400" />
          <h2 className="font-bold text-white">Einzelwertung</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-700/60 text-slate-400 text-xs uppercase tracking-wide">
                <th className="px-4 py-3 text-left">#</th>
                <th className="px-4 py-3 text-left">Spieler</th>
                <th className="px-4 py-3 text-left hidden md:table-cell">Team</th>
                <th className="px-4 py-3 text-right font-bold text-slate-200">Punkte</th>
                <th className="px-4 py-3 text-right hidden sm:table-cell">Tipps</th>
                <th className="px-4 py-3 text-right hidden sm:table-cell text-emerald-400">
                  Exakt
                </th>
                <th className="px-4 py-3 text-right hidden md:table-cell text-amber-400">Diff</th>
                <th className="px-4 py-3 text-right hidden lg:table-cell text-orange-400">
                  Tendenz
                </th>
                <th className="px-4 py-3 text-center hidden md:table-cell">Serie</th>
                <th className="px-4 py-3 text-center hidden lg:table-cell">Max.Serie</th>
                <th className="px-4 py-3 text-center">Letzte 5</th>
              </tr>
            </thead>
            <tbody>
              {sorted.length === 0 && (
                <tr>
                  <td colSpan={11} className="px-4 py-12 text-center text-slate-500">
                    Noch keine Spieler vorhanden
                  </td>
                </tr>
              )}
              {sorted.map((entry, idx) => (
                <tr
                  key={entry.playerId}
                  className={`border-t border-slate-700/50 hover:bg-slate-700/30 transition-colors ${
                    idx === 0 ? "bg-yellow-900/10" : ""
                  }`}
                >
                  <td className="px-4 py-3">
                    <RankBadge rank={idx + 1} />
                  </td>
                  <td className="px-4 py-3">
                    <span className="font-bold text-white text-base">{entry.playerName}</span>
                  </td>
                  <td className="px-4 py-3 text-slate-400 hidden md:table-cell">
                    {entry.teamName ?? "–"}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <span className="font-black text-2xl text-white">{entry.totalPoints}</span>
                  </td>
                  <td className="px-4 py-3 text-right text-slate-300 hidden sm:table-cell">
                    {entry.tippedCount}
                  </td>
                  <td className="px-4 py-3 text-right text-emerald-400 font-semibold hidden sm:table-cell">
                    {entry.exactScores}
                  </td>
                  <td className="px-4 py-3 text-right text-amber-400 font-semibold hidden md:table-cell">
                    {entry.exactDiffs}
                  </td>
                  <td className="px-4 py-3 text-right text-orange-400 font-semibold hidden lg:table-cell">
                    {entry.tendencies}
                  </td>
                  <td className="px-4 py-3 text-center hidden md:table-cell">
                    <StreakBadge streak={entry.streak} />
                  </td>
                  <td className="px-4 py-3 text-center hidden lg:table-cell">
                    <span className="text-slate-300 font-semibold">{entry.maxStreak}</span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-center gap-1">
                      {entry.lastFive.map((pts, i) => (
                        <PointsDot key={i} points={pts} />
                      ))}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Summary row */}
        {sorted.length > 0 && (
          <div className="px-5 py-3 border-t border-slate-700 bg-slate-700/30 flex flex-wrap gap-4 text-xs text-slate-400">
            <span>
              Gesamt:{" "}
              <span className="text-white font-bold">{totalPoints} Punkte</span>
            </span>
            <span>
              Exakt:{" "}
              <span className="text-emerald-400 font-bold">{totalExact}</span>
            </span>
            <span>
              Tipps:{" "}
              <span className="text-slate-200 font-bold">{totalTips}</span>
            </span>
          </div>
        )}
      </div>

      {/* Team standings */}
      {teamStandings.length > 0 && (
        <div className="bg-slate-800 rounded-xl border border-slate-700 shadow-lg overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-700 flex items-center gap-2">
            <Users className="w-5 h-5 text-blue-400" />
            <h2 className="font-bold text-white">Teamwertung</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-700/60 text-slate-400 text-xs uppercase tracking-wide">
                  <th className="px-4 py-3 text-left">#</th>
                  <th className="px-4 py-3 text-left">Team</th>
                  <th className="px-4 py-3 text-left hidden sm:table-cell">Spieler</th>
                  <th className="px-4 py-3 text-right font-bold text-slate-200">Punkte</th>
                </tr>
              </thead>
              <tbody>
                {teamStandings.map((team, idx) => (
                  <tr
                    key={team.name}
                    className="border-t border-slate-700/50 hover:bg-slate-700/30 transition-colors even:bg-slate-800/50"
                  >
                    <td className="px-4 py-3">
                      <RankBadge rank={idx + 1} />
                    </td>
                    <td className="px-4 py-3">
                      <span className="font-bold text-white">{team.name}</span>
                    </td>
                    <td className="px-4 py-3 text-slate-400 hidden sm:table-cell">
                      {team.players.join(", ")}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span className="font-black text-xl text-white">{team.points}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Streak hall of fame */}
      {sorted.filter((e) => e.maxStreak > 0).length > 0 && (
        <div className="bg-slate-800 rounded-xl border border-slate-700 shadow-lg overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-700 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-emerald-400" />
            <h2 className="font-bold text-white">Serien-Bestenliste</h2>
          </div>
          <div className="p-4 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {[...sorted]
              .sort((a, b) => b.maxStreak - a.maxStreak)
              .slice(0, 8)
              .map((entry, idx) => (
                <div
                  key={entry.playerId}
                  className="bg-slate-700/40 rounded-lg p-3 border border-slate-700/50 text-center"
                >
                  <div className="text-3xl font-black text-emerald-400 mb-1">
                    {entry.maxStreak}
                  </div>
                  <div className="text-slate-300 text-sm font-semibold">{entry.playerName}</div>
                  <div className="text-slate-500 text-xs mt-0.5">Max. Serie</div>
                  {idx === 0 && (
                    <div className="mt-2 text-xs text-yellow-400 font-bold">🏆 Rekord!</div>
                  )}
                </div>
              ))}
          </div>
        </div>
      )}
    </div>
  );
}
