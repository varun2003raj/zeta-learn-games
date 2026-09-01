import { useCallback, useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import ctfService from "../../../services/ctfService";
import LoadingSpinner from "../../../components/LoadingSpinner";
import ErrorState from "../../../components/ErrorState";
import EmptyState from "../../../components/EmptyState";

const getMode = (challenge) => {
  const hint1Visible = Boolean(challenge.hint_1_visible);
  const hint2Visible = Boolean(challenge.hint_2_visible);
  if (hint1Visible && hint2Visible) return "both";
  if (hint1Visible) return "hint1";
  if (hint2Visible) return "hint2";
  return "none";
};

export default function CtfHints() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError("");
      const data = await ctfService.listChallenges();
      setRows(Array.isArray(data) ? data : []);
    } catch (errorValue) {
      setError(ctfService.withApiError(errorValue, "Unable to load hints"));
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
    return rows.filter((row) => {
      const title = String(row?.title || "").toLowerCase();
      const category = String(row?.category_name || "").toLowerCase();
      return title.includes(query) || category.includes(query);
    });
  }, [rows, search]);

  const patchChallenge = async (id, payload, successMessage = "") => {
    try {
      const formData = new FormData();
      Object.entries(payload).forEach(([key, value]) => {
        formData.append(key, value ?? "");
      });

      await ctfService.updateChallenge(id, formData);
      if (successMessage) toast.success(successMessage);
      setRows((prev) =>
        prev.map((item) => (item.id === id ? { ...item, ...payload } : item))
      );
    } catch (errorValue) {
      toast.error(ctfService.withApiError(errorValue, "Unable to update hint"));
      load();
    }
  };

  if (loading && rows.length === 0) {
    return <LoadingSpinner label="Loading hints..." />;
  }

  return (
    <section className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">CTF Hints</h1>
        <p className="text-sm text-slate-500">
          Manage hint text and visibility for each challenge.
        </p>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white/92 p-4">
        <input
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search challenge title or category..."
          className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 outline-none focus:ring-2 focus:ring-blue-500/40"
        />
      </div>

      {error ? <ErrorState message={error} onRetry={load} /> : null}

      {!loading && filtered.length === 0 ? (
        <EmptyState
          title="No challenge hints found"
          description="Add CTF challenges first, then configure hints here."
        />
      ) : null}

      <div className="grid gap-4 xl:grid-cols-2">
        {filtered.map((challenge) => (
          <article
            key={challenge.id}
            className="rounded-2xl border border-slate-200 bg-white/95 p-4"
          >
            <h2 className="text-lg font-semibold text-slate-900">{challenge.title}</h2>
            <p className="mt-1 text-xs uppercase tracking-[0.12em] text-slate-500">
              {challenge.category_name || "Uncategorized"}
            </p>

            <div className="mt-3 space-y-2">
              <label className="space-y-1 text-sm text-slate-700">
                <span>Hint 1</span>
                <textarea
                  rows={3}
                  value={challenge.hint_1 || ""}
                  onChange={(event) =>
                    setRows((prev) =>
                      prev.map((row) =>
                        row.id === challenge.id
                          ? { ...row, hint_1: event.target.value }
                          : row
                      )
                    )
                  }
                  onBlur={(event) =>
                    patchChallenge(challenge.id, { hint_1: event.target.value })
                  }
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 outline-none focus:ring-2 focus:ring-blue-500/40"
                />
              </label>

              <label className="space-y-1 text-sm text-slate-700">
                <span>Hint 2</span>
                <textarea
                  rows={3}
                  value={challenge.hint_2 || ""}
                  onChange={(event) =>
                    setRows((prev) =>
                      prev.map((row) =>
                        row.id === challenge.id
                          ? { ...row, hint_2: event.target.value }
                          : row
                      )
                    )
                  }
                  onBlur={(event) =>
                    patchChallenge(challenge.id, { hint_2: event.target.value })
                  }
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 outline-none focus:ring-2 focus:ring-blue-500/40"
                />
              </label>

              <label className="space-y-1 text-sm text-slate-700">
                <span>Visibility</span>
                <select
                  value={getMode(challenge)}
                  onChange={(event) => {
                    const value = event.target.value;
                    patchChallenge(
                      challenge.id,
                      {
                        hint_1_visible: value === "hint1" || value === "both",
                        hint_2_visible: value === "hint2" || value === "both",
                      },
                      "Hint visibility updated"
                    );
                  }}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 outline-none focus:ring-2 focus:ring-blue-500/40"
                >
                  <option value="none">No Hints Visible</option>
                  <option value="hint1">Show Hint 1 Only</option>
                  <option value="hint2">Show Hint 2 Only</option>
                  <option value="both">Show Both Hints</option>
                </select>
              </label>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

