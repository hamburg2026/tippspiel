"use client";

import { useState } from "react";
import { MapPin, Clock } from "lucide-react";
import PointsBadge from "./PointsBadge";

interface MatchCardProps {
  match: {
    id: number;
    stage: string;
    homeTeam: string | null;
    awayTeam: string | null;
    homePlaceholder: string | null;
    awayPlaceholder: string | null;
    homeScore: number | null;
    awayScore: number | null;
    status: string;
    group?: { name: string } | null;
    matchDate?: string | null;
    venue?: string | null;
  };
  tip?: { homeScore: number; awayScore: number; points?: number | null } | null;
  showTipForm?: boolean;
  onTipSave?: (matchId: number, home: number, away: number) => void;
}

const STAGE_LABELS: Record<string, string> = {
  GROUP: "Gruppenphase",
  R32: "Runde der 32",
  R16: "Achtelfinale",
  QF: "Viertelfinale",
  SF: "Halbfinale",
  THIRD: "Spiel um Platz 3",
  FINAL: "Finale",
};

export default function MatchCard({ match, tip, showTipForm, onTipSave }: MatchCardProps) {
  const [homeInput, setHomeInput] = useState<string>(tip?.homeScore?.toString() ?? "");
  const [awayInput, setAwayInput] = useState<string>(tip?.awayScore?.toString() ?? "");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const homeLabel = match.homeTeam ?? match.homePlaceholder ?? "?";
  const awayLabel = match.awayTeam ?? match.awayPlaceholder ?? "?";
  const isFinished = match.status === "FINISHED";
  const isUpcoming = match.status === "UPCOMING";

  async function handleSave() {
    if (!onTipSave) return;
    const h = parseInt(homeInput);
    const a = parseInt(awayInput);
    if (isNaN(h) || isNaN(a) || h < 0 || a < 0) return;
    setSaving(true);
    await onTipSave(match.id, h, a);
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  const stageLabel = STAGE_LABELS[match.stage] ?? match.stage;

  return (
    <div className="bg-slate-800 rounded-xl border border-slate-700 shadow-lg overflow-hidden hover:border-slate-600 transition-colors">
      {/* Stage / Group header */}
      <div className="flex items-center justify-between px-4 py-2 bg-slate-700/50 border-b border-slate-700">
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-slate-400">{stageLabel}</span>
          {match.group && (
            <span className="text-xs bg-emerald-900/60 text-emerald-400 border border-emerald-700/50 px-2 py-0.5 rounded-full font-semibold">
              Gruppe {match.group.name}
            </span>
          )}
        </div>
        <div className="flex items-center gap-3 text-xs text-slate-500">
          {match.matchDate && (
            <span className="flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {new Date(match.matchDate).toLocaleDateString("de-DE", {
                day: "2-digit",
                month: "2-digit",
                hour: "2-digit",
                minute: "2-digit",
              })}
            </span>
          )}
          {match.venue && (
            <span className="flex items-center gap-1 hidden sm:flex">
              <MapPin className="w-3 h-3" />
              {match.venue}
            </span>
          )}
        </div>
      </div>

      {/* Match body */}
      <div className="p-4">
        <div className="flex items-center justify-between gap-2">
          {/* Home team */}
          <div className="flex-1 text-center">
            <span className="font-bold text-white text-base sm:text-lg leading-tight block">
              {homeLabel}
            </span>
          </div>

          {/* Score / VS */}
          <div className="flex flex-col items-center gap-1 mx-2">
            {isFinished && match.homeScore !== null && match.awayScore !== null ? (
              <div className="flex items-center gap-2">
                <span className="text-2xl sm:text-3xl font-black text-white tabular-nums">
                  {match.homeScore}
                </span>
                <span className="text-slate-500 font-bold text-xl">:</span>
                <span className="text-2xl sm:text-3xl font-black text-white tabular-nums">
                  {match.awayScore}
                </span>
              </div>
            ) : (
              <span className="text-slate-400 font-bold text-lg px-3">vs</span>
            )}
            <span
              className={`text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                isFinished
                  ? "bg-slate-600 text-slate-300"
                  : "bg-emerald-900/50 text-emerald-400"
              }`}
            >
              {isFinished ? "Beendet" : "Anstehend"}
            </span>
          </div>

          {/* Away team */}
          <div className="flex-1 text-center">
            <span className="font-bold text-white text-base sm:text-lg leading-tight block">
              {awayLabel}
            </span>
          </div>
        </div>

        {/* Tip section */}
        {(tip || (showTipForm && isUpcoming)) && (
          <div className="mt-3 pt-3 border-t border-slate-700">
            {tip && isFinished && (
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm text-slate-400">
                  <span>Dein Tipp:</span>
                  <span className="font-bold text-slate-200">
                    {tip.homeScore} : {tip.awayScore}
                  </span>
                </div>
                <PointsBadge points={tip.points ?? null} />
              </div>
            )}

            {tip && isUpcoming && !showTipForm && (
              <div className="flex items-center gap-2 text-sm text-slate-400">
                <span>Dein Tipp:</span>
                <span className="font-bold text-slate-200">
                  {tip.homeScore} : {tip.awayScore}
                </span>
              </div>
            )}

            {showTipForm && isUpcoming && (
              <div className="flex items-center gap-3">
                <span className="text-sm text-slate-400">Tipp:</span>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min={0}
                    max={20}
                    value={homeInput}
                    onChange={(e) => setHomeInput(e.target.value)}
                    className="bg-slate-700 border border-slate-600 rounded-lg px-3 py-1.5 text-white w-16 text-center text-sm focus:outline-none focus:border-emerald-500"
                    placeholder="0"
                  />
                  <span className="text-slate-400 font-bold">:</span>
                  <input
                    type="number"
                    min={0}
                    max={20}
                    value={awayInput}
                    onChange={(e) => setAwayInput(e.target.value)}
                    className="bg-slate-700 border border-slate-600 rounded-lg px-3 py-1.5 text-white w-16 text-center text-sm focus:outline-none focus:border-emerald-500"
                    placeholder="0"
                  />
                </div>
                <button
                  onClick={handleSave}
                  disabled={saving || homeInput === "" || awayInput === ""}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                    saved
                      ? "bg-emerald-700 text-white"
                      : "bg-emerald-600 hover:bg-emerald-500 text-white disabled:opacity-50 disabled:cursor-not-allowed"
                  }`}
                >
                  {saving ? "..." : saved ? "Gespeichert ✓" : "Speichern"}
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
