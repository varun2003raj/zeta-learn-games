import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import toast from "react-hot-toast";
import escapeService from "../../../services/escapeService";
import LoadingSpinner from "../../../components/LoadingSpinner";

const defaultForm = {
  level_number: 1,
  title: "",
  description: "",
  answer: "",
  points: 10,
  order: 1,
  is_active: true,
};

export default function LevelForm() {
  const { roomId, levelId } = useParams();
  const navigate = useNavigate();
  const isEdit = Boolean(levelId);

  const [form, setForm] = useState(defaultForm);
  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const [targetRoomId, setTargetRoomId] = useState(roomId || "");

  useEffect(() => {
    if (!isEdit) return;

    const loadLevel = async () => {
      try {
        setLoading(true);
        const level = await escapeService.getLevel(levelId);
        const roomValue =
          level.escape_room?.id || level.escape_room || level.room || roomId || "";
        setTargetRoomId(String(roomValue));
        setForm({
          level_number: Number(level.level_number ?? 1),
          title: level.title || "",
          description: level.description || "",
          answer: "",
          points: Number(level.points ?? 10),
          order: Number(level.order ?? 1),
          is_active: Boolean(level.is_active ?? true),
        });
      } catch (error) {
        toast.error(
          error?.response?.data?.detail ||
            error?.response?.data?.error ||
            "Unable to load level"
        );
      } finally {
        setLoading(false);
      }
    };

    loadLevel();
  }, [isEdit, levelId, roomId]);

  const backPath = useMemo(() => {
    if (!targetRoomId) return "/admin/escape-rooms";
    return `/admin/escape-rooms/${targetRoomId}/levels`;
  }, [targetRoomId]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!targetRoomId) {
      toast.error("Escape room id is missing");
      return;
    }

    const payload = {
      escape_room: Number(targetRoomId),
      level_number: Number(form.level_number || 1),
      title: form.title,
      description: form.description,
      answer: form.answer,
      points: Number(form.points || 0),
      order: Number(form.order || 1),
      is_active: Boolean(form.is_active),
    };

    try {
      setSaving(true);
      if (isEdit) {
        await escapeService.updateLevel(levelId, payload);
        toast.success("Level updated");
      } else {
        await escapeService.createLevel(payload);
        toast.success("Level created");
      }
      navigate(backPath);
    } catch (error) {
      toast.error(
        error?.response?.data?.detail ||
          error?.response?.data?.error ||
          "Unable to save level"
      );
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <LoadingSpinner label="Loading level..." />;
  }

  return (
    <section className="mx-auto max-w-3xl space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-100">
            {isEdit ? "Edit Puzzle" : "Create Puzzle"}
          </h1>
          <p className="text-sm text-slate-400">Configure puzzle order, answer, and points.</p>
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
        <div className="grid gap-4 md:grid-cols-2">
          <label className="space-y-1">
            <span className="text-sm text-slate-300">Level Number</span>
            <input
              type="number"
              min="1"
              max="5"
              value={form.level_number}
              onChange={(event) =>
                setForm((prev) => ({
                  ...prev,
                  level_number: Number(event.target.value),
                }))
              }
              className="w-full rounded-xl border border-slate-700 bg-slate-800 px-3 py-2 text-slate-100 outline-none focus:ring-2 focus:ring-blue-500/40"
            />
          </label>

          <label className="space-y-1">
            <span className="text-sm text-slate-300">Order</span>
            <input
              type="number"
              min="1"
              max="5"
              value={form.order}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, order: Number(event.target.value) }))
              }
              className="w-full rounded-xl border border-slate-700 bg-slate-800 px-3 py-2 text-slate-100 outline-none focus:ring-2 focus:ring-blue-500/40"
            />
          </label>

          <label className="space-y-1 md:col-span-2">
            <span className="text-sm text-slate-300">Title</span>
            <input
              required
              value={form.title}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, title: event.target.value }))
              }
              className="w-full rounded-xl border border-slate-700 bg-slate-800 px-3 py-2 text-slate-100 outline-none focus:ring-2 focus:ring-blue-500/40"
              placeholder="Find Hidden Clue"
            />
          </label>

          <label className="space-y-1 md:col-span-2">
            <span className="text-sm text-slate-300">Description</span>
            <textarea
              rows={4}
              value={form.description}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, description: event.target.value }))
              }
              className="w-full rounded-xl border border-slate-700 bg-slate-800 px-3 py-2 text-slate-100 outline-none focus:ring-2 focus:ring-blue-500/40"
              placeholder="Inspect the page"
            />
          </label>

          <label className="space-y-1 md:col-span-2">
            <span className="text-sm text-slate-300">
              Answer {isEdit ? "(leave blank to keep current)" : ""}
            </span>
            <input
              required={!isEdit}
              value={form.answer}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, answer: event.target.value }))
              }
              className="w-full rounded-xl border border-slate-700 bg-slate-800 px-3 py-2 text-slate-100 outline-none focus:ring-2 focus:ring-blue-500/40"
              placeholder="Correct puzzle answer"
            />
          </label>

          <label className="space-y-1">
            <span className="text-sm text-slate-300">Points</span>
            <input
              type="number"
              min="0"
              value={form.points}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, points: Number(event.target.value) }))
              }
              className="w-full rounded-xl border border-slate-700 bg-slate-800 px-3 py-2 text-slate-100 outline-none focus:ring-2 focus:ring-blue-500/40"
            />
          </label>

          <label className="flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-800 px-3 py-2">
            <input
              type="checkbox"
              checked={form.is_active}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, is_active: event.target.checked }))
              }
            />
            <span className="text-sm text-slate-200">Active puzzle</span>
          </label>
        </div>

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
            {saving ? "Saving..." : isEdit ? "Update Puzzle" : "Create Puzzle"}
          </button>
        </div>
      </form>
    </section>
  );
}
