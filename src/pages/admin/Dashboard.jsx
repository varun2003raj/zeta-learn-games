import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import toast from "react-hot-toast";
import { fetchDashboardStats } from "../../store/escapeSlice";
import ctfService from "../../services/ctfService";
import escapeService from "../../services/escapeService";
import Table from "../../components/Table";
import LoadingSpinner from "../../components/LoadingSpinner";
import ErrorState from "../../components/ErrorState";
import { formatDateTime } from "../../utils/admin";
import { showConfirm, showPrompt } from "../../utils/popup";

const escapeStatCards = [
  { key: "rooms", label: "Escape Rooms" },
  { key: "levels", label: "Levels" },
  { key: "questions", label: "Questions" },
  { key: "attempts", label: "Attempts" },
  { key: "completedUsers", label: "Completed Users" },
];

const difficultyMeta = {
  easy: { label: "Easy", color: "bg-emerald-500" },
  medium: { label: "Medium", color: "bg-blue-500" },
  hard: { label: "Hard", color: "bg-rose-500" },
  ultra_hard: { label: "Ultra Hard", color: "bg-violet-500" },
};

const getAttemptRoomName = (attempt) =>
  attempt?.escape_room?.title || attempt?.room?.title || attempt?.room_name || "-";

const getAttemptUserName = (attempt) =>
  attempt?.user?.username || attempt?.user_name || attempt?.username || "-";

const attemptColumns = [
  {
    key: "user",
    title: "User",
    render: (attempt) => getAttemptUserName(attempt),
  },
  {
    key: "room",
    title: "Escape Room",
    render: (attempt) => getAttemptRoomName(attempt),
  },
  {
    key: "level",
    title: "Current Level",
    render: (attempt) => attempt?.current_level?.title || attempt?.current_level || "-",
  },
  {
    key: "score",
    title: "Score",
    render: (attempt) => attempt?.score ?? 0,
  },
  {
    key: "completed",
    title: "Completed",
    render: (attempt) => {
      const completed = Boolean(attempt?.completed ?? attempt?.is_completed);
      return (
        <span
          className={`rounded-full border px-2 py-1 text-xs ${
            completed
              ? "border-emerald-500/40 bg-emerald-500/20 text-emerald-200"
              : "border-amber-500/40 bg-amber-500/20 text-amber-200"
          }`}
        >
          {completed ? "Yes" : "No"}
        </span>
      );
    },
  },
  {
    key: "start",
    title: "Start Time",
    render: (attempt) => formatDateTime(attempt?.start_time || attempt?.started_at),
  },
];

function DifficultyChart({ data }) {
  const max = Math.max(1, ...data.map((row) => row.value));

  return (
    <div className="space-y-3">
      {data.map((row) => (
        <div key={row.key} className="space-y-1">
          <div className="flex items-center justify-between text-xs text-slate-300">
            <span>{row.label}</span>
            <span>{row.value}</span>
          </div>
          <div className="h-2 rounded-full bg-slate-800">
            <div
              className={`h-2 rounded-full ${row.color}`}
              style={{ width: `${(row.value / max) * 100}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

function EscapeRoomAttemptsChart({ rows }) {
  const topRows = rows.slice(0, 6);
  const max = Math.max(1, ...topRows.map((row) => row.total));

  return (
    <div className="space-y-3">
      {topRows.map((row) => (
        <div key={row.roomId} className="space-y-1">
          <div className="flex items-center justify-between text-xs text-slate-300">
            <span className="truncate">{row.roomTitle}</span>
            <span>
              {row.completed}/{row.total}
            </span>
          </div>
          <div className="h-3 overflow-hidden rounded-full bg-slate-800">
            <div
              className="h-3 bg-blue-500"
              style={{ width: `${(row.total / max) * 100}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

function CtfTimelineChart({ timeline }) {
  const width = 900;
  const height = 290;
  const padX = 54;
  const padTop = 20;
  const padBottom = 32;

  const start = timeline?.time_start ? new Date(timeline.time_start).getTime() : 0;
  const end = timeline?.time_end ? new Date(timeline.time_end).getTime() : start + 1;
  const span = Math.max(1, end - start);
  const maxScore = Math.max(1, Number(timeline?.max_score || 0));
  const series = Array.isArray(timeline?.series) ? timeline.series.slice(0, 6) : [];

  const mapX = (iso) => {
    const t = new Date(iso).getTime();
    return padX + ((t - start) / span) * (width - padX * 2);
  };
  const mapY = (score) => {
    const value = Number(score || 0);
    return padTop + ((maxScore - value) / maxScore) * (height - padTop - padBottom);
  };

  if (!timeline?.time_start || series.length === 0) {
    return (
      <div className="rounded-xl border border-slate-700 bg-slate-900/60 p-4 text-sm text-slate-300">
        Timeline appears after CTF starts and teams gain scores.
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-slate-700 bg-slate-900/70 p-3">
      <svg viewBox={`0 0 ${width} ${height}`} className="h-72 w-full">
        <rect x="0" y="0" width={width} height={height} fill="#0f172a" rx="12" />
        <line
          x1={padX}
          y1={height - padBottom}
          x2={width - padX}
          y2={height - padBottom}
          stroke="#334155"
          strokeWidth="1.5"
        />
        <line
          x1={padX}
          y1={padTop}
          x2={padX}
          y2={height - padBottom}
          stroke="#334155"
          strokeWidth="1.5"
        />

        {series.map((team, index) => {
          const points = Array.isArray(team.points) ? team.points : [];
          if (points.length === 0) return null;

          const color = team.color || ["#38bdf8", "#22c55e", "#f59e0b", "#a78bfa", "#fb7185", "#14b8a6"][index % 6];
          const path = points
            .filter((point) => point?.time)
            .map((point, pointIndex) => {
              const x = mapX(point.time);
              const y = mapY(point.score);
              return `${pointIndex === 0 ? "M" : "L"} ${x} ${y}`;
            })
            .join(" ");

          return (
            <path
              key={team.team_name || `${index}`}
              d={path}
              fill="none"
              stroke={color}
              strokeWidth="2.5"
            />
          );
        })}
      </svg>
    </div>
  );
}

export default function Dashboard() {
  const dispatch = useDispatch();
  const { dashboard, loading, error } = useSelector((state) => state.escape);

  const [ctfLoading, setCtfLoading] = useState(true);
  const [ctfError, setCtfError] = useState("");
  const [ctfState, setCtfState] = useState({});
  const [ctfChallenges, setCtfChallenges] = useState([]);
  const [ctfTeams, setCtfTeams] = useState([]);
  const [ctfTimeline, setCtfTimeline] = useState({
    series: [],
    time_start: null,
    time_end: null,
    max_score: 0,
  });
  const [ctfActionLoading, setCtfActionLoading] = useState("");
  const [escapeControlLoading, setEscapeControlLoading] = useState(true);
  const [escapeControlError, setEscapeControlError] = useState("");
  const [escapeControl, setEscapeControl] = useState({
    status: "draft",
    started_at: null,
    finished_at: null,
    updated_at: null,
  });
  const [escapeActionLoading, setEscapeActionLoading] = useState("");

  const loadEscapeDashboard = useCallback(() => {
    dispatch(fetchDashboardStats());
  }, [dispatch]);

  const loadEscapeControl = useCallback(async () => {
    try {
      setEscapeControlLoading(true);
      setEscapeControlError("");
      const stateValue = await escapeService.getControlState();
      setEscapeControl(stateValue || {});
    } catch (errorValue) {
      setEscapeControlError(
        escapeService.withApiError(errorValue, "Unable to load escape room state")
      );
    } finally {
      setEscapeControlLoading(false);
    }
  }, []);

  const loadCtfDashboard = useCallback(async () => {
    try {
      setCtfLoading(true);
      setCtfError("");
      const [stateValue, challenges, teams, timeline] = await Promise.all([
        ctfService.getCtfState().catch(() => ({})),
        ctfService.listChallenges().catch(() => []),
        ctfService.listTeams().catch(() => []),
        ctfService
          .getLeaderboardTimeline()
          .catch(() => ({ series: [], time_start: null, time_end: null, max_score: 0 })),
      ]);

      setCtfState(stateValue || {});
      setCtfChallenges(challenges);
      setCtfTeams(teams);
      setCtfTimeline(timeline || { series: [], time_start: null, time_end: null, max_score: 0 });
    } catch (errorValue) {
      setCtfError(ctfService.withApiError(errorValue, "Unable to load CTF dashboard"));
    } finally {
      setCtfLoading(false);
    }
  }, []);

  useEffect(() => {
    loadEscapeDashboard();
    loadEscapeControl();
    loadCtfDashboard();

    const interval = setInterval(() => {
      loadEscapeDashboard();
      loadEscapeControl();
      loadCtfDashboard();
    }, 45000);

    return () => clearInterval(interval);
  }, [loadEscapeDashboard, loadEscapeControl, loadCtfDashboard]);

  const ctfMetrics = useMemo(() => {
    const categories = new Set();
    const difficultyCounts = Object.keys(difficultyMeta).reduce(
      (accumulator, key) => ({ ...accumulator, [key]: 0 }),
      {}
    );

    ctfChallenges.forEach((challenge) => {
      const category =
        challenge?.category_name || challenge?.category?.name || challenge?.category || "";
      if (category) categories.add(String(category));

      const difficulty = String(challenge?.difficulty || "").toLowerCase();
      if (difficultyCounts[difficulty] !== undefined) {
        difficultyCounts[difficulty] += 1;
      }
    });

    const rankedTeams = [...ctfTeams]
      .sort((a, b) => Number(b?.team?.score || 0) - Number(a?.team?.score || 0))
      .slice(0, 5);

    return {
      totalChallenges: ctfChallenges.length,
      totalCategories: categories.size,
      totalTeams: ctfTeams.length,
      topTeamScore: rankedTeams[0]?.team?.score || 0,
      rankedTeams,
      difficultyChart: Object.entries(difficultyMeta).map(([key, meta]) => ({
        key,
        label: meta.label,
        value: difficultyCounts[key] || 0,
        color: meta.color,
      })),
    };
  }, [ctfChallenges, ctfTeams]);

  const ctfStatusLabel = String(ctfState?.status || "idle").replaceAll("_", " ");
  const escapeStatusLabel = String(escapeControl?.status || "draft").replaceAll(
    "_",
    " "
  );
  const completionTotal =
    Number(dashboard.completionSummary?.completed || 0) +
    Number(dashboard.completionSummary?.inProgress || 0);
  const completionRate = completionTotal
    ? Math.round((Number(dashboard.completionSummary?.completed || 0) / completionTotal) * 100)
    : 0;

  const runCtfAction = async (type) => {
    const normalizedType = String(type || "");
    const actionLabel =
      normalizedType === "start"
        ? "Start"
        : normalizedType === "finish"
        ? "Finish"
        : "Reset";

    const confirmed = await showConfirm(
      `Are you sure you want to ${actionLabel.toLowerCase()} the CTF now?`,
      `${actionLabel} CTF`,
      {
        okText: actionLabel,
        tone: normalizedType === "reset" ? "danger" : "warning",
      }
    );
    if (!confirmed) return;

    try {
      setCtfActionLoading(normalizedType);

      if (normalizedType === "start") {
        await ctfService.startCtf();
        toast.success("CTF started");
      } else if (normalizedType === "finish") {
        await ctfService.finishCtf();
        toast.success("CTF finished");
      } else if (normalizedType === "reset") {
        const historyName = await showPrompt(
          "Enter history name for reset record.",
          "Reset CTF",
          {
            okText: "Reset Now",
            tone: "danger",
            placeholder: "Example: Round 1 Archive",
            requireInput: true,
          }
        );
        if (historyName === null) return;
        await ctfService.resetCtf(historyName.trim());
        toast.success("CTF reset complete");
      }

      await loadCtfDashboard();
    } catch (errorValue) {
      toast.error(ctfService.withApiError(errorValue, "CTF action failed"));
    } finally {
      setCtfActionLoading("");
    }
  };

  const runEscapeAction = async (type) => {
    const normalizedType = String(type || "");
    const actionLabel =
      normalizedType === "start"
        ? "Start"
        : normalizedType === "finish"
        ? "Finish"
        : "Reset";

    const confirmed = await showConfirm(
      `Are you sure you want to ${actionLabel.toLowerCase()} Escape Room now?`,
      `${actionLabel} Escape Room`,
      {
        okText: actionLabel,
        tone: normalizedType === "reset" ? "danger" : "warning",
      }
    );
    if (!confirmed) return;

    try {
      setEscapeActionLoading(normalizedType);
      if (normalizedType === "start") {
        await escapeService.startEscapeEvent();
        toast.success("Escape room started");
      } else if (normalizedType === "finish") {
        await escapeService.finishEscapeEvent();
        toast.success("Escape room finished");
      } else if (normalizedType === "reset") {
        await escapeService.resetEscapeEvent();
        toast.success("Escape room reset complete");
      }

      await Promise.all([loadEscapeDashboard(), loadEscapeControl()]);
    } catch (errorValue) {
      toast.error(
        escapeService.withApiError(errorValue, "Escape room action failed")
      );
    } finally {
      setEscapeActionLoading("");
    }
  };

  if (loading.dashboard && ctfLoading && escapeControlLoading && !dashboard.lastUpdated) {
    return <LoadingSpinner label="Loading admin dashboard..." />;
  }

  return (
    <section className="space-y-6">
      <div className="grid gap-4 lg:grid-cols-2">
        <article className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5">
          <p className="text-xs uppercase tracking-[0.2em] text-blue-300">Game Option</p>
          <h1 className="mt-2 text-2xl font-semibold text-slate-100">
            CTF Game
          </h1>
          <p className="mt-1 text-sm text-slate-400">
            Manage categories, challenges, and control CTF lifecycle.
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <Link
              to="/admin/ctf/challenges"
              className="rounded-lg bg-blue-600 px-3 py-2 text-sm font-semibold text-white hover:bg-blue-500"
            >
              Open CTF Admin
            </Link>
            <Link
              to="/admin/ctf/categories"
              className="rounded-lg border border-slate-600 px-3 py-2 text-sm text-slate-100 hover:bg-slate-800"
            >
              Categories
            </Link>
          </div>
        </article>

        <article className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5">
          <p className="text-xs uppercase tracking-[0.2em] text-indigo-300">Game Option</p>
          <h1 className="mt-2 text-2xl font-semibold text-slate-100">
            Escape Rooms
          </h1>
          <p className="mt-1 text-sm text-slate-400">
            Manage rooms, levels, questions, and attempts.
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <Link
              to="/admin/escape-rooms"
              className="rounded-lg bg-indigo-600 px-3 py-2 text-sm font-semibold text-white hover:bg-indigo-500"
            >
              Open Escape Admin
            </Link>
            <Link
              to="/admin/attempts"
              className="rounded-lg border border-slate-600 px-3 py-2 text-sm text-slate-100 hover:bg-slate-800"
            >
              Attempts
            </Link>
          </div>
        </article>
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <section className="space-y-4 rounded-2xl border border-slate-800 bg-slate-900/70 p-5">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 className="text-xl font-semibold text-slate-100">CTF Admin Charts</h2>
              <p className="text-sm text-slate-400">
                Status, difficulty distribution, and top teams.
              </p>
            </div>
            <span className="rounded-full border border-blue-500/40 bg-blue-500/20 px-2 py-1 text-xs text-blue-100">
              {ctfStatusLabel || "idle"}
            </span>
          </div>

          {ctfError ? <ErrorState message={ctfError} onRetry={loadCtfDashboard} /> : null}

          <div className="grid gap-3 sm:grid-cols-2">
            <article className="rounded-xl border border-slate-700 bg-slate-900 p-3">
              <p className="text-xs uppercase tracking-[0.15em] text-slate-400">
                Challenges
              </p>
              <p className="mt-1 text-2xl font-bold text-slate-100">
                {ctfMetrics.totalChallenges}
              </p>
            </article>
            <article className="rounded-xl border border-slate-700 bg-slate-900 p-3">
              <p className="text-xs uppercase tracking-[0.15em] text-slate-400">
                Categories
              </p>
              <p className="mt-1 text-2xl font-bold text-slate-100">
                {ctfMetrics.totalCategories}
              </p>
            </article>
            <article className="rounded-xl border border-slate-700 bg-slate-900 p-3">
              <p className="text-xs uppercase tracking-[0.15em] text-slate-400">Teams</p>
              <p className="mt-1 text-2xl font-bold text-slate-100">{ctfMetrics.totalTeams}</p>
            </article>
            <article className="rounded-xl border border-slate-700 bg-slate-900 p-3">
              <p className="text-xs uppercase tracking-[0.15em] text-slate-400">
                Top Team Score
              </p>
              <p className="mt-1 text-2xl font-bold text-slate-100">
                {ctfMetrics.topTeamScore}
              </p>
            </article>
          </div>

          <div className="rounded-xl border border-slate-700 bg-slate-900 p-4">
            <p className="mb-3 text-sm font-semibold text-slate-200">
              Challenge Difficulty Distribution
            </p>
            <DifficultyChart data={ctfMetrics.difficultyChart} />
          </div>

          <div className="rounded-xl border border-slate-700 bg-slate-900 p-4">
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                disabled={ctfActionLoading === "start"}
                onClick={() => runCtfAction("start")}
                className="rounded-lg bg-emerald-600 px-3 py-2 text-xs font-semibold text-white hover:bg-emerald-500 disabled:opacity-60"
              >
                {ctfActionLoading === "start" ? "Starting..." : "Start CTF"}
              </button>
              <button
                type="button"
                disabled={ctfActionLoading === "finish"}
                onClick={() => runCtfAction("finish")}
                className="rounded-lg bg-amber-600 px-3 py-2 text-xs font-semibold text-white hover:bg-amber-500 disabled:opacity-60"
              >
                {ctfActionLoading === "finish" ? "Finishing..." : "Finish CTF"}
              </button>
              <button
                type="button"
                disabled={ctfActionLoading === "reset"}
                onClick={() => runCtfAction("reset")}
                className="rounded-lg bg-rose-600 px-3 py-2 text-xs font-semibold text-white hover:bg-rose-500 disabled:opacity-60"
              >
                {ctfActionLoading === "reset" ? "Resetting..." : "Reset CTF"}
              </button>
            </div>
          </div>
        </section>

        <section className="space-y-4 rounded-2xl border border-slate-800 bg-slate-900/70 p-5">
          <div>
            <h2 className="text-xl font-semibold text-slate-100">
              Escape Room Charts
            </h2>
            <p className="text-sm text-slate-400">
              Room/level/question totals and attempt completion.
            </p>
          </div>

          {error.dashboard ? (
            <ErrorState message={error.dashboard} onRetry={loadEscapeDashboard} />
          ) : null}
          {escapeControlError ? (
            <ErrorState message={escapeControlError} onRetry={loadEscapeControl} />
          ) : null}

          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {escapeStatCards.map((card) => (
              <article
                key={card.key}
                className="rounded-xl border border-slate-700 bg-slate-900 p-3"
              >
                <p className="text-xs uppercase tracking-[0.15em] text-slate-400">
                  {card.label}
                </p>
                <p className="mt-1 text-2xl font-bold text-slate-100">
                  {dashboard.totals[card.key] ?? 0}
                </p>
              </article>
            ))}
          </div>

          <div className="rounded-xl border border-slate-700 bg-slate-900 p-4">
            <div className="mb-2 flex items-center justify-between text-sm text-slate-200">
              <span>Completion Rate</span>
              <span>{completionRate}%</span>
            </div>
            <div className="h-3 overflow-hidden rounded-full bg-slate-800">
              <div
                className="h-3 rounded-full bg-indigo-500"
                style={{ width: `${completionRate}%` }}
              />
            </div>
            <p className="mt-2 text-xs text-slate-400">
              Completed {dashboard.completionSummary?.completed || 0} /{" "}
              {completionTotal || 0} attempts
            </p>
          </div>

          <div className="rounded-xl border border-slate-700 bg-slate-900 p-4">
            <div className="mb-3 flex items-center justify-between">
              <p className="text-sm font-semibold text-slate-200">
                Escape Event Control
              </p>
              <span className="rounded-full border border-indigo-500/40 bg-indigo-500/20 px-2 py-1 text-xs text-indigo-100">
                {escapeStatusLabel}
              </span>
            </div>
            <div className="grid gap-2 text-xs text-slate-400 sm:grid-cols-3">
              <p>Started: {formatDateTime(escapeControl?.started_at)}</p>
              <p>Finished: {formatDateTime(escapeControl?.finished_at)}</p>
              <p>Updated: {formatDateTime(escapeControl?.updated_at)}</p>
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              <button
                type="button"
                disabled={escapeActionLoading === "start"}
                onClick={() => runEscapeAction("start")}
                className="rounded-lg bg-emerald-600 px-3 py-2 text-xs font-semibold text-white hover:bg-emerald-500 disabled:opacity-60"
              >
                {escapeActionLoading === "start" ? "Starting..." : "Start Escape"}
              </button>
              <button
                type="button"
                disabled={escapeActionLoading === "finish"}
                onClick={() => runEscapeAction("finish")}
                className="rounded-lg bg-amber-600 px-3 py-2 text-xs font-semibold text-white hover:bg-amber-500 disabled:opacity-60"
              >
                {escapeActionLoading === "finish"
                  ? "Finishing..."
                  : "Finish Escape"}
              </button>
              <button
                type="button"
                disabled={escapeActionLoading === "reset"}
                onClick={() => runEscapeAction("reset")}
                className="rounded-lg bg-rose-600 px-3 py-2 text-xs font-semibold text-white hover:bg-rose-500 disabled:opacity-60"
              >
                {escapeActionLoading === "reset"
                  ? "Resetting..."
                  : "Reset Escape"}
              </button>
            </div>
          </div>

          <div className="rounded-xl border border-slate-700 bg-slate-900 p-4">
            <p className="mb-3 text-sm font-semibold text-slate-200">
              Attempts by Room
            </p>
            <EscapeRoomAttemptsChart rows={dashboard.attemptsByRoom || []} />
          </div>
        </section>
      </div>

      <section className="space-y-3 rounded-2xl border border-slate-800 bg-slate-900/70 p-5">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-slate-100">
            CTF Leaderboard Timeline
          </h2>
          <p className="text-xs text-slate-400">
            Last refresh: {formatDateTime(dashboard.lastUpdated)}
          </p>
        </div>
        <CtfTimelineChart timeline={ctfTimeline} />
      </section>

      <section className="space-y-3 rounded-2xl border border-slate-800 bg-slate-900/70 p-5">
        <h2 className="text-lg font-semibold text-slate-100">Top CTF Teams</h2>
        <div className="overflow-hidden rounded-xl border border-slate-800">
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
              {ctfMetrics.rankedTeams.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-3 py-6 text-center text-slate-400">
                    No team data yet.
                  </td>
                </tr>
              ) : (
                ctfMetrics.rankedTeams.map((entry, index) => (
                  <tr key={entry?.team?.id || `${index}`}>
                    <td className="px-3 py-2">{index + 1}</td>
                    <td className="px-3 py-2">{entry?.team?.name || "-"}</td>
                    <td className="px-3 py-2">{entry?.team?.leader_name || "-"}</td>
                    <td className="px-3 py-2">{entry?.team?.score ?? 0}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-slate-100">Recent Attempts</h2>
          <p className="text-xs text-slate-400">
            Updated: {formatDateTime(dashboard.lastUpdated)}
          </p>
        </div>
        <Table
          columns={attemptColumns}
          data={dashboard.recentAttempts}
          loading={loading.dashboard}
          emptyMessage="No attempts found yet."
        />
      </section>
    </section>
  );
}
