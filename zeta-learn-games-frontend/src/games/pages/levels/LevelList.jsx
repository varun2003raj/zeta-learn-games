import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import toast from "react-hot-toast";
import escapeService from "../../../services/escapeService";
import Table from "../../../components/Table";
import Modal from "../../../components/Modal";
import LoadingSpinner from "../../../components/LoadingSpinner";
import ErrorState from "../../../components/ErrorState";
import EmptyState from "../../../components/EmptyState";

const buildLevelPayload = (level, roomId, order) => ({
  escape_room: Number(roomId),
  level_number: Number(level.level_number || 1),
  title: level.title || "",
  description: level.description || "",
  points: Number(level.points || 0),
  order: Number(order),
  is_active: Boolean(level.is_active ?? true),
});

export default function LevelList() {
  const { roomId } = useParams();
  const [room, setRoom] = useState(null);
  const [levels, setLevels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [deletingLevel, setDeletingLevel] = useState(null);
  const [draggedLevelId, setDraggedLevelId] = useState(null);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setError("");
      const [roomValue, levelCollection] = await Promise.all([
        escapeService.getRoom(roomId),
        escapeService.listLevelsByRoom(roomId),
      ]);
      const sorted = [...levelCollection.results].sort(
        (a, b) => Number(a.order || 0) - Number(b.order || 0)
      );
      setRoom(roomValue);
      setLevels(sorted);
    } catch (errorValue) {
      setError(
        errorValue?.response?.data?.detail ||
          errorValue?.response?.data?.error ||
          "Unable to load levels"
      );
    } finally {
      setLoading(false);
    }
  }, [roomId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const persistOrder = async (nextLevels) => {
    const updates = nextLevels.map((level, index) =>
      escapeService.updateLevel(
        level.id,
        buildLevelPayload(level, roomId, index + 1)
      )
    );
    await Promise.all(updates);
  };

  const reorder = async (targetId) => {
    if (!draggedLevelId || draggedLevelId === targetId) return;
    const sourceIndex = levels.findIndex((level) => level.id === draggedLevelId);
    const targetIndex = levels.findIndex((level) => level.id === targetId);
    if (sourceIndex === -1 || targetIndex === -1) return;

    const next = [...levels];
    const [moved] = next.splice(sourceIndex, 1);
    next.splice(targetIndex, 0, moved);
    setLevels(next);

    try {
      await persistOrder(next);
      toast.success("Level order updated");
    } catch (errorValue) {
      toast.error(
        errorValue?.response?.data?.detail ||
          errorValue?.response?.data?.error ||
          "Unable to save level order"
      );
      loadData();
    }
  };

  const onDeleteLevel = async () => {
    if (!deletingLevel) return;
    try {
      await escapeService.deleteLevel(deletingLevel.id);
      toast.success("Level deleted");
      setDeletingLevel(null);
      loadData();
    } catch (errorValue) {
      toast.error(
        errorValue?.response?.data?.detail ||
          errorValue?.response?.data?.error ||
          "Unable to delete level"
      );
    }
  };

  const columns = useMemo(
    () => [
      {
        key: "drag",
        title: "Drag",
        render: () => (
          <span className="cursor-grab text-xs text-slate-500">Drag</span>
        ),
      },
      {
        key: "level_number",
        title: "Order",
        render: (level) => level.order ?? level.level_number ?? "-",
      },
      {
        key: "title",
        title: "Title",
      },
      {
        key: "points",
        title: "Points",
      },
      {
        key: "questions",
        title: "Hints",
        render: (level) => level.questions_count ?? level.question_count ?? "-",
      },
      {
        key: "is_active",
        title: "Status",
        render: (level) => (
          <span
            className={`rounded-full border px-2 py-1 text-xs ${
              level.is_active
                ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                : "border-slate-500/40 bg-slate-500/20 text-slate-800"
            }`}
          >
            {level.is_active ? "Active" : "Inactive"}
          </span>
        ),
      },
      {
        key: "actions",
        title: "Actions",
        render: (level) => (
          <div className="flex flex-wrap gap-2">
            <Link
              to={`/games/levels/${level.id}/questions`}
              className="rounded-lg border border-slate-300 px-2 py-1 text-xs text-slate-900 hover:bg-slate-50"
            >
              Hints
            </Link>
            <Link
              to={`/games/levels/${level.id}/edit`}
              className="rounded-lg border border-blue-200 bg-blue-50 px-2 py-1 text-xs text-blue-700 hover:bg-blue-100"
            >
              Edit
            </Link>
            <button
              type="button"
              onClick={() => setDeletingLevel(level)}
              className="rounded-lg border border-rose-200 bg-rose-50 px-2 py-1 text-xs text-rose-700 hover:bg-rose-100"
            >
              Delete
            </button>
          </div>
        ),
      },
    ],
    []
  );

  if (loading) {
    return <LoadingSpinner label="Loading levels..." />;
  }

  if (error) {
    return <ErrorState message={error} onRetry={loadData} />;
  }

  return (
    <section className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-[0.16em] text-slate-500">
            Escape Room
          </p>
          <h1 className="text-2xl font-semibold text-slate-900">
            {room?.title || "Puzzles"}
          </h1>
        </div>
        <div className="flex gap-2">
          <Link
            to="/games/escape-rooms"
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 hover:bg-slate-50"
          >
            Back
          </Link>
          <Link
            to={`/games/escape-rooms/${roomId}/levels/new`}
            className="rounded-lg bg-blue-600 px-3 py-2 text-sm font-semibold text-white hover:bg-blue-500"
          >
            Create Puzzle
          </Link>
        </div>
      </div>

      {levels.length === 0 ? (
        <EmptyState
          title="No puzzles available"
          description="Create the first puzzle for this escape room."
          action={
            <Link
              to={`/games/escape-rooms/${roomId}/levels/new`}
              className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-500"
            >
              Add Puzzle
            </Link>
          }
        />
      ) : (
        <div className="overflow-hidden rounded-2xl border border-slate-200">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200">
              <thead className="bg-white">
                <tr>
                  {columns.map((column) => (
                    <th
                      key={column.key}
                      className="px-4 py-3 text-left text-xs uppercase tracking-[0.16em] text-slate-500"
                    >
                      {column.title}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 bg-slate-50/75 text-sm text-slate-800">
                {levels.map((level) => (
                  <tr
                    key={level.id}
                    draggable
                    onDragStart={() => setDraggedLevelId(level.id)}
                    onDragOver={(event) => event.preventDefault()}
                    onDrop={() => reorder(level.id)}
                    className="cursor-move"
                  >
                    {columns.map((column) => (
                      <td key={`${column.key}-${level.id}`} className="px-4 py-3">
                        {column.render ? column.render(level) : level[column.key]}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <Modal
        isOpen={Boolean(deletingLevel)}
        title="Delete Level"
        description={`Delete level "${deletingLevel?.title || ""}"?`}
        confirmText="Delete"
        onCancel={() => setDeletingLevel(null)}
        onConfirm={onDeleteLevel}
      />
    </section>
  );
}

