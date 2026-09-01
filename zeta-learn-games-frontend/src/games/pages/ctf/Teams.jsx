import { useCallback, useEffect, useMemo, useState } from "react";
import ctfService from "../../../services/ctfService";
import LoadingSpinner from "../../../components/LoadingSpinner";
import ErrorState from "../../../components/ErrorState";
import EmptyState from "../../../components/EmptyState";

export default function CtfTeams() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError("");
      const data = await ctfService.listTeams();
      setRows(Array.isArray(data) ? data : []);
    } catch (errorValue) {
      setError(ctfService.withApiError(errorValue, "Unable to load teams"));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return rows;
    return rows.filter((entry) => {
      const team = String(entry?.team?.name || "").toLowerCase();
      const leader = String(entry?.team?.leader_name || "").toLowerCase();
      const code = String(entry?.team?.code || "").toLowerCase();
      return (
        team.includes(query) || leader.includes(query) || code.includes(query)
      );
    });
  }, [rows, search]);

  if (loading && rows.length === 0) {
    return <LoadingSpinner label="Loading teams..." />;
  }

  return (
    <section className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">CTF Teams</h1>
        <p className="text-sm text-slate-500">
          View all teams and member contributions.
        </p>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white/92 p-4">
        <input
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search team, leader, or team code..."
          className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 outline-none focus:ring-2 focus:ring-blue-500/40"
        />
      </div>

      {error ? <ErrorState message={error} onRetry={load} /> : null}

      {!loading && filtered.length === 0 ? (
        <EmptyState
          title="No teams found"
          description="No team data matches your search."
        />
      ) : null}

      <div className="space-y-4">
        {filtered.map((entry) => (
          <article
            key={entry?.team?.id || entry?.team?.code}
            className="rounded-2xl border border-slate-200 bg-white/95 p-4"
          >
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-semibold text-slate-900">
                  {entry?.team?.name || "-"}
                </h2>
                <p className="text-sm text-slate-500">
                  Leader: {entry?.team?.leader_name || "-"} | Code:{" "}
                  {entry?.team?.code || "-"}
                </p>
              </div>
              <span className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-sm font-semibold text-emerald-700">
                {entry?.team?.score ?? 0} pts
              </span>
            </div>

            <div className="mt-3 overflow-hidden rounded-xl border border-slate-200">
              <table className="min-w-full divide-y divide-slate-200">
                <thead className="bg-white">
                  <tr>
                    <th className="px-3 py-2 text-left text-xs uppercase tracking-[0.14em] text-slate-500">
                      Member
                    </th>
                    <th className="px-3 py-2 text-left text-xs uppercase tracking-[0.14em] text-slate-500">
                      Solved
                    </th>
                    <th className="px-3 py-2 text-left text-xs uppercase tracking-[0.14em] text-slate-500">
                      Points
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 bg-slate-50/75 text-sm text-slate-800">
                  {(entry?.member_contributions || []).length === 0 ? (
                    <tr>
                      <td colSpan={3} className="px-3 py-4 text-center text-slate-500">
                        No member contribution data.
                      </td>
                    </tr>
                  ) : (
                    (entry.member_contributions || []).map((member) => (
                      <tr key={member?.user_id || member?.username}>
                        <td className="px-3 py-2">{member?.username || "-"}</td>
                        <td className="px-3 py-2">{member?.solved_count ?? 0}</td>
                        <td className="px-3 py-2">{member?.total_points ?? 0}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

