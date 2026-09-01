import { useCallback, useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import toast from "react-hot-toast";
import escapeService from "../../../services/escapeService";
import Table from "../../../components/Table";
import Modal from "../../../components/Modal";
import LoadingSpinner from "../../../components/LoadingSpinner";
import ErrorState from "../../../components/ErrorState";
import EmptyState from "../../../components/EmptyState";
import { truncate } from "../../../utils/admin";

export default function QuestionList() {
  const { levelId } = useParams();
  const [puzzle, setPuzzle] = useState(null);
  const [hints, setHints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [deletingHint, setDeletingHint] = useState(null);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setError("");
      const [puzzleData, hintCollection] = await Promise.all([
        escapeService.getLevel(levelId),
        escapeService.listQuestionsByLevel(levelId),
      ]);
      setPuzzle(puzzleData);
      setHints(hintCollection.results);
    } catch (errorValue) {
      setError(
        errorValue?.response?.data?.detail ||
          errorValue?.response?.data?.error ||
          "Unable to load hints"
      );
    } finally {
      setLoading(false);
    }
  }, [levelId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const onDeleteHint = async () => {
    if (!deletingHint) return;
    try {
      await escapeService.deleteQuestion(deletingHint.id);
      toast.success("Hint deleted");
      setDeletingHint(null);
      loadData();
    } catch (errorValue) {
      toast.error(
        errorValue?.response?.data?.detail ||
          errorValue?.response?.data?.error ||
          "Unable to delete hint"
      );
    }
  };

  const columns = [
    {
      key: "text",
      title: "Hint Text",
      render: (hint) => truncate(hint.text || hint.question_text, 120),
    },
    {
      key: "penalty_points",
      title: "Penalty Points",
      render: (hint) => hint.penalty_points ?? hint.points ?? 0,
    },
    {
      key: "actions",
      title: "Actions",
      render: (hint) => (
        <div className="flex flex-wrap gap-2">
          <Link
            to={`/games/questions/${hint.id}/edit`}
            className="rounded-lg border border-blue-200 bg-blue-50 px-2 py-1 text-xs text-blue-700 hover:bg-blue-100"
          >
            Edit
          </Link>
          <button
            type="button"
            onClick={() => setDeletingHint(hint)}
            className="rounded-lg border border-rose-200 bg-rose-50 px-2 py-1 text-xs text-rose-700 hover:bg-rose-100"
          >
            Delete
          </button>
        </div>
      ),
    },
  ];

  if (loading) {
    return <LoadingSpinner label="Loading hints..." />;
  }

  if (error) {
    return <ErrorState message={error} onRetry={loadData} />;
  }

  return (
    <section className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-[0.16em] text-slate-500">
            Puzzle
          </p>
          <h1 className="text-2xl font-semibold text-slate-900">
            {puzzle?.title || "Hints"}
          </h1>
        </div>
        <div className="flex gap-2">
          <Link
            to={`/games/escape-rooms/${puzzle?.room || ""}/levels`}
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 hover:bg-slate-50"
          >
            Back to Puzzles
          </Link>
          <Link
            to={`/games/levels/${levelId}/questions/new`}
            className="rounded-lg bg-blue-600 px-3 py-2 text-sm font-semibold text-white hover:bg-blue-500"
          >
            Create Hint
          </Link>
        </div>
      </div>

      {hints.length === 0 ? (
        <EmptyState
          title="No hints yet"
          description="Add your first hint for this puzzle."
          action={
            <Link
              to={`/games/levels/${levelId}/questions/new`}
              className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-500"
            >
              Add Hint
            </Link>
          }
        />
      ) : (
        <Table
          columns={columns}
          data={hints}
          loading={loading}
          emptyMessage="No hints found."
        />
      )}

      <Modal
        isOpen={Boolean(deletingHint)}
        title="Delete Hint"
        description="This hint will be removed permanently."
        confirmText="Delete"
        onCancel={() => setDeletingHint(null)}
        onConfirm={onDeleteHint}
      />
    </section>
  );
}

