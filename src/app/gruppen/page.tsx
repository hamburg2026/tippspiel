import { prisma } from "@/lib/db";
import { getTendency } from "@/lib/scoring";
import { Shield } from "lucide-react";

interface TeamStat {
  id: number;
  name: string;
  flag: string | null;
  played: number;
  won: number;
  drawn: number;
  lost: number;
  goalsFor: number;
  goalsAgainst: number;
  goalDiff: number;
  points: number;
}

interface GroupData {
  id: number;
  name: string;
  teams: TeamStat[];
  matchCount: number;
  finishedCount: number;
}

async function fetchGroupData(): Promise<GroupData[]> {
  const groups = await prisma.wcGroup.findMany({
    include: {
      teams: true,
      matches: true,
    },
    orderBy: { name: "asc" },
  });

  return groups.map((group) => {
    const finishedMatches = group.matches.filter(
      (m) => m.status === "FINISHED" && m.homeScore !== null && m.awayScore !== null
    );

    const teamStats: TeamStat[] = group.teams.map((team) => {
      let played = 0;
      let won = 0;
      let drawn = 0;
      let lost = 0;
      let goalsFor = 0;
      let goalsAgainst = 0;

      for (const match of finishedMatches) {
        const isHome = match.homeTeam === team.name;
        const isAway = match.awayTeam === team.name;
        if (!isHome && !isAway) continue;

        played++;
        const tendency = getTendency(match.homeScore!, match.awayScore!);

        if (isHome) {
          goalsFor += match.homeScore!;
          goalsAgainst += match.awayScore!;
          if (tendency === "H") won++;
          else if (tendency === "D") drawn++;
          else lost++;
        } else {
          goalsFor += match.awayScore!;
          goalsAgainst += match.homeScore!;
          if (tendency === "A") won++;
          else if (tendency === "D") drawn++;
          else lost++;
        }
      }

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
        goalDiff: goalsFor - goalsAgainst,
        points: won * 3 + drawn,
      };
    });

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
      matchCount: group.matches.length,
      finishedCount: finishedMatches.length,
    };
  });
}

function GroupTable({ group }: { group: GroupData }) {
  return (
    <div className="bg-slate-800 rounded-xl border border-slate-700 shadow-lg overflow-hidden">
      {/* Group header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-slate-700 bg-slate-700/30">
        <div className="flex items-center gap-3">
          <div className="bg-emerald-900/60 border border-emerald-700/50 rounded-lg w-10 h-10 flex items-center justify-center flex-shrink-0">
            <span className="text-emerald-400 font-black text-lg">{group.name}</span>
          </div>
          <div>
            <h2 className="font-bold text-white text-lg">Gruppe {group.name}</h2>
            <p className="text-slate-400 text-xs">
              {group.finishedCount}/{group.matchCount} Spiele
            </p>
          </div>
        </div>
        {/* Progress */}
        <div className="hidden sm:flex items-center gap-2">
          <div className="w-20 h-1.5 bg-slate-700 rounded-full overflow-hidden">
            <div
              className="h-full bg-emerald-500 rounded-full"
              style={{
                width: `${group.matchCount > 0 ? (group.finishedCount / group.matchCount) * 100 : 0}%`,
              }}
            />
          </div>
          <span className="text-xs text-slate-400">
            {group.matchCount > 0
              ? Math.round((group.finishedCount / group.matchCount) * 100)
              : 0}
            %
          </span>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-slate-700/40 text-slate-400 text-xs uppercase tracking-wide">
              <th className="px-4 py-2.5 text-left w-6">#</th>
              <th className="px-4 py-2.5 text-left">Team</th>
              <th className="px-3 py-2.5 text-center">Sp</th>
              <th className="px-3 py-2.5 text-center text-emerald-400">S</th>
              <th className="px-3 py-2.5 text-center text-amber-400">U</th>
              <th className="px-3 py-2.5 text-center text-red-400">N</th>
              <th className="px-3 py-2.5 text-center hidden sm:table-cell">Tore</th>
              <th className="px-3 py-2.5 text-center hidden sm:table-cell">Diff</th>
              <th className="px-4 py-2.5 text-right font-bold text-slate-200">Pkt</th>
            </tr>
          </thead>
          <tbody>
            {group.teams.map((team, idx) => {
              const isQualified = idx < 2;
              const isThird = idx === 2;
              const rowBg = isQualified
                ? "border-l-2 border-l-emerald-500"
                : isThird
                ? "border-l-2 border-l-amber-400"
                : "border-l-2 border-l-transparent";

              return (
                <tr
                  key={team.id}
                  className={`border-t border-slate-700/50 hover:bg-slate-700/30 transition-colors ${rowBg} ${
                    isQualified ? "bg-emerald-900/10" : isThird ? "bg-amber-900/10" : ""
                  }`}
                >
                  <td className="px-4 py-3 text-slate-400 font-bold text-xs">{idx + 1}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      {team.flag && <span className="text-lg leading-none">{team.flag}</span>}
                      <span
                        className={`font-semibold ${isQualified ? "text-white" : "text-slate-300"}`}
                      >
                        {team.name}
                      </span>
                      {isQualified && (
                        <span className="hidden lg:inline text-[10px] bg-emerald-900/60 text-emerald-400 border border-emerald-700/50 px-1.5 py-0.5 rounded-full font-semibold">
                          QF
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-3 py-3 text-center text-slate-300">{team.played}</td>
                  <td className="px-3 py-3 text-center text-emerald-400 font-semibold">
                    {team.won}
                  </td>
                  <td className="px-3 py-3 text-center text-amber-400 font-semibold">
                    {team.drawn}
                  </td>
                  <td className="px-3 py-3 text-center text-red-400 font-semibold">{team.lost}</td>
                  <td className="px-3 py-3 text-center text-slate-300 hidden sm:table-cell">
                    {team.goalsFor}:{team.goalsAgainst}
                  </td>
                  <td className="px-3 py-3 text-center hidden sm:table-cell">
                    <span
                      className={
                        team.goalDiff > 0
                          ? "text-emerald-400 font-semibold"
                          : team.goalDiff < 0
                          ? "text-red-400 font-semibold"
                          : "text-slate-400"
                      }
                    >
                      {team.goalDiff > 0 ? "+" : ""}
                      {team.goalDiff}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <span className="font-black text-lg text-white">{team.points}</span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Legend below table */}
      <div className="px-4 py-2 border-t border-slate-700/50 flex items-center gap-4 text-xs text-slate-500">
        <span className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" />
          Qualifiziert (1./2.)
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-amber-400 inline-block" />
          Evtl. qualifiziert (3.)
        </span>
      </div>
    </div>
  );
}

export default async function GruppenPage() {
  const groups = await fetchGroupData().catch(() => [] as GroupData[]);

  // Pair groups into rows of 2
  const pairs: GroupData[][] = [];
  for (let i = 0; i < groups.length; i += 2) {
    pairs.push(groups.slice(i, i + 2));
  }

  const totalTeams = groups.reduce((s, g) => s + g.teams.length, 0);
  const totalFinished = groups.reduce((s, g) => s + g.finishedCount, 0);
  const totalMatches = groups.reduce((s, g) => s + g.matchCount, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="bg-slate-700 rounded-xl p-2.5">
          <Shield className="w-6 h-6 text-blue-400" />
        </div>
        <div>
          <h1 className="text-2xl font-black text-white">Gruppenphase</h1>
          <p className="text-slate-400 text-sm">
            {groups.length} Gruppen · {totalTeams} Teams · {totalFinished}/{totalMatches} Spiele
            beendet
          </p>
        </div>
      </div>

      {/* Legend */}
      <div className="bg-slate-800 rounded-xl border border-slate-700 px-4 py-3 flex flex-wrap gap-4 text-xs text-slate-400">
        <span className="font-semibold text-slate-300">Spalten:</span>
        <span>Sp = Gespielt</span>
        <span>S = Siege</span>
        <span>U = Unentschieden</span>
        <span>N = Niederlagen</span>
        <span>Diff = Tordifferenz</span>
        <span>Pkt = Punkte</span>
      </div>

      {groups.length === 0 && (
        <div className="text-center py-20 text-slate-500">
          <Shield className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <div>Keine Gruppendaten vorhanden</div>
        </div>
      )}

      {/* Groups grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {groups.map((group) => (
          <GroupTable key={group.id} group={group} />
        ))}
      </div>

      {/* Overall stats */}
      {groups.length > 0 && (
        <div className="bg-slate-800 rounded-xl border border-slate-700 p-5">
          <h3 className="font-bold text-white mb-4 flex items-center gap-2">
            <Shield className="w-4 h-4 text-slate-400" />
            Übersicht Gruppenphase
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-3xl font-black text-white">{groups.length}</div>
              <div className="text-slate-400 text-xs mt-1">Gruppen</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-black text-white">{totalTeams}</div>
              <div className="text-slate-400 text-xs mt-1">Teams</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-black text-emerald-400">{totalFinished}</div>
              <div className="text-slate-400 text-xs mt-1">Gespielte Spiele</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-black text-amber-400">
                {totalMatches - totalFinished}
              </div>
              <div className="text-slate-400 text-xs mt-1">Ausstehende Spiele</div>
            </div>
          </div>
          {/* Progress */}
          <div className="mt-4">
            <div className="flex justify-between text-xs text-slate-400 mb-1">
              <span>Fortschritt Gruppenphase</span>
              <span>
                {totalMatches > 0 ? Math.round((totalFinished / totalMatches) * 100) : 0}%
              </span>
            </div>
            <div className="w-full h-2 bg-slate-700 rounded-full overflow-hidden">
              <div
                className="h-full bg-emerald-500 rounded-full transition-all"
                style={{
                  width: `${totalMatches > 0 ? (totalFinished / totalMatches) * 100 : 0}%`,
                }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
