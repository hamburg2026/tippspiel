"use client";

import { useEffect, useState } from "react";
import { Calendar, ChevronDown, ChevronUp, User } from "lucide-react";
import MatchCard from "@/components/MatchCard";

interface Player {
  id: number;
  name: string;
  team?: { name: string } | null;
}

interface Group {
  id: number;
  name: string;
}

interface Tip {
  homeScore: number;
  awayScore: number;
  points?: number | null;
}

interface Match {
  id: number;
  stage: string;
  homeTeam: string | null;
  awayTeam: string | null;
  homePlaceholder: string | null;
  awayPlaceholder: string | null;
  homeScore: number | null;
  awayScore: number | null;
  status: string;
  group?: Group | null;
  matchDate?: string | null;
  venue?: string | null;
  tips?: Tip[];
}

interface GroupWithMatches {
  name: string;
  matches: Match[];
}

export default function SpielplanPage() {
  const [players, setPlayers] = useState<Player[]>([]);
  const [selectedPlayerId, setSelectedPlayerId] = useState<number | null>(null);
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);
  const [openGroups, setOpenGroups] = useState<Set<string>>(new Set(["A", "B", "C"]));

  useEffect(() => {
    fetch("/api/players")
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) setPlayers(data);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    setLoading(true);
    const url = selectedPlayerId
      ? `/api/matches?stage=GROUP&playerId=${selectedPlayerId}`
      : "/api/matches?stage=GROUP";
    fetch(url)
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) setMatches(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [selectedPlayerId]);

  async function handleTipSave(matchId: number, home: number, away: number) {
    if (!selectedPlayerId) return;
    await fetch("/api/tips", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        playerId: selectedPlayerId,
        matchId,
        homeScore: home,
        awayScore: away,
      }),
    });
    // Refresh matches to get updated tip
    const url = `/api/matches?stage=GROUP&playerId=${selectedPlayerId}`;
    const updated = await fetch(url).then((r) => r.json());
    if (Array.isArray(updated)) setMatches(updated);
  }

  function toggleGroup(name: string) {
    setOpenGroups((prev) => {
      const next = new Set(prev);
      if (next.has(name)) next.delete(name);
      else next.add(name);
      return next;
    });
  }

  // Group matches by group name
  const grouped: GroupWithMatches[] = [];
  const groupMap = new Map<string, Match[]>();

  for (const match of matches) {
    const key = match.group?.name ?? "Sonstige";
    if (!groupMap.has(key)) groupMap.set(key, []);
    groupMap.get(key)!.push(match);
  }

  // Sort groups alphabetically
  const sortedKeys = Array.from(groupMap.keys()).sort();
  for (const key of sortedKeys) {
    grouped.push({ name: key, matches: groupMap.get(key)! });
  }

  const selectedPlayer = players.find((p) => p.id === selectedPlayerId);
  const finishedCount = matches.filter((m) => m.status === "FINISHED").length;
  const upcomingCount = matches.filter((m) => m.status === "UPCOMING").length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="bg-slate-700 rounded-xl p-2.5">
          <Calendar className="w-6 h-6 text-emerald-400" />
        </div>
        <div>
          <h1 className="text-2xl font-black text-white">Spielplan</h1>
          <p className="text-slate-400 text-sm">
            {finishedCount} beendet · {upcomingCount} anstehend
          </p>
        </div>
      </div>

      {/* Player selector */}
      <div className="bg-slate-800 rounded-xl border border-slate-700 p-4">
        <div className="flex flex-col sm:flex-row sm:items-center gap-3">
          <div className="flex items-center gap-2 text-slate-300 text-sm font-medium flex-shrink-0">
            <User className="w-4 h-4" />
            Spieler wählen:
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setSelectedPlayerId(null)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                selectedPlayerId === null
                  ? "bg-emerald-600 text-white"
                  : "bg-slate-700 text-slate-300 hover:bg-slate-600"
              }`}
            >
              Kein Spieler
            </button>
            {players.map((p) => (
              <button
                key={p.id}
                onClick={() => setSelectedPlayerId(p.id)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  selectedPlayerId === p.id
                    ? "bg-emerald-600 text-white"
                    : "bg-slate-700 text-slate-300 hover:bg-slate-600"
                }`}
              >
                {p.name}
              </button>
            ))}
          </div>
        </div>
        {selectedPlayer && (
          <div className="mt-3 pt-3 border-t border-slate-700 text-xs text-slate-400">
            Ausgewählt:{" "}
            <span className="text-emerald-400 font-semibold">{selectedPlayer.name}</span>
            {selectedPlayer.team && (
              <span> · Team: {selectedPlayer.team.name}</span>
            )}
            {selectedPlayerId && (
              <span className="ml-2">
                · Tipps für anstehende Spiele können direkt eingegeben werden
              </span>
            )}
          </div>
        )}
      </div>

      {/* Loading */}
      {loading && (
        <div className="text-center py-12 text-slate-400">
          <div className="text-lg">Laden...</div>
        </div>
      )}

      {/* Groups */}
      {!loading && grouped.length === 0 && (
        <div className="text-center py-12 text-slate-500">Keine Spiele gefunden</div>
      )}

      {!loading &&
        grouped.map(({ name, matches: groupMatches }) => {
          const isOpen = openGroups.has(name);
          const doneInGroup = groupMatches.filter((m) => m.status === "FINISHED").length;
          const totalInGroup = groupMatches.length;

          return (
            <div
              key={name}
              className="bg-slate-800 rounded-xl border border-slate-700 shadow-lg overflow-hidden"
            >
              {/* Group header */}
              <button
                onClick={() => toggleGroup(name)}
                className="w-full flex items-center justify-between px-5 py-4 hover:bg-slate-700/50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="bg-emerald-900/60 border border-emerald-700/50 rounded-lg w-10 h-10 flex items-center justify-center">
                    <span className="text-emerald-400 font-black text-lg">{name}</span>
                  </div>
                  <div className="text-left">
                    <h2 className="font-bold text-white text-lg">Gruppe {name}</h2>
                    <p className="text-slate-400 text-xs">
                      {doneInGroup}/{totalInGroup} Spiele beendet
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  {/* Progress bar */}
                  <div className="hidden sm:flex items-center gap-2">
                    <div className="w-24 h-1.5 bg-slate-700 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-emerald-500 rounded-full transition-all"
                        style={{
                          width: `${totalInGroup > 0 ? (doneInGroup / totalInGroup) * 100 : 0}%`,
                        }}
                      />
                    </div>
                    <span className="text-xs text-slate-400">
                      {totalInGroup > 0 ? Math.round((doneInGroup / totalInGroup) * 100) : 0}%
                    </span>
                  </div>
                  {isOpen ? (
                    <ChevronUp className="w-5 h-5 text-slate-400" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-slate-400" />
                  )}
                </div>
              </button>

              {/* Matches */}
              {isOpen && (
                <div className="px-4 pb-4 space-y-3 border-t border-slate-700">
                  <div className="pt-3 grid grid-cols-1 gap-3">
                    {groupMatches.map((match) => {
                      const tip = match.tips?.[0] ?? null;
                      return (
                        <MatchCard
                          key={match.id}
                          match={match}
                          tip={tip}
                          showTipForm={!!selectedPlayerId}
                          onTipSave={handleTipSave}
                        />
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          );
        })}
    </div>
  );
}
