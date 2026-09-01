import { useCallback, useEffect, useMemo, useState } from "react";
import ctfService from "../../../services/ctfService";
import LoadingSpinner from "../../../components/LoadingSpinner";
import ErrorState from "../../../components/ErrorState";

const palette = ["#38bdf8", "#22c55e", "#f59e0b", "#a78bfa", "#fb7185", "#14b8a6"];

const fmtElapsed = (start, value) => {
  if (!start || !value) return "00";
  const t = typeof value === "number" ? value : new Date(value).getTime();
  const minutes = Math.max(0, Math.round((t - start) / 60000));
  return String(minutes).padStart(2, "0");
};

export default function CtfLeaderboard() {
  const [teamsData, setTeamsData] = useState([]);
  const [timeline, setTimeline] = useState({
    series: [],
    time_start: null,
    time_end: null,
    max_score: 0,
  });
  const [selectedTeam, setSelectedTeam] = useState("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError("");
      const [teams, timelineData] = await Promise.all([
        ctfService.listTeams(),
        ctfService.getLeaderboardTimeline(),
      ]);
      setTeamsData(Array.isArray(teams) ? teams : []);
      setTimeline(
        timelineData || {
          series: [],
          time_start: null,
          time_end: null,
          max_score: 0,
        }
      );
    } catch (errorValue) {
      setError(ctfService.withApiError(errorValue, "Unable to load leaderboard"));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
    const id = setInterval(load, 5000);
    return () => clearInterval(id);
  }, [load]);

  const ranked = useMemo(() => {
    return [...teamsData]
      .sort((a, b) => Number(b?.team?.score || 0) - Number(a?.team?.score || 0))
      .map((row, index) => ({ ...row, rank: index + 1 }));
  }, [teamsData]);

  const chart = useMemo(() => {
    const width = 980;
    const height = 480;
    const padL = 70;
    const padR = 24;
    const padT = 28;
    const padB = 72;
    const innerW = width - padL - padR;
    const innerH = height - padT - padB;
    const start = timeline?.time_start ? new Date(timeline.time_start).getTime() : 0;
    const end = timeline?.time_end ? new Date(timeline.time_end).getTime() : start + 1;
    const span = Math.max(1, end - start);
    const maxScore = Math.max(1, Number(timeline?.max_score || 0));

    const mapX = (iso) => {
      const t = new Date(iso).getTime();
      return padL + ((t - start) / span) * innerW;
    };
    const mapY = (score) => padT + ((maxScore - Number(score || 0)) / maxScore) * innerH;

    const filteredSeries = (timeline?.series || []).filter((entry) =>
      selectedTeam === "all" ? true : entry.team_name === selectedTeam
    );

    const lines = filteredSeries
      .map((series, index) => {
        const pointsRaw = (series.points || []).filter((point) => point?.time);
        if (pointsRaw.length === 0) return null;

        const points = pointsRaw.map((point) => ({
          x: mapX(point.time),
          y: mapY(point.score),
          score: point.score,
          time: point.time,
        }));
        const d = points
          .map((point, pointIndex) =>
            `${pointIndex === 0 ? "M" : "L"} ${point.x.toFixed(2)} ${point.y.toFixed(2)}`
          )
          .join(" ");

        return {
          name: series.team_name,
          color: series.color || palette[index % palette.length],
          d,
        };
      })
      .filter(Boolean);

    return {
      width,
      height,
      padL,
      padB,
      innerW,
      innerH,
      lines,
      maxScore,
      start,
      end,
    };
  }, [timeline, selectedTeam]);

  if (loading && ranked.length === 0) {
    return <LoadingSpinner label="Loading leaderboard..." />;
  }

  return (
    <section className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold text-slate-100">CTF Leaderboard</h1>
        <p className="text-sm text-slate-400">
          Live score timeline and ranked teams.
        </p>
      </div>

      {error ? <ErrorState message={error} onRetry={load} /> : null}

      {!timeline?.time_start ? (
        <div className="rounded-2xl border border-amber-500/40 bg-amber-500/10 p-5 text-amber-100">
          Score graph will appear after CTF is started.
        </div>
      ) : (
        <>
          <div className="flex items-center gap-2">
            <label className="text-sm text-slate-300">Team View</label>
            <select
              value={selectedTeam}
              onChange={(event) => setSelectedTeam(event.target.value)}
              className="rounded-lg border border-slate-700 bg-slate-900 px-2 py-1.5 text-sm text-slate-100"
            >
              <option value="all">All Teams</option>
              {(timeline.series || []).map((series) => (
                <option key={series.team_name} value={series.team_name}>
                  {series.team_name}
                </option>
              ))}
            </select>
          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-3">
            <svg viewBox={`0 0 ${chart.width} ${chart.height}`} className="h-[460px] w-full">
              <rect x="0" y="0" width={chart.width} height={chart.height} fill="#0f172a" rx="14" />

              <line
                x1={chart.padL}
                y1={chart.height - chart.padB}
                x2={chart.width - 24}
                y2={chart.height - chart.padB}
                stroke="#475569"
                strokeWidth="2"
              />
              <line
                x1={chart.padL}
                y1={chart.height - chart.padB}
                x2={chart.padL}
                y2={28}
                stroke="#475569"
                strokeWidth="2"
              />

              {[0, 0.25, 0.5, 0.75, 1].map((fraction) => {
                const score = Math.round(chart.maxScore * fraction);
                const y = 28 + (1 - fraction) * chart.innerH;
                return (
                  <g key={fraction}>
                    <line
                      x1={chart.padL}
                      y1={y}
                      x2={chart.width - 24}
                      y2={y}
                      stroke="#1e293b"
                      strokeWidth="1"
                    />
                    <text
                      x={chart.padL - 10}
                      y={y + 4}
                      textAnchor="end"
                      fontSize="12"
                      fill="#94a3b8"
                    >
                      {score}
                    </text>
                  </g>
                );
              })}

              {[0, 0.25, 0.5, 0.75, 1].map((fraction) => {
                const x = chart.padL + fraction * chart.innerW;
                const ms = chart.start + (chart.end - chart.start) * fraction;
                return (
                  <g key={`x-${fraction}`}>
                    <line
                      x1={x}
                      y1={chart.height - chart.padB}
                      x2={x}
                      y2={chart.height - chart.padB + 6}
                      stroke="#475569"
                    />
                    <text
                      x={x}
                      y={chart.height - chart.padB + 20}
                      textAnchor="middle"
                      fontSize="12"
                      fill="#94a3b8"
                    >
                      {fmtElapsed(chart.start, ms)}
                    </text>
                  </g>
                );
              })}

              {chart.lines.map((line) => (
                <path
                  key={line.name}
                  d={line.d}
                  fill="none"
                  stroke={line.color}
                  strokeWidth={selectedTeam === "all" ? 3 : 4}
                />
              ))}

              <text
                x={chart.width / 2}
                y={chart.height - 20}
                textAnchor="middle"
                fontSize="14"
                fill="#cbd5e1"
              >
                Time (minutes)
              </text>
              <text
                x={24}
                y={chart.height / 2}
                textAnchor="middle"
                fontSize="14"
                fill="#cbd5e1"
                transform={`rotate(-90 24 ${chart.height / 2})`}
              >
                Score
              </text>
            </svg>
          </div>

          <div className="flex flex-wrap gap-2">
            {chart.lines.map((line) => (
              <div
                key={line.name}
                className="rounded-lg border border-slate-700 bg-slate-900/70 px-2 py-1 text-xs text-slate-200"
              >
                <span
                  className="mr-2 inline-block h-2.5 w-2.5 rounded-full align-middle"
                  style={{ backgroundColor: line.color }}
                />
                {line.name}
              </div>
            ))}
          </div>
        </>
      )}

      <div className="overflow-hidden rounded-2xl border border-slate-800">
        <table className="min-w-full divide-y divide-slate-800">
          <thead className="bg-slate-900">
            <tr>
              <th className="px-3 py-2 text-left text-xs uppercase tracking-[0.14em] text-slate-400">
                Rank
              </th>
              <th className="px-3 py-2 text-left text-xs uppercase tracking-[0.14em] text-slate-400">
                Team
              </th>
              <th className="px-3 py-2 text-left text-xs uppercase tracking-[0.14em] text-slate-400">
                Leader
              </th>
              <th className="px-3 py-2 text-left text-xs uppercase tracking-[0.14em] text-slate-400">
                Score
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800 bg-slate-900/40 text-sm text-slate-200">
            {ranked.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-3 py-6 text-center text-slate-400">
                  No leaderboard data available.
                </td>
              </tr>
            ) : (
              ranked.map((row) => (
                <tr key={row?.team?.id || `${row.rank}`}>
                  <td className="px-3 py-2">{row.rank}</td>
                  <td className="px-3 py-2">{row?.team?.name || "-"}</td>
                  <td className="px-3 py-2">{row?.team?.leader_name || "-"}</td>
                  <td className="px-3 py-2">{row?.team?.score ?? 0}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
