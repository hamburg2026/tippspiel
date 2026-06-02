import { prisma } from "@/lib/db";
import { getStandings } from "@/lib/standings";
import { Trophy, Calendar, Users, TrendingUp } from "lucide-react";
import Link from "next/link";

function PointsDot({ points }: { points: number | null }) {
  if (points === null) {
    return <span className="w-5 h-5 rounded-full bg-slate-600 inline-block" />;
  }
  if (points >= 3) return <span className="w-5 h-5 rounded-full bg-emerald-500 inline-block" title={`${points} Pts`} />;
  if (points === 2) return <span className="w-5 h-5 rounded-full bg-amber-400 inline-block" title={`${points} Pts`} />;
  if (points === 1) return <span className="w-5 h-5 rounded-full bg-orange-500 inline-block" title={`${points} Pts`} />;
  return <span className="w-5 h-5 rounded-full bg-red-600 inline-block" title="0 Pts" />;
}

function RankBadge({ rank }: { rank: number }) {
  if (rank === 1)
    return (
      <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-yellow-500 text-slate-900 text-xs font-black">
        1
      </span>
    );
  if (rank === 2)
    return (
      <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-slate-400 text-slate-900 text-xs font-black">
        2
      </span>
    );
  if (rank === 3)
    return (
      <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-amber-700 text-white text-xs font-black">
        3
      </span>
    );
  return (
    <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-slate-700 text-slate-300 text-xs font-bold">
      {rank}
    </span>
  );
}

export default async function DashboardPage() {
  // Fetch data in parallel
  const [standings, recentMatches, upcomingMatches, groupData] = await Promise.all([
    getStandings().catch(() => []),
    prisma.match
      .findMany({
        where: { status: "FINISHED" },
        include: { group: true, tips: { include: { player: true } } },
        orderBy: { id: "desc" },
        take: 5,
      })
      .catch(() => []),
    prisma.match
      .findMany({
        where: { status: "UPCOMING" },
        include: { group: true },
        orderBy: [{ matchDay: "asc" }, { id: "asc" }],
        take: 5,
      })
      .catch(() => []),
    prisma.wcGroup
      .findMany({
        include: { teams: true },
        orderBy: { name: "asc" },
        take: 4,
      })
      .catch(() => []),
  ]);

  const sortedStandings = [...standings].sort(
    (a, b) => b.totalPoints - a.totalPoints || b.exactScores - a.exactScores
  );
  const top5 = sortedStandings.slice(0, 5);

  const today = new Date().toLocaleDateString("de-DE", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <div className="space-y-8">
      {/* Hero */}
      <div className="relative rounded-2xl overflow-hidden bg-gradient-to-br from-slate-800 via-slate-800 to-emerald-900 border border-slate-700 shadow-2xl p-8">
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-600/10 to-transparent pointer-events-none" />
        <div className="relative">
          <div className="flex items-center gap-3 mb-3">
            <div className="bg-emerald-600 rounded-xl p-3">
              <Trophy className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
                WM 2026 Tippspiel
              </h1>
              <p className="text-slate-400 text-sm mt-0.5">{today}</p>
            </div>
          </div>
          <p className="text-slate-300 text-base max-w-xl">
            Tippe die Ergebnisse der FIFA Weltmeisterschaft 2026 und sammle Punkte. Wer trifft am
            genauesten?
          </p>
          <div className="flex flex-wrap gap-3 mt-5">
            <Link
              href="/spielplan"
              className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg px-5 py-2.5 font-semibold text-sm transition-colors"
            >
              <Calendar className="w-4 h-4" />
              Tipps abgeben
            </Link>
            <Link
              href="/rangliste"
              className="inline-flex items-center gap-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg px-5 py-2.5 font-semibold text-sm transition-colors border border-slate-600"
            >
              <Trophy className="w-4 h-4" />
              Rangliste
            </Link>
          </div>
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          {
            label: "Spieler",
            value: standings.length,
            icon: Users,
            color: "text-blue-400",
            bg: "bg-blue-900/30",
          },
          {
            label: "Abgeschlossene Spiele",
            value: recentMatches.length > 0 ? recentMatches.length + "+" : "0",
            icon: Trophy,
            color: "text-emerald-400",
            bg: "bg-emerald-900/30",
          },
          {
            label: "Anstehende Spiele",
            value: upcomingMatches.length,
            icon: Calendar,
            color: "text-amber-400",
            bg: "bg-amber-900/30",
          },
          {
            label: "Führender",
            value: top5[0]?.playerName ?? "–",
            icon: TrendingUp,
            color: "text-purple-400",
            bg: "bg-purple-900/30",
          },
        ].map(({ label, value, icon: Icon, color, bg }) => (
          <div
            key={label}
            className="bg-slate-800 rounded-xl p-4 border border-slate-700 flex items-center gap-3"
          >
            <div className={`${bg} rounded-lg p-2.5 flex-shrink-0`}>
              <Icon className={`w-5 h-5 ${color}`} />
            </div>
            <div className="min-w-0">
              <div className="font-bold text-white text-lg truncate">{value}</div>
              <div className="text-slate-400 text-xs">{label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Main grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Rangliste preview */}
        <div className="lg:col-span-2 bg-slate-800 rounded-xl border border-slate-700 shadow-lg overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-slate-700">
            <h2 className="font-bold text-white flex items-center gap-2">
              <Trophy className="w-5 h-5 text-amber-400" />
              Rangliste (Top 5)
            </h2>
            <Link
              href="/rangliste"
              className="text-xs text-emerald-400 hover:text-emerald-300 font-medium"
            >
              Alle anzeigen →
            </Link>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-700/50 text-slate-400 text-xs uppercase tracking-wide">
                  <th className="px-4 py-3 text-left">#</th>
                  <th className="px-4 py-3 text-left">Spieler</th>
                  <th className="px-4 py-3 text-left hidden sm:table-cell">Team</th>
                  <th className="px-4 py-3 text-right">Punkte</th>
                  <th className="px-4 py-3 text-right hidden sm:table-cell">Exakt</th>
                  <th className="px-4 py-3 text-center">Letzte 5</th>
                </tr>
              </thead>
              <tbody>
                {top5.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center text-slate-500">
                      Noch keine Spieler vorhanden
                    </td>
                  </tr>
                )}
                {top5.map((entry, idx) => (
                  <tr
                    key={entry.playerId}
                    className="border-t border-slate-700/50 hover:bg-slate-700/30 transition-colors"
                  >
                    <td className="px-4 py-3">
                      <RankBadge rank={idx + 1} />
                    </td>
                    <td className="px-4 py-3">
                      <span className="font-semibold text-white">{entry.playerName}</span>
                    </td>
                    <td className="px-4 py-3 text-slate-400 hidden sm:table-cell">
                      {entry.teamName ?? "–"}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span className="font-black text-lg text-white">{entry.totalPoints}</span>
                    </td>
                    <td className="px-4 py-3 text-right text-emerald-400 hidden sm:table-cell">
                      {entry.exactScores}
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
        </div>

        {/* Upcoming matches */}
        <div className="bg-slate-800 rounded-xl border border-slate-700 shadow-lg overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-slate-700">
            <h2 className="font-bold text-white flex items-center gap-2">
              <Calendar className="w-5 h-5 text-emerald-400" />
              Nächste Spiele
            </h2>
            <Link
              href="/spielplan"
              className="text-xs text-emerald-400 hover:text-emerald-300 font-medium"
            >
              Alle →
            </Link>
          </div>
          <div className="divide-y divide-slate-700/50">
            {upcomingMatches.length === 0 && (
              <div className="px-4 py-8 text-center text-slate-500 text-sm">
                Keine anstehenden Spiele
              </div>
            )}
            {upcomingMatches.map((match) => (
              <div key={match.id} className="px-4 py-3 hover:bg-slate-700/30 transition-colors">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="text-white font-medium text-sm truncate">
                      {match.homeTeam ?? match.homePlaceholder ?? "?"} vs{" "}
                      {match.awayTeam ?? match.awayPlaceholder ?? "?"}
                    </div>
                    <div className="flex items-center gap-2 mt-0.5">
                      {match.group && (
                        <span className="text-emerald-400 text-xs">Gr. {match.group.name}</span>
                      )}
                      {match.matchDate && (
                        <span className="text-slate-500 text-xs">
                          {new Date(match.matchDate).toLocaleDateString("de-DE", {
                            day: "2-digit",
                            month: "2-digit",
                          })}
                        </span>
                      )}
                    </div>
                  </div>
                  <span className="text-xs bg-emerald-900/50 text-emerald-400 border border-emerald-700/50 px-2 py-0.5 rounded-full flex-shrink-0">
                    Offen
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent results */}
      <div className="bg-slate-800 rounded-xl border border-slate-700 shadow-lg overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-700">
          <h2 className="font-bold text-white flex items-center gap-2">
            <Trophy className="w-5 h-5 text-slate-400" />
            Letzte Ergebnisse
          </h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 p-4">
          {recentMatches.length === 0 && (
            <div className="col-span-3 text-center text-slate-500 py-8 text-sm">
              Noch keine Ergebnisse
            </div>
          )}
          {recentMatches.map((match) => (
            <div
              key={match.id}
              className="bg-slate-700/40 rounded-lg p-4 border border-slate-700/50"
            >
              <div className="flex items-center gap-1 mb-2">
                {match.group && (
                  <span className="text-xs text-emerald-400 font-medium">
                    Gruppe {match.group.name}
                  </span>
                )}
              </div>
              <div className="flex items-center justify-between gap-2">
                <span className="text-white font-semibold text-sm flex-1">
                  {match.homeTeam ?? "?"}
                </span>
                <div className="flex items-center gap-1 px-2">
                  <span className="text-xl font-black text-white">{match.homeScore}</span>
                  <span className="text-slate-500">:</span>
                  <span className="text-xl font-black text-white">{match.awayScore}</span>
                </div>
                <span className="text-white font-semibold text-sm flex-1 text-right">
                  {match.awayTeam ?? "?"}
                </span>
              </div>
              {match.tips.length > 0 && (
                <div className="mt-2 pt-2 border-t border-slate-700/50 text-xs text-slate-400">
                  {match.tips.length} Tipp{match.tips.length !== 1 ? "s" : ""} abgegeben
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Group overview */}
      {groupData.length > 0 && (
        <div className="bg-slate-800 rounded-xl border border-slate-700 shadow-lg overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-slate-700">
            <h2 className="font-bold text-white flex items-center gap-2">
              <Users className="w-5 h-5 text-blue-400" />
              Gruppenübersicht
            </h2>
            <Link
              href="/gruppen"
              className="text-xs text-emerald-400 hover:text-emerald-300 font-medium"
            >
              Alle Gruppen →
            </Link>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4">
            {groupData.map((group) => (
              <div key={group.id} className="bg-slate-700/40 rounded-lg p-3 border border-slate-700/50">
                <div className="text-xs font-bold text-emerald-400 mb-2">Gruppe {group.name}</div>
                <div className="space-y-1">
                  {group.teams.slice(0, 4).map((team) => (
                    <div key={team.id} className="flex items-center gap-2 text-xs">
                      {team.flag && <span>{team.flag}</span>}
                      <span className="text-slate-300 truncate">{team.name}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
