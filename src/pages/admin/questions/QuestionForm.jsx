import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import toast from "react-hot-toast";
import escapeService from "../../../services/escapeService";
import LoadingSpinner from "../../../components/LoadingSpinner";

const defaultForm = {
  text: "",
  penalty_points: 2,
};

export default function QuestionForm() {
  const { levelId, questionId } = useParams();
  const navigate = useNavigate();
  const isEdit = Boolean(questionId);

  const [form, setForm] = useState(defaultForm);
  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const [targetLevelId, setTargetLevelId] = useState(levelId || "");

  useEffect(() => {
    if (!isEdit) return;

    const loadHint = async () => {
      try {
        setLoading(true);
        const hint = await escapeService.getQuestion(questionId);
        const resolvedPuzzleId = hint.puzzle || hint.level || levelId || "";
        setTargetLevelId(String(resolvedPuzzleId));
        setForm({
          text: hint.text || hint.question_text || "",
          penalty_points: Number(hint.penalty_points ?? hint.points ?? 2),
        });
      } catch (error) {
        toast.error(
          error?.response?.data?.detail ||
            error?.response?.data?.error ||
            "Unable to load hint"
        );
      } finally {
        setLoading(false);
      }
    };

    loadHint();
  }, [isEdit, questionId, levelId]);

  const backPath = useMemo(
    () => `/admin/levels/${targetLevelId || levelId}/questions`,
    [targetLevelId, levelId]
  );

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!targetLevelId) {
      toast.error("Puzzle id is missing");
      return;
    }

    const payload = {
      level: Number(targetLevelId),
      text: form.text,
      penalty_points: Number(form.penalty_points || 0),
    };

    try {
      setSaving(true);
      if (isEdit) {
        await escapeService.updateQuestion(questionId, payload);
        toast.success("Hint updated");
      } else {
        await escapeService.createQuestion(payload);
        toast.success("Hint created");
      }
      navigate(backPath);
    } catch (error) {
      toast.error(
        error?.response?.data?.detail ||
          error?.response?.data?.error ||
          "Unable to save hint"
      );
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <LoadingSpinner label="Loading hint..." />;
  }

  return (
    <section className="mx-auto max-w-4xl space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-slate-100">
            {isEdit ? "Edit Hint" : "Create Hint"}
          </h1>
          <p className="text-sm text-slate-400">
            Configure hint text and penalty points for this puzzle.
          </p>
        </div>
        <Link
          to={backPath}
          className="rounded-lg border border-slate-600 px-3 py-2 text-sm text-slate-100 hover:bg-slate-800"
        >
          Back
        </Link>
      </div>

      <form
        onSubmit={handleSubmit}
        className="space-y-4 rounded-2xl border border-slate-800 bg-slate-900/70 p-5"
      >
        <label className="space-y-1">
          <span className="text-sm text-slate-300">Hint Text</span>
          <textarea
            rows={5}
            required
            value={form.text}
            onChange={(event) =>
              setForm((prev) => ({ ...prev, text: event.target.value }))
            }
            className="w-full rounded-xl border border-slate-700 bg-slate-800 px-3 py-2 text-slate-100 outline-none focus:ring-2 focus:ring-blue-500/40"
            placeholder="Use browser developer tools to inspect clues."
          />
        </label>

        <label className="space-y-1">
          <span className="text-sm text-slate-300">Penalty Points</span>
          <input
            type="number"
            min="0"
            value={form.penalty_points}
            onChange={(event) =>
              setForm((prev) => ({
                ...prev,
                penalty_points: Number(event.target.value),
              }))
            }
            className="w-full rounded-xl border border-slate-700 bg-slate-800 px-3 py-2 text-slate-100 outline-none focus:ring-2 focus:ring-blue-500/40"
          />
        </label>

        <div className="flex justify-end gap-2">
          <Link
            to={backPath}
            className="rounded-lg border border-slate-600 px-4 py-2 text-sm text-slate-100 hover:bg-slate-800"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={saving}
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-500 disabled:opacity-60"
          >
            {saving ? "Saving..." : isEdit ? "Update Hint" : "Create Hint"}
          </button>
        </div>
      </form>
    </section>
  );
}

