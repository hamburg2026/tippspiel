"use client";

import { useEffect, useState } from "react";
import { Settings, Lock, Users, Trophy, Sliders, Check, X, AlertTriangle } from "lucide-react";

interface Player {
  id: number;
  name: string;
  team?: { id: number; name: string } | null;
  teamId?: number | null;
}

interface Team {
  id: number;
  name: string;
}

interface Match {
  id: number;
  homeTeam: string | null;
  awayTeam: string | null;
  homePlaceholder: string | null;
  awayPlaceholder: string | null;
  homeScore: number | null;
  awayScore: number | null;
  status: string;
  group?: { name: string } | null;
  stage: string;
}

interface ScoringConfig {
  exactScore: number;
  exactDiff: number;
  tendency: number;
}

type TabKey = "ergebnisse" | "spieler" | "wertung";

const ADMIN_PASSWORD_KEY = "tippspiel_admin_pw";

export default function AdminPage() {
  const [password, setPassword] = useState("");
  const [storedPw, setStoredPw] = useState("");
  const [authenticated, setAuthenticated] = useState(false);
  const [authError, setAuthError] = useState("");
  const [activeTab, setActiveTab] = useState<TabKey>("ergebnisse");

  // Ergebnisse state
  const [matches, setMatches] = useState<Match[]>([]);
  const [matchesLoading, setMatchesLoading] = useState(false);
  const [resultInputs, setResultInputs] = useState<Record<number, { home: string; away: string }>>({});
  const [resultSaving, setResultSaving] = useState<Record<number, boolean>>({});
  const [resultMsg, setResultMsg] = useState<Record<number, { ok: boolean; text: string }>>({});

  // Spieler state
  const [players, setPlayers] = useState<Player[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [newPlayerName, setNewPlayerName] = useState("");
  const [newPlayerTeamId, setNewPlayerTeamId] = useState<string>("");
  const [addingPlayer, setAddingPlayer] = useState(false);
  const [playerMsg, setPlayerMsg] = useState("");

  // Wertung state
  const [scoringConfig, setScoringConfig] = useState<ScoringConfig>({
    exactScore: 3,
    exactDiff: 2,
    tendency: 1,
  });
  const [scoringInputs, setScoringInputs] = useState({
    exactScore: "3",
    exactDiff: "2",
    tendency: "1",
  });
  const [scoringSaving, setScoringSaving] = useState(false);
  const [scoringMsg, setScoringMsg] = useState("");

  // Load stored pw from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem(ADMIN_PASSWORD_KEY) ?? "";
      setStoredPw(stored);
      if (stored) {
        setPassword(stored);
        setAuthenticated(true);
      }
    } catch {}
  }, []);

  function handleLogin() {
    if (!password.trim()) {
      setAuthError("Bitte ein Passwort eingeben");
      return;
    }
    // Store and set authenticated — real verification happens on first API call
    try {
      localStorage.setItem(ADMIN_PASSWORD_KEY, password);
    } catch {}
    setStoredPw(password);
    setAuthenticated(true);
    setAuthError("");
  }

  function handleLogout() {
    try {
      localStorage.removeItem(ADMIN_PASSWORD_KEY);
    } catch {}
    setAuthenticated(false);
    setPassword("");
    setStoredPw("");
    setAuthError("");
  }

  // Load data when authenticated
  useEffect(() => {
    if (!authenticated) return;
    loadMatches();
    loadPlayers();
    loadTeams();
    loadScoringConfig();
  }, [authenticated]);

  async function loadMatches() {
    setMatchesLoading(true);
    try {
      const data = await fetch("/api/matches").then((r) => r.json());
      if (Array.isArray(data)) {
        setMatches(data);
        // Initialize inputs for upcoming matches
        const inputs: Record<number, { home: string; away: string }> = {};
        for (const m of data) {
          if (m.status === "UPCOMING") {
            inputs[m.id] = { home: "", away: "" };
          } else {
            inputs[m.id] = { home: String(m.homeScore ?? ""), away: String(m.awayScore ?? "") };
          }
        }
        setResultInputs(inputs);
      }
    } catch {}
    setMatchesLoading(false);
  }

  async function loadPlayers() {
    try {
      const data = await fetch("/api/players").then((r) => r.json());
      if (Array.isArray(data)) setPlayers(data);
    } catch {}
  }

  async function loadTeams() {
    try {
      // Teams come from groups API or players — we'll extract from players
      const data = await fetch("/api/players").then((r) => r.json());
      if (Array.isArray(data)) {
        const teamMap = new Map<number, Team>();
        for (const p of data) {
          if (p.team) teamMap.set(p.team.id, p.team);
        }
        setTeams(Array.from(teamMap.values()).sort((a, b) => a.name.localeCompare(b.name)));
      }
    } catch {}
  }

  async function loadScoringConfig() {
    try {
      const data = await fetch("/api/config/scoring").then((r) => r.json());
      if (data && typeof data.exactScore === "number") {
        setScoringConfig(data);
        setScoringInputs({
          exactScore: String(data.exactScore),
          exactDiff: String(data.exactDiff),
          tendency: String(data.tendency),
        });
      }
    } catch {}
  }

  async function handleSetResult(matchId: number) {
    const input = resultInputs[matchId];
    if (!input) return;
    const home = parseInt(input.home);
    const away = parseInt(input.away);
    if (isNaN(home) || isNaN(away) || home < 0 || away < 0) {
      setResultMsg((prev) => ({ ...prev, [matchId]: { ok: false, text: "Ungültige Eingabe" } }));
      return;
    }

    setResultSaving((prev) => ({ ...prev, [matchId]: true }));
    try {
      const res = await fetch("/api/results", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ matchId, homeScore: home, awayScore: away, adminPassword: storedPw }),
      });
      if (res.ok) {
        setResultMsg((prev) => ({
          ...prev,
          [matchId]: { ok: true, text: `Ergebnis ${home}:${away} gespeichert` },
        }));
        await loadMatches();
      } else {
        const err = await res.json();
        if (res.status === 401) {
          setAuthError("Falsches Passwort – bitte neu anmelden");
          setAuthenticated(false);
        }
        setResultMsg((prev) => ({
          ...prev,
          [matchId]: { ok: false, text: err.error ?? "Fehler beim Speichern" },
        }));
      }
    } catch {
      setResultMsg((prev) => ({ ...prev, [matchId]: { ok: false, text: "Netzwerkfehler" } }));
    }
    setResultSaving((prev) => ({ ...prev, [matchId]: false }));
    setTimeout(() => {
      setResultMsg((prev) => {
        const next = { ...prev };
        delete next[matchId];
        return next;
      });
    }, 3000);
  }

  async function handleAddPlayer() {
    if (!newPlayerName.trim()) {
      setPlayerMsg("Bitte einen Namen eingeben");
      return;
    }
    setAddingPlayer(true);
    try {
      const res = await fetch("/api/players", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newPlayerName.trim(),
          teamId: newPlayerTeamId ? Number(newPlayerTeamId) : null,
        }),
      });
      if (res.ok) {
        setPlayerMsg(`Spieler "${newPlayerName}" hinzugefügt`);
        setNewPlayerName("");
        setNewPlayerTeamId("");
        await loadPlayers();
      } else {
        const err = await res.json();
        setPlayerMsg(err.error ?? "Fehler");
      }
    } catch {
      setPlayerMsg("Netzwerkfehler");
    }
    setAddingPlayer(false);
    setTimeout(() => setPlayerMsg(""), 3000);
  }

  async function handleSaveScoring() {
    setScoringSaving(true);
    setScoringMsg("");
    try {
      const res = await fetch("/api/config/scoring", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          exactScore: Number(scoringInputs.exactScore),
          exactDiff: Number(scoringInputs.exactDiff),
          tendency: Number(scoringInputs.tendency),
          adminPassword: storedPw,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setScoringMsg(`Gespeichert! ${data.tipsRecalculated} Tipps neu berechnet.`);
        await loadScoringConfig();
      } else {
        const err = await res.json();
        if (res.status === 401) {
          setAuthError("Falsches Passwort – bitte neu anmelden");
          setAuthenticated(false);
        }
        setScoringMsg(err.error ?? "Fehler beim Speichern");
      }
    } catch {
      setScoringMsg("Netzwerkfehler");
    }
    setScoringSaving(false);
    setTimeout(() => setScoringMsg(""), 4000);
  }

  const upcomingMatches = matches.filter((m) => m.status === "UPCOMING");
  const finishedMatches = matches.filter((m) => m.status === "FINISHED");

  const tabs: { key: TabKey; label: string; icon: React.ReactNode }[] = [
    { key: "ergebnisse", label: "Ergebnisse", icon: <Trophy className="w-4 h-4" /> },
    { key: "spieler", label: "Spieler", icon: <Users className="w-4 h-4" /> },
    { key: "wertung", label: "Wertung", icon: <Sliders className="w-4 h-4" /> },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="bg-slate-700 rounded-xl p-2.5">
          <Settings className="w-6 h-6 text-slate-300" />
        </div>
        <div>
          <h1 className="text-2xl font-black text-white">Admin</h1>
          <p className="text-slate-400 text-sm">Verwaltung des Tippspiels</p>
        </div>
      </div>

      {/* Login */}
      {!authenticated ? (
        <div className="max-w-sm mx-auto mt-16">
          <div className="bg-slate-800 rounded-2xl border border-slate-700 shadow-2xl p-8 space-y-5">
            <div className="text-center">
              <div className="bg-slate-700 rounded-full w-14 h-14 flex items-center justify-center mx-auto mb-4">
                <Lock className="w-7 h-7 text-slate-300" />
              </div>
              <h2 className="text-xl font-bold text-white">Admin-Bereich</h2>
              <p className="text-slate-400 text-sm mt-1">Bitte Passwort eingeben</p>
            </div>
            {authError && (
              <div className="flex items-center gap-2 text-red-400 text-sm bg-red-900/20 border border-red-900/40 rounded-lg px-3 py-2">
                <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                {authError}
              </div>
            )}
            <div className="space-y-3">
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleLogin()}
                placeholder="Admin-Passwort"
                className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 text-sm"
              />
              <button
                onClick={handleLogin}
                className="w-full bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg px-4 py-3 font-semibold text-sm transition-colors"
              >
                Anmelden
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-5">
          {/* Auth bar */}
          <div className="flex items-center justify-between bg-slate-800 rounded-xl border border-slate-700 px-4 py-3">
            <div className="flex items-center gap-2 text-emerald-400 text-sm">
              <Check className="w-4 h-4" />
              Angemeldet als Administrator
            </div>
            <button
              onClick={handleLogout}
              className="text-slate-400 hover:text-slate-200 text-xs flex items-center gap-1 transition-colors"
            >
              <X className="w-3 h-3" />
              Abmelden
            </button>
          </div>

          {/* Tabs */}
          <div className="flex gap-2 border-b border-slate-700 pb-0">
            {tabs.map(({ key, label, icon }) => (
              <button
                key={key}
                onClick={() => setActiveTab(key)}
                className={`flex items-center gap-2 px-4 py-3 text-sm font-semibold border-b-2 transition-colors -mb-px ${
                  activeTab === key
                    ? "border-emerald-500 text-emerald-400"
                    : "border-transparent text-slate-400 hover:text-slate-200"
                }`}
              >
                {icon}
                {label}
              </button>
            ))}
          </div>

          {/* Tab: Ergebnisse */}
          {activeTab === "ergebnisse" && (
            <div className="space-y-5">
              <div className="flex items-center gap-2 text-slate-300 text-sm">
                <span className="text-amber-400 font-bold">{upcomingMatches.length}</span> anstehende Spiele
                <span className="text-slate-600">·</span>
                <span className="text-emerald-400 font-bold">{finishedMatches.length}</span> beendet
              </div>

              {matchesLoading ? (
                <div className="text-center py-8 text-slate-400">Laden...</div>
              ) : upcomingMatches.length === 0 ? (
                <div className="text-center py-12 text-slate-500 bg-slate-800 rounded-xl border border-slate-700">
                  Keine anstehenden Spiele
                </div>
              ) : (
                <div className="space-y-3">
                  <h3 className="text-slate-300 font-semibold text-sm uppercase tracking-wide">
                    Anstehende Spiele — Ergebnis eingeben
                  </h3>
                  {upcomingMatches.map((match) => {
                    const input = resultInputs[match.id] ?? { home: "", away: "" };
                    const saving = resultSaving[match.id] ?? false;
                    const msg = resultMsg[match.id];
                    const homeLabel = match.homeTeam ?? match.homePlaceholder ?? "?";
                    const awayLabel = match.awayTeam ?? match.awayPlaceholder ?? "?";

                    return (
                      <div
                        key={match.id}
                        className="bg-slate-800 rounded-xl border border-slate-700 p-4"
                      >
                        <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                          <div className="flex-1">
                            <div className="text-white font-semibold">
                              {homeLabel} vs {awayLabel}
                            </div>
                            <div className="flex items-center gap-2 mt-0.5">
                              {match.group && (
                                <span className="text-emerald-400 text-xs">
                                  Gruppe {match.group.name}
                                </span>
                              )}
                              <span className="text-slate-500 text-xs">
                                {match.stage === "GROUP" ? "Gruppenphase" : match.stage}
                              </span>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <input
                              type="number"
                              min={0}
                              max={20}
                              value={input.home}
                              onChange={(e) =>
                                setResultInputs((prev) => ({
                                  ...prev,
                                  [match.id]: { ...prev[match.id], home: e.target.value },
                                }))
                              }
                              className="bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white w-16 text-center text-sm focus:outline-none focus:border-emerald-500"
                              placeholder="0"
                            />
                            <span className="text-slate-400 font-bold">:</span>
                            <input
                              type="number"
                              min={0}
                              max={20}
                              value={input.away}
                              onChange={(e) =>
                                setResultInputs((prev) => ({
                                  ...prev,
                                  [match.id]: { ...prev[match.id], away: e.target.value },
                                }))
                              }
                              className="bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white w-16 text-center text-sm focus:outline-none focus:border-emerald-500"
                              placeholder="0"
                            />
                            <button
                              onClick={() => handleSetResult(match.id)}
                              disabled={saving || !input.home || !input.away}
                              className="bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg px-4 py-2 text-sm font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              {saving ? "..." : "Speichern"}
                            </button>
                          </div>
                        </div>
                        {msg && (
                          <div
                            className={`mt-2 flex items-center gap-2 text-xs px-3 py-1.5 rounded-lg ${
                              msg.ok
                                ? "bg-emerald-900/30 text-emerald-400 border border-emerald-900/50"
                                : "bg-red-900/30 text-red-400 border border-red-900/50"
                            }`}
                          >
                            {msg.ok ? <Check className="w-3 h-3" /> : <X className="w-3 h-3" />}
                            {msg.text}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Finished matches */}
              {finishedMatches.length > 0 && (
                <div className="space-y-3">
                  <h3 className="text-slate-500 font-semibold text-sm uppercase tracking-wide">
                    Beendete Spiele
                  </h3>
                  <div className="space-y-2">
                    {finishedMatches.map((match) => (
                      <div
                        key={match.id}
                        className="bg-slate-800/60 rounded-xl border border-slate-700/50 px-4 py-3 flex items-center justify-between opacity-70"
                      >
                        <div className="text-slate-300 text-sm">
                          {match.homeTeam ?? match.homePlaceholder ?? "?"} vs{" "}
                          {match.awayTeam ?? match.awayPlaceholder ?? "?"}
                          {match.group && (
                            <span className="ml-2 text-emerald-400 text-xs">
                              Gr. {match.group.name}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-white font-black">
                            {match.homeScore}:{match.awayScore}
                          </span>
                          <span className="text-xs bg-slate-600 text-slate-300 px-2 py-0.5 rounded-full">
                            Beendet
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Tab: Spieler */}
          {activeTab === "spieler" && (
            <div className="space-y-5">
              {/* Add player */}
              <div className="bg-slate-800 rounded-xl border border-slate-700 p-5">
                <h3 className="font-bold text-white mb-4 flex items-center gap-2">
                  <Users className="w-4 h-4 text-blue-400" />
                  Neuen Spieler hinzufügen
                </h3>
                <div className="flex flex-col sm:flex-row gap-3">
                  <input
                    type="text"
                    value={newPlayerName}
                    onChange={(e) => setNewPlayerName(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleAddPlayer()}
                    placeholder="Spielername"
                    className="flex-1 bg-slate-700 border border-slate-600 rounded-lg px-4 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 text-sm"
                  />
                  <select
                    value={newPlayerTeamId}
                    onChange={(e) => setNewPlayerTeamId(e.target.value)}
                    className="bg-slate-700 border border-slate-600 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-emerald-500 text-sm"
                  >
                    <option value="">Kein Team</option>
                    {teams.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.name}
                      </option>
                    ))}
                  </select>
                  <button
                    onClick={handleAddPlayer}
                    disabled={addingPlayer || !newPlayerName.trim()}
                    className="bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg px-5 py-2.5 font-semibold text-sm transition-colors disabled:opacity-50"
                  >
                    {addingPlayer ? "Laden..." : "Hinzufügen"}
                  </button>
                </div>
                {playerMsg && (
                  <div className="mt-3 text-sm text-emerald-400 flex items-center gap-2">
                    <Check className="w-4 h-4" />
                    {playerMsg}
                  </div>
                )}
              </div>

              {/* Player list */}
              <div className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden">
                <div className="px-5 py-4 border-b border-slate-700">
                  <h3 className="font-bold text-white">
                    Spieler ({players.length})
                  </h3>
                </div>
                {players.length === 0 ? (
                  <div className="text-center py-8 text-slate-500 text-sm">
                    Keine Spieler vorhanden
                  </div>
                ) : (
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-slate-700/40 text-slate-400 text-xs uppercase tracking-wide">
                        <th className="px-4 py-3 text-left">ID</th>
                        <th className="px-4 py-3 text-left">Name</th>
                        <th className="px-4 py-3 text-left">Team</th>
                      </tr>
                    </thead>
                    <tbody>
                      {players.map((p) => (
                        <tr
                          key={p.id}
                          className="border-t border-slate-700/50 even:bg-slate-800/50 hover:bg-slate-700/30"
                        >
                          <td className="px-4 py-3 text-slate-500 font-mono">{p.id}</td>
                          <td className="px-4 py-3 font-semibold text-white">{p.name}</td>
                          <td className="px-4 py-3 text-slate-400">
                            {p.team?.name ?? "–"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          )}

          {/* Tab: Wertung */}
          {activeTab === "wertung" && (
            <div className="space-y-5">
              <div className="bg-slate-800 rounded-xl border border-slate-700 p-6">
                <h3 className="font-bold text-white mb-2 flex items-center gap-2">
                  <Sliders className="w-5 h-5 text-purple-400" />
                  Punktekonfiguration
                </h3>
                <p className="text-slate-400 text-sm mb-6">
                  Lege fest, wie viele Punkte für verschiedene Tipp-Qualitäten vergeben werden.
                  Änderungen werden sofort auf alle bisherigen Tipps angewendet.
                </p>

                <div className="space-y-5">
                  {/* Exact score */}
                  <div className="flex items-start gap-4 p-4 bg-slate-700/30 rounded-xl border border-emerald-900/30">
                    <div className="flex-1">
                      <div className="font-semibold text-white mb-0.5">Exaktes Ergebnis</div>
                      <div className="text-slate-400 text-xs">
                        Korrektes Ergebnis und korrekte Tendenz (z.B. 2:1 getippt, 2:1 erzielt)
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        min={0}
                        max={10}
                        value={scoringInputs.exactScore}
                        onChange={(e) =>
                          setScoringInputs((p) => ({ ...p, exactScore: e.target.value }))
                        }
                        className="bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white w-20 text-center focus:outline-none focus:border-emerald-500"
                      />
                      <span className="text-emerald-400 text-sm font-semibold">Punkte</span>
                    </div>
                  </div>

                  {/* Exact diff */}
                  <div className="flex items-start gap-4 p-4 bg-slate-700/30 rounded-xl border border-amber-900/30">
                    <div className="flex-1">
                      <div className="font-semibold text-white mb-0.5">Richtige Differenz</div>
                      <div className="text-slate-400 text-xs">
                        Korrekte Tordifferenz und Tendenz, aber nicht exaktes Ergebnis (z.B. 2:0
                        getippt, 3:1 erzielt)
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        min={0}
                        max={10}
                        value={scoringInputs.exactDiff}
                        onChange={(e) =>
                          setScoringInputs((p) => ({ ...p, exactDiff: e.target.value }))
                        }
                        className="bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white w-20 text-center focus:outline-none focus:border-amber-500"
                      />
                      <span className="text-amber-400 text-sm font-semibold">Punkte</span>
                    </div>
                  </div>

                  {/* Tendency */}
                  <div className="flex items-start gap-4 p-4 bg-slate-700/30 rounded-xl border border-orange-900/30">
                    <div className="flex-1">
                      <div className="font-semibold text-white mb-0.5">Richtige Tendenz</div>
                      <div className="text-slate-400 text-xs">
                        Nur die Tendenz (Heimsieg/Unentschieden/Auswärtssieg) ist korrekt (z.B.
                        1:0 getippt, 3:2 erzielt)
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        min={0}
                        max={10}
                        value={scoringInputs.tendency}
                        onChange={(e) =>
                          setScoringInputs((p) => ({ ...p, tendency: e.target.value }))
                        }
                        className="bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white w-20 text-center focus:outline-none focus:border-orange-500"
                      />
                      <span className="text-orange-400 text-sm font-semibold">Punkte</span>
                    </div>
                  </div>
                </div>

                {/* Current config display */}
                <div className="mt-5 p-3 bg-slate-700/20 rounded-lg border border-slate-700/50 text-xs text-slate-400 flex gap-4">
                  <span>Aktuell:</span>
                  <span className="text-emerald-400">Exakt: {scoringConfig.exactScore} Pts</span>
                  <span className="text-amber-400">Differenz: {scoringConfig.exactDiff} Pts</span>
                  <span className="text-orange-400">Tendenz: {scoringConfig.tendency} Pt</span>
                </div>

                {scoringMsg && (
                  <div
                    className={`mt-3 text-sm flex items-center gap-2 px-3 py-2 rounded-lg ${
                      scoringMsg.startsWith("Fehler") || scoringMsg.startsWith("Netzwerk")
                        ? "bg-red-900/20 text-red-400 border border-red-900/40"
                        : "bg-emerald-900/20 text-emerald-400 border border-emerald-900/40"
                    }`}
                  >
                    <Check className="w-4 h-4" />
                    {scoringMsg}
                  </div>
                )}

                <div className="mt-5 flex justify-end">
                  <button
                    onClick={handleSaveScoring}
                    disabled={scoringSaving}
                    className="bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg px-6 py-2.5 font-semibold text-sm transition-colors disabled:opacity-50"
                  >
                    {scoringSaving ? "Speichere..." : "Konfiguration speichern"}
                  </button>
                </div>
              </div>

              {/* Info box */}
              <div className="bg-amber-900/20 border border-amber-700/40 rounded-xl p-4 flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-amber-200">
                  <div className="font-semibold mb-1">Hinweis</div>
                  <div className="text-amber-300/80">
                    Änderungen an der Wertung werden sofort auf alle bisherigen Tipps angewendet
                    und die Rangliste wird aktualisiert. Stelle sicher, dass alle Spieler über
                    Änderungen informiert sind.
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
