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
        <h1 className="text-2xl font-semibold text-slate-900">CTF History</h1>
        <p className="text-sm text-slate-500">
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
          <div className="space-y-2 rounded-2xl border border-slate-200 bg-white/95 p-3">
            {rows.map((row) => (
              <button
                key={row.id}
                type="button"
                onClick={() => setSelectedId(row.id)}
                className={`w-full rounded-xl border px-3 py-2 text-left transition ${
                  row.id === selectedId
                    ? "border-blue-500/50 bg-blue-50"
                    : "border-slate-200 bg-white hover:bg-slate-50"
                }`}
              >
                <p className="text-sm font-semibold text-slate-900">
                  {row.name || "Untitled History"}
                </p>
                <p className="text-xs text-slate-500">{row.created_at}</p>
              </button>
            ))}
          </div>

          <div className="space-y-4 rounded-2xl border border-slate-200 bg-white/95 p-4">
            {!selected ? (
              <p className="text-sm text-slate-500">Select a history record.</p>
            ) : (
              <>
                <article className="rounded-xl border border-slate-200 bg-white p-4">
                  <h2 className="text-lg font-semibold text-slate-900">
                    {selected.name || "Untitled History"}
                  </h2>
                  <p className="mt-2 text-sm text-slate-700">
                    Created: {selected.created_at}
                  </p>
                  <p className="mt-1 text-sm text-slate-700">
                    CTF State Before Reset:{" "}
                    {selected?.snapshot?.state_before_reset?.status || "-"}
                  </p>
                  <p className="mt-1 text-sm text-slate-700">
                    Teams Participated: {computed.teams.length}
                  </p>
                </article>

                <article className="rounded-xl border border-slate-200 bg-white p-4">
                  <h3 className="mb-2 text-sm font-semibold uppercase tracking-[0.13em] text-slate-700">
                    Scoreboard
                  </h3>
                  <div className="overflow-hidden rounded-lg border border-slate-200">
                    <table className="min-w-full divide-y divide-slate-200">
                      <thead className="bg-white">
                        <tr>
                          <th className="px-3 py-2 text-left text-xs text-slate-500">
                            Rank
                          </th>
                          <th className="px-3 py-2 text-left text-xs text-slate-500">
                            Team
                          </th>
                          <th className="px-3 py-2 text-left text-xs text-slate-500">
                            Leader
                          </th>
                          <th className="px-3 py-2 text-left text-xs text-slate-500">
                            Score
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200 bg-slate-50/75 text-sm text-slate-800">
                        {computed.scoreboard.length === 0 ? (
                          <tr>
                            <td colSpan={4} className="px-3 py-5 text-center text-slate-500">
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

                <article className="rounded-xl border border-slate-200 bg-white p-4">
                  <h3 className="mb-2 text-sm font-semibold uppercase tracking-[0.13em] text-slate-700">
                    Individual Scores
                  </h3>
                  <div className="overflow-hidden rounded-lg border border-slate-200">
                    <table className="min-w-full divide-y divide-slate-200">
                      <thead className="bg-white">
                        <tr>
                          <th className="px-3 py-2 text-left text-xs text-slate-500">
                            User
                          </th>
                          <th className="px-3 py-2 text-left text-xs text-slate-500">
                            Score
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200 bg-slate-50/75 text-sm text-slate-800">
                        {computed.users.length === 0 ? (
                          <tr>
                            <td colSpan={2} className="px-3 py-5 text-center text-slate-500">
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

