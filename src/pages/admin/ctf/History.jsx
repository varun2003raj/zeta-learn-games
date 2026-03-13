import { useCallback, useEffect, useMemo, useState } from "react";
import ctfService from "../../../services/ctfService";
import LoadingSpinner from "../../../components/LoadingSpinner";
import ErrorState from "../../../components/ErrorState";
import EmptyState from "../../../components/EmptyState";

const buildComputed = (selected) => {
  const snapshot = selected?.snapshot || {};
  const teamsRaw = Array.isArray(snapshot.teams) ? snapshot.teams : [];
  const solvedRaw = Array.isArray(snapshot.solved_challenges)
    ? snapshot.solved_challenges
    : [];

  const fallbackScoreboard = teamsRaw
    .slice()
    .sort((a, b) => Number(b?.score || 0) - Number(a?.score || 0))
    .map((team, index) => ({
      rank: index + 1,
      team_name: team?.name || "-",
      leader: team?.leader || "-",
      score: team?.score || 0,
    }));

  const scoreByUser = {};
  solvedRaw.forEach((item) => {
    const username = item?.solved_by;
    const points = Number(item?.points || 0);
    if (!username) return;
    scoreByUser[username] = (scoreByUser[username] || 0) + points;
  });

  teamsRaw.forEach((team) => {
    const members = Array.isArray(team?.members) ? team.members : [];
    members.forEach((member) => {
      if (!member?.username) return;
      if (typeof member.individual_score === "number") {
        scoreByUser[member.username] = Math.max(
          scoreByUser[member.username] || 0,
          member.individual_score
        );
      } else if (!(member.username in scoreByUser)) {
        scoreByUser[member.username] = 0;
      }
    });
  });

  const fallbackUsers = Object.entries(scoreByUser)
    .map(([username, score]) => ({ username, score }))
    .sort((a, b) => Number(b.score) - Number(a.score));

  return {
    teams: teamsRaw,
    scoreboard:
      Array.isArray(snapshot.scoreboard) && snapshot.scoreboard.length > 0
        ? snapshot.scoreboard
        : fallbackScoreboard,
    users:
      Array.isArray(snapshot.individual_scores) &&
      snapshot.individual_scores.length > 0
        ? snapshot.individual_scores
        : fallbackUsers,
  };
};

export default function CtfHistory() {
  const [rows, setRows] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError("");
      const data = await ctfService.listHistory();
      const list = Array.isArray(data) ? data : [];
      setRows(list);
      setSelectedId((prev) => prev || (list[0] ? list[0].id : null));
    } catch (errorValue) {
      setError(ctfService.withApiError(errorValue, "Unable to load CTF history"));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const selected = useMemo(
    () => rows.find((row) => row.id === selectedId) || null,
    [rows, selectedId]
  );

  const computed = useMemo(() => buildComputed(selected), [selected]);

  if (loading && rows.length === 0) {
    return <LoadingSpinner label="Loading CTF history..." />;
  }

  return (
    <section className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold text-slate-100">CTF History</h1>
        <p className="text-sm text-slate-400">
          Archived snapshots after CTF reset operations.
        </p>
      </div>

      {error ? <ErrorState message={error} onRetry={load} /> : null}

      {!loading && rows.length === 0 ? (
        <EmptyState
          title="No history records"
          description="CTF history will appear after the first reset action."
        />
      ) : null}

      {rows.length > 0 ? (
        <div className="grid gap-4 lg:grid-cols-[320px_1fr]">
          <div className="space-y-2 rounded-2xl border border-slate-800 bg-slate-900/70 p-3">
            {rows.map((row) => (
              <button
                key={row.id}
                type="button"
                onClick={() => setSelectedId(row.id)}
                className={`w-full rounded-xl border px-3 py-2 text-left transition ${
                  row.id === selectedId
                    ? "border-blue-500/50 bg-blue-500/15"
                    : "border-slate-700 bg-slate-900 hover:bg-slate-800"
                }`}
              >
                <p className="text-sm font-semibold text-slate-100">
                  {row.name || "Untitled History"}
                </p>
                <p className="text-xs text-slate-400">{row.created_at}</p>
              </button>
            ))}
          </div>

          <div className="space-y-4 rounded-2xl border border-slate-800 bg-slate-900/70 p-4">
            {!selected ? (
              <p className="text-sm text-slate-400">Select a history record.</p>
            ) : (
              <>
                <article className="rounded-xl border border-slate-700 bg-slate-900 p-4">
                  <h2 className="text-lg font-semibold text-slate-100">
                    {selected.name || "Untitled History"}
                  </h2>
                  <p className="mt-2 text-sm text-slate-300">
                    Created: {selected.created_at}
                  </p>
                  <p className="mt-1 text-sm text-slate-300">
                    CTF State Before Reset:{" "}
                    {selected?.snapshot?.state_before_reset?.status || "-"}
                  </p>
                  <p className="mt-1 text-sm text-slate-300">
                    Teams Participated: {computed.teams.length}
                  </p>
                </article>

                <article className="rounded-xl border border-slate-700 bg-slate-900 p-4">
                  <h3 className="mb-2 text-sm font-semibold uppercase tracking-[0.13em] text-slate-300">
                    Scoreboard
                  </h3>
                  <div className="overflow-hidden rounded-lg border border-slate-800">
                    <table className="min-w-full divide-y divide-slate-800">
                      <thead className="bg-slate-900">
                        <tr>
                          <th className="px-3 py-2 text-left text-xs text-slate-400">
                            Rank
                          </th>
                          <th className="px-3 py-2 text-left text-xs text-slate-400">
                            Team
                          </th>
                          <th className="px-3 py-2 text-left text-xs text-slate-400">
                            Leader
                          </th>
                          <th className="px-3 py-2 text-left text-xs text-slate-400">
                            Score
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800 bg-slate-900/40 text-sm text-slate-200">
                        {computed.scoreboard.length === 0 ? (
                          <tr>
                            <td colSpan={4} className="px-3 py-5 text-center text-slate-400">
                              No scoreboard data.
                            </td>
                          </tr>
                        ) : (
                          computed.scoreboard.map((row, index) => (
                            <tr key={`${row.team_name}-${index}`}>
                              <td className="px-3 py-2">{row.rank}</td>
                              <td className="px-3 py-2">{row.team_name}</td>
                              <td className="px-3 py-2">{row.leader}</td>
                              <td className="px-3 py-2">{row.score}</td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </article>

                <article className="rounded-xl border border-slate-700 bg-slate-900 p-4">
                  <h3 className="mb-2 text-sm font-semibold uppercase tracking-[0.13em] text-slate-300">
                    Individual Scores
                  </h3>
                  <div className="overflow-hidden rounded-lg border border-slate-800">
                    <table className="min-w-full divide-y divide-slate-800">
                      <thead className="bg-slate-900">
                        <tr>
                          <th className="px-3 py-2 text-left text-xs text-slate-400">
                            User
                          </th>
                          <th className="px-3 py-2 text-left text-xs text-slate-400">
                            Score
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800 bg-slate-900/40 text-sm text-slate-200">
                        {computed.users.length === 0 ? (
                          <tr>
                            <td colSpan={2} className="px-3 py-5 text-center text-slate-400">
                              No individual score data.
                            </td>
                          </tr>
                        ) : (
                          computed.users.map((row, index) => (
                            <tr key={`${row.username}-${index}`}>
                              <td className="px-3 py-2">{row.username}</td>
                              <td className="px-3 py-2">{row.score}</td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </article>
              </>
            )}
          </div>
        </div>
      ) : null}
    </section>
  );
}
