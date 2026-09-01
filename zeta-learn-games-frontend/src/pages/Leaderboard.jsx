import { useEffect, useMemo, useState } from "react";
import API from "../api/axios";
import Navbar from "../components/Navbar";
import { Link, useNavigate } from "react-router-dom";
import { showPopup } from "../utils/popup";
import useRotatingPublicTheme from "../hooks/useRotatingPublicTheme";

export default function Leaderboard() {
  const [teams, setTeams] = useState([]);
  const [timeline, setTimeline] = useState({ series: [], time_start: null, time_end: null, max_score: 0 });
  const [selectedTeam, setSelectedTeam] = useState("all");
  const [hoverInfo, setHoverInfo] = useState(null);
  const [ctfBlockedMessage, setCtfBlockedMessage] = useState("");
  const navigate = useNavigate();
  const themeModel = useRotatingPublicTheme();

  useEffect(() => {
    let mounted = true;
    const load = () =>
      Promise.all([API.get("ctf/leaderboard/"), API.get("ctf/leaderboard/timeline/")])
        .then(([boardRes, timelineRes]) => {
          if (!mounted) return;
          setTeams(Array.isArray(boardRes.data) ? boardRes.data : []);
          setTimeline(timelineRes?.data || { series: [], time_start: null, time_end: null, max_score: 0 });
          setCtfBlockedMessage("");
        })
        .catch((err) => {
          if (!mounted) return;
          const msg = err?.response?.data?.error || "Error loading scoreboard";
          if (err?.response?.status === 403) {
            if (msg.toLowerCase().includes("team")) {
              void showPopup("Create or join a team first.", "Access Required");
              navigate("/my-team");
              return;
            }
            setTeams([]);
            setTimeline({ series: [], time_start: null, time_end: null, max_score: 0 });
            setCtfBlockedMessage(msg);
            return;
          }
          void showPopup(msg, "Error");
        });

    load();
    const id = setInterval(load, 5000);
    const onFocus = () => load();
    window.addEventListener("focus", onFocus);
    return () => {
      mounted = false;
      clearInterval(id);
      window.removeEventListener("focus", onFocus);
    };
  }, [navigate]);

  const chart = useMemo(() => {
    const width = 980;
    const height = 500;
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

    const filteredSeries = (timeline?.series || []).filter((s) =>
      selectedTeam === "all" ? true : s.team_name === selectedTeam
    );

    const lines = filteredSeries
      .map((s) => {
        const ptsRaw = (s.points || []).filter((p) => p?.time);
        if (ptsRaw.length === 0) return null;
        const points = ptsRaw.map((p) => ({
          x: mapX(p.time),
          y: mapY(p.score),
          score: p.score,
          time: p.time,
        }));
        const d = points
          .map((p, idx) => `${idx === 0 ? "M" : "L"} ${p.x.toFixed(2)} ${p.y.toFixed(2)}`)
          .join(" ");
        return { name: s.team_name, color: s.color || "#60a5fa", d, points };
      })
      .filter(Boolean);

    return { width, height, padL, padB, innerW, innerH, lines, maxScore, start, end };
  }, [timeline, selectedTeam]);

  const fmtElapsedMin = (value) => {
    if (!value || !chart.start) return "00";
    const t = typeof value === "number" ? value : new Date(value).getTime();
    const mins = Math.max(0, Math.round((t - chart.start) / 60000));
    return `${mins.toString().padStart(2, "0")}`;
  };

  const handleMouseMove = (e, line) => {
    const svg = e.currentTarget.ownerSVGElement;
    if (!svg || !line?.points?.length) return;
    const rect = svg.getBoundingClientRect();
    const scaleX = chart.width / rect.width;
    const mouseX = (e.clientX - rect.left) * scaleX;

    let best = line.points[0];
    let dist = Math.abs(best.x - mouseX);
    for (let i = 1; i < line.points.length; i += 1) {
      const d = Math.abs(line.points[i].x - mouseX);
      if (d < dist) {
        dist = d;
        best = line.points[i];
      }
    }
    setHoverInfo({
      team: line.name,
      score: best.score,
      time: best.time,
      color: line.color,
      x: best.x,
      y: best.y,
    });
  };

  return (
    <div
      className={`ctf-shell public-shell min-h-screen bg-gray-950 text-white relative public-model-${themeModel}`}
    >
      <Navbar />
      <div className="p-6 leaderboard-shell">
        <div className="mb-4">
          <Link
            to="/ctf-hub"
            className="inline-block bg-gray-800 px-4 py-2 rounded-lg font-bold hover:bg-gray-700"
          >
            Back to Dashboard
          </Link>
        </div>

        <h1 className="text-4xl font-bold text-green-400 mb-6">
          Team Scoreboard Graph
        </h1>

        {ctfBlockedMessage ? (
          <div className="bg-blue-950/80 border border-yellow-500 rounded-2xl p-6 mb-6">
            <h2 className="text-4xl font-extrabold text-yellow-400 mb-3">
              CTF Status
            </h2>
            <p className="text-2xl text-slate-200">{ctfBlockedMessage}</p>
          </div>
        ) : (
          <>
            {!timeline?.time_start ? (
              <div className="bg-blue-950/80 border border-yellow-500 rounded-2xl p-6 mb-6">
                <h2 className="text-3xl font-extrabold text-yellow-400 mb-3">
                  Score Graph
                </h2>
                <p className="text-xl text-slate-200">
                  Graph will appear after CTF is started by admin.
                </p>
              </div>
            ) : (
              <>
                <div className="mb-4">
                  <label className="mr-3 text-slate-300 font-bold">
                    Team View:
                  </label>
                  <select
                    className="bg-gray-900 border border-gray-700 rounded-lg px-3 py-2"
                    value={selectedTeam}
                    onChange={(e) => setSelectedTeam(e.target.value)}
                  >
                    <option value="all">All Teams</option>
                    {(timeline.series || []).map((s) => (
                      <option key={s.team_name} value={s.team_name}>
                        {s.team_name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="bg-gray-900 rounded-2xl border border-gray-800 overflow-x-auto p-3">
                  <svg
                    viewBox={`0 0 ${chart.width} ${chart.height}`}
                    className="w-full h-[470px]"
                  >
                    <rect
                      x="0"
                      y="0"
                      width={chart.width}
                      height={chart.height}
                      fill="#0f172a"
                      rx="14"
                    />
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

                    {[0, 0.25, 0.5, 0.75, 1].map((f) => {
                      const score = Math.round(chart.maxScore * f);
                      const y = 28 + (1 - f) * chart.innerH;
                      return (
                        <g key={f}>
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

                    {[0, 0.25, 0.5, 0.75, 1].map((f) => {
                      const x = chart.padL + f * chart.innerW;
                      const ms = chart.start + (chart.end - chart.start) * f;
                      return (
                        <g key={`x-${f}`}>
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
                            {fmtElapsedMin(ms)}
                          </text>
                        </g>
                      );
                    })}

                    {chart.lines.map((l) => (
                      <path
                        key={l.name}
                        d={l.d}
                        fill="none"
                        stroke={l.color}
                        strokeWidth={selectedTeam === "all" ? 3 : 4}
                        onMouseMove={(e) => handleMouseMove(e, l)}
                        onMouseLeave={() => setHoverInfo(null)}
                      />
                    ))}

                    {hoverInfo && (
                      <g>
                        <circle
                          cx={hoverInfo.x}
                          cy={hoverInfo.y}
                          r="5"
                          fill={hoverInfo.color}
                        />
                        <rect
                          x={Math.min(hoverInfo.x + 10, chart.width - 260)}
                          y={Math.max(hoverInfo.y - 64, 10)}
                          width="240"
                          height="56"
                          rx="8"
                          fill="rgba(2,6,23,0.95)"
                          stroke={hoverInfo.color}
                        />
                        <text
                          x={Math.min(hoverInfo.x + 20, chart.width - 250)}
                          y={Math.max(hoverInfo.y - 40, 30)}
                          fill="#e2e8f0"
                          fontSize="13"
                        >
                          Team: {hoverInfo.team}
                        </text>
                        <text
                          x={Math.min(hoverInfo.x + 20, chart.width - 250)}
                          y={Math.max(hoverInfo.y - 23, 47)}
                          fill="#e2e8f0"
                          fontSize="13"
                        >
                          Score: {hoverInfo.score}
                        </text>
                        <text
                          x={Math.min(hoverInfo.x + 20, chart.width - 250)}
                          y={Math.max(hoverInfo.y - 6, 64)}
                          fill="#e2e8f0"
                          fontSize="13"
                        >
                          Time: {fmtElapsedMin(hoverInfo.time)} min
                        </text>
                      </g>
                    )}

                    <text
                      x={chart.width / 2}
                      y={chart.height - 20}
                      textAnchor="middle"
                      fontSize="14"
                      fill="#cbd5e1"
                    >
                      Time (min, starts at 00)
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

                <div className="mt-4 flex flex-wrap gap-3">
                  {chart.lines.map((s) => (
                    <div
                      key={s.name}
                      className="bg-gray-900 border border-gray-800 rounded-xl px-3 py-2 text-sm"
                    >
                      <span
                        className="inline-block w-3 h-3 rounded-full mr-2 align-middle"
                        style={{ backgroundColor: s.color || "#60a5fa" }}
                      />
                      <span className="font-bold">{s.name}</span>
                    </div>
                  ))}
                </div>

                <div className="mt-8 bg-gray-900 rounded-2xl border border-gray-800 overflow-hidden">
                  <table className="w-full">
                    <thead className="bg-gray-800">
                      <tr>
                        <th className="p-4 text-left">Rank</th>
                        <th className="p-4 text-left">Team Name</th>
                        <th className="p-4 text-left">Leader</th>
                        <th className="p-4 text-left">Score</th>
                      </tr>
                    </thead>
                    <tbody>
                      {teams.map((team) => (
                        <tr
                          key={team.rank}
                          className="border-b border-gray-800"
                        >
                          <td className="p-4 font-bold text-yellow-400">
                            {team.rank}
                          </td>
                          <td className="p-4 font-bold">{team.team_name}</td>
                          <td className="p-4">{team.leader}</td>
                          <td className="p-4 font-bold text-green-400">
                            {team.score}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </>
        )}
      </div>

      <style>{`
        .leaderboard-shell {
          position: relative;
          z-index: 2;
          width: min(1280px, calc(100% - 24px));
          margin: 12px auto;
          border-radius: 20px;
          border: 1px solid var(--ctf-panel-border, rgba(250, 204, 21, 0.2));
          background: linear-gradient(
            150deg,
            var(--ctf-panel-a, rgba(3, 10, 20, 0.62)),
            var(--ctf-panel-b, rgba(3, 10, 20, 0.48))
          );
          backdrop-filter: blur(3px);
          box-shadow: 0 18px 36px rgba(0, 0, 0, 0.4);
        }
        .leaderboard-shell h1,
        .leaderboard-shell h2,
        .leaderboard-shell p,
        .leaderboard-shell label,
        .leaderboard-shell th,
        .leaderboard-shell td {
          text-shadow: 0 2px 10px rgba(0, 0, 0, 0.7);
        }
      `}</style>
    </div>
  );
}
