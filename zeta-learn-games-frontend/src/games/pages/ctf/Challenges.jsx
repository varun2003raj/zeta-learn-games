import { useCallback, useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import ctfService from "../../../services/ctfService";
import api from "../../../services/api";
import Table from "../../../components/Table";
import Modal from "../../../components/Modal";
import LoadingSpinner from "../../../components/LoadingSpinner";
import ErrorState from "../../../components/ErrorState";
import EmptyState from "../../../components/EmptyState";
import {
  forceDownloadFile,
  resolveBackendFileUrl,
} from "../../../utils/fileDownload";

const defaultForm = {
  title: "",
  description: "",
  points: "",
  flag: "",
  category: "",
  difficulty: "easy",
  is_active: true,
  hint_1: "",
  hint_2: "",
  hintVisibility: "none",
};

const difficultyOptions = [
  { value: "easy", label: "Easy" },
  { value: "medium", label: "Medium" },
  { value: "hard", label: "Hard" },
  { value: "ultra_hard", label: "Ultra Hard" },
];

const categoryName = (challenge) =>
  challenge?.category_name || challenge?.category?.name || "";

const isTieBreakerChallenge = (challenge) =>
  categoryName(challenge).trim().toLowerCase() === "tie breaker";

const challengeFileValue = (challenge) =>
  challenge?.file_url || challenge?.file || "";

export default function CtfChallenges() {
  const [categories, setCategories] = useState([]);
  const [challenges, setChallenges] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [deletingChallenge, setDeletingChallenge] = useState(null);
  const [form, setForm] = useState(defaultForm);
  const [selectedFile, setSelectedFile] = useState(null);
  const [currentFileUrl, setCurrentFileUrl] = useState("");

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setError("");
      const [categoryRows, challengeRows] = await Promise.all([
        ctfService.listCategories(),
        ctfService.listChallenges(),
      ]);
      setCategories(categoryRows);
      setChallenges(challengeRows);
    } catch (errorValue) {
      setError(ctfService.withApiError(errorValue, "Unable to load CTF data"));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const visibleChallenges = useMemo(() => {
    const keyword = search.trim().toLowerCase();
    if (!keyword) return challenges;

    return challenges.filter((challenge) => {
      const title = String(challenge.title || "").toLowerCase();
      const description = String(challenge.description || "").toLowerCase();
      const category = String(categoryName(challenge)).toLowerCase();
      return (
        title.includes(keyword) ||
        description.includes(keyword) ||
        category.includes(keyword)
      );
    });
  }, [challenges, search]);

  const resetForm = () => {
    setEditingId(null);
    setForm(defaultForm);
    setSelectedFile(null);
    setCurrentFileUrl("");
  };

  const selectChallengeForEdit = (challenge) => {
    setEditingId(challenge.id);
    const h1Visible = Boolean(challenge.hint_1_visible);
    const h2Visible = Boolean(challenge.hint_2_visible);
    let hintVisibility = "none";
    if (h1Visible && h2Visible) hintVisibility = "both";
    else if (h1Visible) hintVisibility = "hint1";
    else if (h2Visible) hintVisibility = "hint2";

    setForm({
      title: challenge.title || "",
      description: challenge.description || "",
      points: challenge.points || "",
      flag: challenge.flag || "",
      category:
        String(challenge?.category?.id || challenge?.category || "") || "",
      difficulty: challenge.difficulty || "easy",
      is_active: Boolean(challenge.is_active ?? true),
      hint_1: challenge.hint_1 || "",
      hint_2: challenge.hint_2 || "",
      hintVisibility,
    });
    setCurrentFileUrl(resolveBackendFileUrl(api, challengeFileValue(challenge)));
    setSelectedFile(null);
  };

  const buildPayload = () => {
    const payload = new FormData();
    payload.append("title", form.title.trim());
    payload.append("description", form.description.trim());
    payload.append("points", String(form.points || "0"));
    payload.append("flag", form.flag.trim());
    payload.append("category", String(form.category));
    payload.append("difficulty", form.difficulty);
    payload.append("is_active", form.is_active ? "true" : "false");
    payload.append("hint_1", form.hint_1);
    payload.append("hint_2", form.hint_2);
    payload.append(
      "hint_1_visible",
      form.hintVisibility === "hint1" || form.hintVisibility === "both"
        ? "true"
        : "false"
    );
    payload.append(
      "hint_2_visible",
      form.hintVisibility === "hint2" || form.hintVisibility === "both"
        ? "true"
        : "false"
    );
    if (selectedFile) payload.append("file", selectedFile);
    return payload;
  };

  const submit = async (event) => {
    event.preventDefault();
    if (!form.category) {
      toast.error("Category is required");
      return;
    }

    try {
      setSaving(true);
      const payload = buildPayload();
      if (editingId) {
        await ctfService.updateChallenge(editingId, payload);
        toast.success("Challenge updated");
      } else {
        await ctfService.createChallenge(payload);
        toast.success("Challenge created");
      }
      resetForm();
      loadData();
    } catch (errorValue) {
      toast.error(ctfService.withApiError(errorValue, "Unable to save challenge"));
    } finally {
      setSaving(false);
    }
  };

  const removeChallenge = async () => {
    if (!deletingChallenge) return;
    try {
      await ctfService.deleteChallenge(deletingChallenge.id);
      toast.success("Challenge deleted");
      setDeletingChallenge(null);
      loadData();
    } catch (errorValue) {
      toast.error(ctfService.withApiError(errorValue, "Unable to delete challenge"));
    }
  };

  const toggleTieVisibility = async (challenge) => {
    try {
      await ctfService.toggleTieBreakerVisibility(challenge.id);
      toast.success("Tie breaker visibility updated");
      loadData();
    } catch (errorValue) {
      toast.error(
        ctfService.withApiError(errorValue, "Unable to update tie breaker visibility")
      );
    }
  };

  const handleDownloadFile = async (fileUrl, fallbackFileName) => {
    try {
      await forceDownloadFile({
        apiClient: api,
        fileUrl,
        fallbackFileName,
      });
      toast.success("File downloaded");
    } catch (errorValue) {
      toast.error(ctfService.withApiError(errorValue, "Failed to download file"));
    }
  };

  const columns = [
    {
      key: "title",
      title: "Title",
      render: (challenge) => (
        <div>
          <p className="font-semibold text-slate-900">{challenge.title}</p>
          <p className="text-xs text-slate-500">
            {(challenge.description || "").slice(0, 90) || "No description"}
          </p>
        </div>
      ),
    },
    {
      key: "category",
      title: "Category",
      render: (challenge) => categoryName(challenge) || "-",
    },
    {
      key: "difficulty",
      title: "Difficulty",
      render: (challenge) =>
        difficultyOptions.find((item) => item.value === challenge.difficulty)?.label ||
        challenge.difficulty ||
        "-",
    },
    {
      key: "points",
      title: "Points",
      render: (challenge) => challenge.points ?? 0,
    },
    {
      key: "hints",
      title: "Hints",
      render: (challenge) => {
        const h1 = Boolean(challenge.hint_1_visible);
        const h2 = Boolean(challenge.hint_2_visible);
        if (h1 && h2) return "Both";
        if (h1) return "Hint 1";
        if (h2) return "Hint 2";
        return "Hidden";
      },
    },
    {
      key: "file",
      title: "File",
      render: (challenge) => {
        const fileUrl = challengeFileValue(challenge);
        if (!fileUrl) return "-";
        return (
          <button
            type="button"
            onClick={() =>
              void handleDownloadFile(
                fileUrl,
                `${challenge.title || "challenge"}-file`
              )
            }
            className="rounded-md border border-blue-200 bg-blue-50 px-2 py-1 text-xs text-blue-700 hover:bg-blue-100"
          >
            Download
          </button>
        );
      },
    },
    {
      key: "actions",
      title: "Actions",
      render: (challenge) => (
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => selectChallengeForEdit(challenge)}
            className="rounded-lg border border-blue-200 bg-blue-50 px-2 py-1 text-xs text-blue-700 hover:bg-blue-100"
          >
            Edit
          </button>
          {isTieBreakerChallenge(challenge) ? (
            <button
              type="button"
              onClick={() => toggleTieVisibility(challenge)}
              className="rounded-lg border border-violet-200 bg-violet-500/15 px-2 py-1 text-xs text-violet-700 hover:bg-violet-500/25"
            >
              {challenge.tiebreaker_visible ? "Hide" : "Show"}
            </button>
          ) : null}
          <button
            type="button"
            onClick={() => setDeletingChallenge(challenge)}
            className="rounded-lg border border-rose-200 bg-rose-50 px-2 py-1 text-xs text-rose-700 hover:bg-rose-100"
          >
            Delete
          </button>
        </div>
      ),
    },
  ];

  if (loading && challenges.length === 0) {
    return <LoadingSpinner label="Loading CTF challenges..." />;
  }

  return (
    <section className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">CTF Challenges</h1>
        <p className="text-sm text-slate-500">
          Add and manage all CTF fields: title, description, points, flag,
          category, difficulty, hints, file, and visibility.
        </p>
      </div>

      <form
        onSubmit={submit}
        className="space-y-4 rounded-2xl border border-slate-200 bg-white/95 p-5"
      >
        <div className="grid gap-4 md:grid-cols-2">
          <label className="space-y-1 md:col-span-2">
            <span className="text-sm text-slate-700">Title</span>
            <input
              value={form.title}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, title: event.target.value }))
              }
              required
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-slate-900 outline-none focus:ring-2 focus:ring-blue-500/40"
            />
          </label>

          <label className="space-y-1 md:col-span-2">
            <span className="text-sm text-slate-700">Description</span>
            <textarea
              rows={4}
              value={form.description}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, description: event.target.value }))
              }
              required
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-slate-900 outline-none focus:ring-2 focus:ring-blue-500/40"
            />
          </label>

          <label className="space-y-1">
            <span className="text-sm text-slate-700">Points</span>
            <input
              type="number"
              min="0"
              value={form.points}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, points: event.target.value }))
              }
              required
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-slate-900 outline-none focus:ring-2 focus:ring-blue-500/40"
            />
          </label>

          <label className="space-y-1">
            <span className="text-sm text-slate-700">Flag</span>
            <input
              value={form.flag}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, flag: event.target.value }))
              }
              required
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-slate-900 outline-none focus:ring-2 focus:ring-blue-500/40"
            />
          </label>

          <label className="space-y-1">
            <span className="text-sm text-slate-700">Category</span>
            <select
              value={form.category}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, category: event.target.value }))
              }
              required
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-slate-900 outline-none focus:ring-2 focus:ring-blue-500/40"
            >
              <option value="">Select category</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </label>

          <label className="space-y-1">
            <span className="text-sm text-slate-700">Difficulty</span>
            <select
              value={form.difficulty}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, difficulty: event.target.value }))
              }
              required
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-slate-900 outline-none focus:ring-2 focus:ring-blue-500/40"
            >
              {difficultyOptions.map((difficulty) => (
                <option key={difficulty.value} value={difficulty.value}>
                  {difficulty.label}
                </option>
              ))}
            </select>
          </label>

          <label className="space-y-1">
            <span className="text-sm text-slate-700">Hint Visibility</span>
            <select
              value={form.hintVisibility}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, hintVisibility: event.target.value }))
              }
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-slate-900 outline-none focus:ring-2 focus:ring-blue-500/40"
            >
              <option value="none">No hints visible</option>
              <option value="hint1">Hint 1 only</option>
              <option value="hint2">Hint 2 only</option>
              <option value="both">Both visible</option>
            </select>
          </label>

          <label className="space-y-1">
            <span className="text-sm text-slate-700">Challenge File</span>
            <input
              type="file"
              onChange={(event) => setSelectedFile(event.target.files?.[0] || null)}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-800 file:mr-4 file:rounded-lg file:border-0 file:bg-blue-600 file:px-3 file:py-1.5 file:text-white hover:file:bg-blue-500"
            />
          </label>

          <label className="space-y-1 md:col-span-2">
            <span className="text-sm text-slate-700">Hint 1</span>
            <textarea
              rows={2}
              value={form.hint_1}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, hint_1: event.target.value }))
              }
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-slate-900 outline-none focus:ring-2 focus:ring-blue-500/40"
            />
          </label>

          <label className="space-y-1 md:col-span-2">
            <span className="text-sm text-slate-700">Hint 2</span>
            <textarea
              rows={2}
              value={form.hint_2}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, hint_2: event.target.value }))
              }
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-slate-900 outline-none focus:ring-2 focus:ring-blue-500/40"
            />
          </label>

          <label className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2">
            <input
              type="checkbox"
              checked={form.is_active}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, is_active: event.target.checked }))
              }
            />
            <span className="text-sm text-slate-800">Active challenge</span>
          </label>
        </div>

        {editingId && currentFileUrl ? (
          <div className="rounded-xl border border-slate-200 bg-slate-50/80 p-3 text-sm text-slate-700">
            Current file:
            <a
              href={currentFileUrl}
              target="_blank"
              rel="noreferrer"
              className="ml-2 text-sky-700 underline"
            >
              Open file
            </a>
            <button
              type="button"
              onClick={() =>
                void handleDownloadFile(
                  currentFileUrl,
                  `${form.title || "challenge"}-file`
                )
              }
              className="ml-3 rounded-md border border-blue-200 bg-blue-50 px-2 py-1 text-xs text-blue-700 hover:bg-blue-100"
            >
              Download
            </button>
          </div>
        ) : null}

        <div className="flex justify-end gap-2">
          {editingId ? (
            <button
              type="button"
              onClick={resetForm}
              className="rounded-lg border border-slate-300 px-4 py-2 text-sm text-slate-900 hover:bg-slate-50"
            >
              Cancel Edit
            </button>
          ) : null}
          <button
            type="submit"
            disabled={saving}
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-500 disabled:opacity-60"
          >
            {saving
              ? "Saving..."
              : editingId
              ? "Update Challenge"
              : "Add Challenge"}
          </button>
        </div>
      </form>

      <div className="rounded-2xl border border-slate-200 bg-white/92 p-4">
        <input
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search title, description, category..."
          className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 outline-none focus:ring-2 focus:ring-blue-500/40"
        />
      </div>

      {error ? <ErrorState message={error} onRetry={loadData} /> : null}

      <Table
        columns={columns}
        data={visibleChallenges}
        loading={loading}
        emptyMessage="No CTF challenges found."
      />

      {!loading && visibleChallenges.length === 0 && !error ? (
        <EmptyState
          title="No CTF challenges"
          description="Create a challenge using the form above."
        />
      ) : null}

      <Modal
        isOpen={Boolean(deletingChallenge)}
        title="Delete Challenge"
        description={`Delete "${deletingChallenge?.title || ""}"?`}
        confirmText="Delete"
        onCancel={() => setDeletingChallenge(null)}
        onConfirm={removeChallenge}
      />
    </section>
  );
}
