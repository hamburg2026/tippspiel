"use client";

import { useEffect, useState } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
} from "recharts";
import { BarChart2, TrendingUp, Target, Award } from "lucide-react";

interface TimelineEntry {
  playerId: number;
  playerName: string;
  team: string | null;
  points: { matchId: number; cumulative: number; pts: number }[];
}

interface Distribution {
  exact: number;
  diff: number;
  tendency: number;
  wrong: number;
}

interface PlayerStat {
  id: number;
  name: string;
  team: string | null;
  exact: number;
  diff: number;
  tendency: number;
  wrong: number;
  total: number;
  hitRate: number;
  maxStreak: number;
}

interface StatsData {
  timelines: TimelineEntry[];
  distribution: Distribution;
  playerStats: PlayerStat[];
  finishedMatchCount: number;
}

// 12 distinct colors for players
const PLAYER_COLORS = [
  "#10b981", // emerald
  "#3b82f6", // blue
  "#f59e0b", // amber
  "#ef4444", // red
  "#8b5cf6", // violet
  "#ec4899", // pink
  "#14b8a6", // teal
  "#f97316", // orange
  "#6366f1", // indigo
  "#84cc16", // lime
  "#06b6d4", // cyan
  "#a855f7", // purple
];

const PIE_COLORS = ["#10b981", "#f59e0b", "#f97316", "#ef4444"];

const CustomTooltipLine = ({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: Array<{ name: string; value: number; color: string }>;
  label?: string;
}) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-slate-800 border border-slate-600 rounded-lg p-3 shadow-xl text-xs">
        <div className="text-slate-400 mb-2">Spiel #{label}</div>
        {payload
          .sort((a, b) => b.value - a.value)
          .map((entry) => (
            <div key={entry.name} className="flex items-center gap-2 mb-1">
              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }} />
              <span className="text-slate-300">{entry.name}:</span>
              <span className="text-white font-bold">{entry.value} Pts</span>
            </div>
          ))}
      </div>
    );
  }
  return null;
};

const CustomTooltipBar = ({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: Array<{ value: number }>;
  label?: string;
}) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-slate-800 border border-slate-600 rounded-lg p-3 shadow-xl text-xs">
        <div className="text-white font-bold">{label}</div>
        <div className="text-slate-300">{payload[0]?.value} Tipps</div>
      </div>
    );
  }
  return null;
};

export default function StatistikPage() {
  const [data, setData] = useState<StatsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/stats")
      .then((r) => {
        if (!r.ok) throw new Error("Fehler beim Laden");
        return r.json();
      })
      .then((d) => {
        setData(d);
        setLoading(false);
      })
      .catch((e) => {
        setError(e.message);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-slate-400 text-lg">Statistiken werden geladen...</div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-red-400">{error || "Fehler beim Laden"}</div>
      </div>
    );
  }

  // Build timeline chart data
  // Get all unique matchIds across all players
  const allMatchIds = Array.from(
    new Set(data.timelines.flatMap((t) => t.points.map((p) => p.matchId)))
  ).sort((a, b) => a - b);

  const timelineChartData = allMatchIds.map((matchId, idx) => {
    const row: Record<string, number | string> = { match: idx + 1 };
    for (const player of data.timelines) {
      const entry = player.points.find((p) => p.matchId === matchId);
      if (entry) {
        row[player.playerName] = entry.cumulative;
      } else {
        // Carry forward last known value
        const lastKnown = player.points.filter((p) => p.matchId <= matchId).slice(-1)[0];
        row[player.playerName] = lastKnown?.cumulative ?? 0;
      }
    }
    return row;
  });

  // Bar chart: tip type distribution per player
  const playerBarData = data.playerStats.map((p) => ({
    name: p.name.length > 10 ? p.name.slice(0, 10) + "…" : p.name,
    fullName: p.name,
    Exakt: p.exact,
    Differenz: p.diff,
    Tendenz: p.tendency,
    Falsch: p.wrong,
  }));

  // Pie chart data
  const pieData = [
    { name: "Exakt", value: data.distribution.exact },
    { name: "Differenz", value: data.distribution.diff },
    { name: "Tendenz", value: data.distribution.tendency },
    { name: "Falsch", value: data.distribution.wrong },
  ].filter((d) => d.value > 0);

  const totalTips =
    data.distribution.exact +
    data.distribution.diff +
    data.distribution.tendency +
    data.distribution.wrong;

  const hitRate =
    totalTips > 0
      ? Math.round(
          ((data.distribution.exact + data.distribution.diff + data.distribution.tendency) /
            totalTips) *
            100
        )
      : 0;

  // Sort player stats by hitRate desc
  const sortedStats = [...data.playerStats].sort((a, b) => b.hitRate - a.hitRate);

  // Best streaker
  const bestStreaker = [...data.playerStats].sort((a, b) => b.maxStreak - a.maxStreak)[0];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="bg-slate-700 rounded-xl p-2.5">
          <BarChart2 className="w-6 h-6 text-purple-400" />
        </div>
        <div>
          <h1 className="text-2xl font-black text-white">Statistiken</h1>
          <p className="text-slate-400 text-sm">
            {data.finishedMatchCount} abgeschlossene Spiele · {totalTips} Tipps insgesamt ·{" "}
            {hitRate}% Trefferquote
          </p>
        </div>
      </div>

      {/* Quick stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          {
            label: "Spiele gespielt",
            value: data.finishedMatchCount,
            color: "text-blue-400",
            bg: "bg-blue-900/30",
            icon: BarChart2,
          },
          {
            label: "Gesamt Tipps",
            value: totalTips,
            color: "text-slate-300",
            bg: "bg-slate-700/30",
            icon: Target,
          },
          {
            label: "Trefferquote",
            value: `${hitRate}%`,
            color: "text-emerald-400",
            bg: "bg-emerald-900/30",
            icon: TrendingUp,
          },
          {
            label: "Beste Serie",
            value: bestStreaker ? `${bestStreaker.maxStreak}` : "–",
            color: "text-amber-400",
            bg: "bg-amber-900/30",
            icon: Award,
            sub: bestStreaker?.name,
          },
        ].map(({ label, value, color, bg, icon: Icon, sub }) => (
          <div
            key={label}
            className="bg-slate-800 rounded-xl p-4 border border-slate-700 flex items-center gap-3"
          >
            <div className={`${bg} rounded-lg p-2.5 flex-shrink-0`}>
              <Icon className={`w-5 h-5 ${color}`} />
            </div>
            <div className="min-w-0">
              <div className={`font-black text-xl ${color}`}>{value}</div>
              <div className="text-slate-400 text-xs">{label}</div>
              {sub && <div className="text-slate-500 text-xs truncate">{sub}</div>}
            </div>
          </div>
        ))}
      </div>

      {/* Timeline chart */}
      {timelineChartData.length > 0 && data.timelines.length > 0 ? (
        <div className="bg-slate-800 rounded-xl border border-slate-700 shadow-lg overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-700 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-emerald-400" />
            <h2 className="font-bold text-white">Punkteverlauf</h2>
            <span className="text-slate-500 text-sm">– kumulierte Punkte pro Spiel</span>
          </div>
          <div className="p-4">
            <ResponsiveContainer width="100%" height={320}>
              <LineChart data={timelineChartData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis
                  dataKey="match"
                  stroke="#64748b"
                  tick={{ fill: "#94a3b8", fontSize: 11 }}
                  label={{ value: "Spiel #", position: "insideBottom", offset: -2, fill: "#64748b", fontSize: 11 }}
                />
                <YAxis stroke="#64748b" tick={{ fill: "#94a3b8", fontSize: 11 }} />
                <Tooltip content={<CustomTooltipLine />} />
                <Legend
                  wrapperStyle={{ paddingTop: "16px", fontSize: "12px", color: "#94a3b8" }}
                />
                {data.timelines.map((player, idx) => (
                  <Line
                    key={player.playerId}
                    type="monotone"
                    dataKey={player.playerName}
                    stroke={PLAYER_COLORS[idx % PLAYER_COLORS.length]}
                    strokeWidth={2}
                    dot={{ r: 3, fill: PLAYER_COLORS[idx % PLAYER_COLORS.length] }}
                    activeDot={{ r: 5 }}
                  />
                ))}
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      ) : (
        <div className="bg-slate-800 rounded-xl border border-slate-700 p-12 text-center text-slate-500">
          <TrendingUp className="w-10 h-10 mx-auto mb-3 opacity-30" />
          <div>Noch keine Daten für den Punkteverlauf vorhanden</div>
        </div>
      )}

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Stacked bar per player */}
        {playerBarData.length > 0 && (
          <div className="bg-slate-800 rounded-xl border border-slate-700 shadow-lg overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-700 flex items-center gap-2">
              <BarChart2 className="w-5 h-5 text-blue-400" />
              <h2 className="font-bold text-white">Tipp-Verteilung pro Spieler</h2>
            </div>
            <div className="p-4">
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={playerBarData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                  <XAxis
                    dataKey="name"
                    stroke="#64748b"
                    tick={{ fill: "#94a3b8", fontSize: 10 }}
                  />
                  <YAxis stroke="#64748b" tick={{ fill: "#94a3b8", fontSize: 11 }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#1e293b",
                      border: "1px solid #475569",
                      borderRadius: "8px",
                      fontSize: "12px",
                    }}
                    labelStyle={{ color: "#f1f5f9", fontWeight: "bold" }}
                    itemStyle={{ color: "#94a3b8" }}
                    formatter={(value, name) => [`${value} Tipps`, name]}
                  />
                  <Legend
                    wrapperStyle={{ paddingTop: "12px", fontSize: "11px", color: "#94a3b8" }}
                  />
                  <Bar dataKey="Exakt" stackId="a" fill="#10b981" radius={[0, 0, 0, 0]} />
                  <Bar dataKey="Differenz" stackId="a" fill="#f59e0b" />
                  <Bar dataKey="Tendenz" stackId="a" fill="#f97316" />
                  <Bar dataKey="Falsch" stackId="a" fill="#ef4444" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* Pie chart */}
        {pieData.length > 0 && (
          <div className="bg-slate-800 rounded-xl border border-slate-700 shadow-lg overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-700 flex items-center gap-2">
              <Target className="w-5 h-5 text-purple-400" />
              <h2 className="font-bold text-white">Gesamtverteilung aller Tipps</h2>
            </div>
            <div className="p-4">
              <ResponsiveContainer width="100%" height={280}>
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="45%"
                    outerRadius={100}
                    dataKey="value"
                    label={({ name, percent }) =>
                      `${name} ${((percent ?? 0) * 100).toFixed(0)}%`
                    }
                    labelLine={{ stroke: "#64748b" }}
                  >
                    {pieData.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={PIE_COLORS[index % PIE_COLORS.length]}
                      />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#1e293b",
                      border: "1px solid #475569",
                      borderRadius: "8px",
                      fontSize: "12px",
                    }}
                    formatter={(value) => [`${value} Tipps`]}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="flex flex-wrap justify-center gap-3 mt-2 text-xs">
                {pieData.map((entry, idx) => (
                  <div key={entry.name} className="flex items-center gap-1.5">
                    <span
                      className="w-3 h-3 rounded-full inline-block"
                      style={{ backgroundColor: PIE_COLORS[idx % PIE_COLORS.length] }}
                    />
                    <span className="text-slate-400">
                      {entry.name}: <span className="text-white font-semibold">{entry.value}</span>
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Hit rate table */}
      {sortedStats.length > 0 && (
        <div className="bg-slate-800 rounded-xl border border-slate-700 shadow-lg overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-700 flex items-center gap-2">
            <Target className="w-5 h-5 text-emerald-400" />
            <h2 className="font-bold text-white">Trefferquote pro Spieler</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-700/50 text-slate-400 text-xs uppercase tracking-wide">
                  <th className="px-4 py-3 text-left">Spieler</th>
                  <th className="px-4 py-3 text-right">Tipps</th>
                  <th className="px-4 py-3 text-right text-emerald-400">Exakt</th>
                  <th className="px-4 py-3 text-right text-amber-400">Diff</th>
                  <th className="px-4 py-3 text-right text-orange-400">Tendenz</th>
                  <th className="px-4 py-3 text-right text-red-400">Falsch</th>
                  <th className="px-4 py-3 text-center">Trefferquote</th>
                  <th className="px-4 py-3 text-right hidden sm:table-cell">Max.Serie</th>
                </tr>
              </thead>
              <tbody>
                {sortedStats.map((p, idx) => (
                  <tr
                    key={p.id}
                    className="border-t border-slate-700/50 hover:bg-slate-700/30 transition-colors even:bg-slate-800/50"
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <span
                          className="w-3 h-3 rounded-full flex-shrink-0"
                          style={{
                            backgroundColor: PLAYER_COLORS[idx % PLAYER_COLORS.length],
                          }}
                        />
                        <span className="font-semibold text-white">{p.name}</span>
                        {p.team && <span className="text-slate-500 text-xs hidden md:block">{p.team}</span>}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right text-slate-300">{p.total}</td>
                    <td className="px-4 py-3 text-right text-emerald-400 font-semibold">
                      {p.exact}
                    </td>
                    <td className="px-4 py-3 text-right text-amber-400 font-semibold">{p.diff}</td>
                    <td className="px-4 py-3 text-right text-orange-400 font-semibold">
                      {p.tendency}
                    </td>
                    <td className="px-4 py-3 text-right text-red-400 font-semibold">{p.wrong}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="flex-1 h-2 bg-slate-700 rounded-full overflow-hidden">
                          <div
                            className="h-full rounded-full transition-all"
                            style={{
                              width: `${p.hitRate}%`,
                              backgroundColor:
                                p.hitRate >= 70
                                  ? "#10b981"
                                  : p.hitRate >= 50
                                  ? "#f59e0b"
                                  : "#ef4444",
                            }}
                          />
                        </div>
                        <span
                          className={`text-xs font-bold w-10 text-right ${
                            p.hitRate >= 70
                              ? "text-emerald-400"
                              : p.hitRate >= 50
                              ? "text-amber-400"
                              : "text-red-400"
                          }`}
                        >
                          {p.hitRate}%
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right font-semibold text-slate-300 hidden sm:table-cell">
                      {p.maxStreak > 0 ? (
                        <span className={p.maxStreak >= 5 ? "text-amber-400" : ""}>
                          {p.maxStreak >= 5 && "🔥 "}
                          {p.maxStreak}
                        </span>
                      ) : (
                        <span className="text-slate-600">–</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Streak hall of fame */}
      {sortedStats.filter((p) => p.maxStreak > 0).length > 0 && (
        <div className="bg-slate-800 rounded-xl border border-slate-700 shadow-lg overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-700 flex items-center gap-2">
            <Award className="w-5 h-5 text-amber-400" />
            <h2 className="font-bold text-white">Serien Hall of Fame</h2>
          </div>
          <div className="p-4 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {[...sortedStats]
              .sort((a, b) => b.maxStreak - a.maxStreak)
              .filter((p) => p.maxStreak > 0)
              .map((p, idx) => (
                <div
                  key={p.id}
                  className={`rounded-xl p-4 border text-center ${
                    idx === 0
                      ? "bg-amber-900/20 border-amber-700/50"
                      : "bg-slate-700/30 border-slate-700/50"
                  }`}
                >
                  <div
                    className={`text-4xl font-black mb-1 ${
                      idx === 0 ? "text-amber-400" : "text-slate-300"
                    }`}
                  >
                    {p.maxStreak}
                  </div>
                  <div className="text-white font-semibold text-sm">{p.name}</div>
                  {p.team && <div className="text-slate-500 text-xs mt-0.5">{p.team}</div>}
                  {idx === 0 && (
                    <div className="mt-2 text-xs text-amber-400 font-bold">🏆 Rekord!</div>
                  )}
                </div>
              ))}
          </div>
        </div>
      )}

      {totalTips === 0 && (
        <div className="text-center py-20 text-slate-500">
          <BarChart2 className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <div>Noch keine abgeschlossenen Spiele mit Tipps vorhanden</div>
        </div>
      )}
    </div>
  );
}
