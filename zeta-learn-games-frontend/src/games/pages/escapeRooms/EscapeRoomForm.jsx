import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import toast from "react-hot-toast";
import escapeService from "../../../services/escapeService";
import LoadingSpinner from "../../../components/LoadingSpinner";
import { difficultyOptions } from "../../../utils/admin";

const defaultForm = {
  title: "",
  description: "",
  difficulty: "Easy",
  time_limit_minutes: 5,
  room_key: "",
  is_active: true,
};

export default function EscapeRoomForm() {
  const { roomId } = useParams();
  const navigate = useNavigate();
  const isEdit = Boolean(roomId);

  const [form, setForm] = useState(defaultForm);
  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const [isFirstRoom, setIsFirstRoom] = useState(true);

  useEffect(() => {
    if (!isEdit) return;

    const loadRoom = async () => {
      try {
        setLoading(true);
        const room = await escapeService.getRoom(roomId);
        setForm({
          title: room.title || "",
          description: room.description || "",
          difficulty: room.difficulty || "Easy",
          time_limit_minutes: Number(room.time_limit_minutes ?? 5),
          room_key: room.room_key || "",
          is_active: Boolean(room.is_active ?? room.is_published ?? true),
        });
      } catch (error) {
        toast.error(
          error?.response?.data?.detail ||
            error?.response?.data?.error ||
            "Unable to load room"
        );
      } finally {
        setLoading(false);
      }
    };

    loadRoom();
  }, [isEdit, roomId]);

  useEffect(() => {
    if (isEdit) return;

    const loadRoomContext = async () => {
      try {
        const rooms = await escapeService.listAllRooms();
        setIsFirstRoom((rooms || []).length === 0);
      } catch {
        setIsFirstRoom(true);
      }
    };

    void loadRoomContext();
  }, [isEdit]);

  const titleText = useMemo(
    () => (isEdit ? "Edit Escape Room" : "Create Escape Room"),
    [isEdit]
  );

  const handleSubmit = async (event) => {
    event.preventDefault();
    try {
      setSaving(true);
      const normalizedRoomKey = String(form.room_key || "").trim();
      if (!isEdit && !isFirstRoom && !normalizedRoomKey) {
        toast.error("Room key is required from Room 2 onward.");
        return;
      }
      const payload = {
        ...form,
        time_limit_minutes: Number(form.time_limit_minutes || 0),
        is_active: Boolean(form.is_active),
      };

      if (isEdit) {
        if (normalizedRoomKey) {
          payload.room_key = normalizedRoomKey;
        } else {
          delete payload.room_key;
        }
      } else {
        payload.room_key = isFirstRoom ? "" : normalizedRoomKey;
      }

      if (isEdit) {
        await escapeService.updateRoom(roomId, payload);
        toast.success("Escape room updated");
      } else {
        await escapeService.createRoom(payload);
        toast.success("Escape room created");
      }

      navigate("/games/escape-rooms");
    } catch (error) {
      toast.error(
        error?.response?.data?.detail ||
          error?.response?.data?.error ||
          "Unable to save room"
      );
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <LoadingSpinner label="Loading room data..." />;
  }

  return (
    <section className="mx-auto max-w-4xl space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">{titleText}</h1>
          <p className="text-sm text-slate-500">
            Manage metadata and publishing state.
          </p>
        </div>
        <Link
          to="/games/escape-rooms"
          className="rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 hover:bg-slate-50"
        >
          Back to List
        </Link>
      </div>

      <form
        onSubmit={handleSubmit}
        className="space-y-4 rounded-2xl border border-slate-200 bg-white/95 p-5"
      >
        <div className="grid gap-4 md:grid-cols-2">
          <label className="space-y-1 md:col-span-2">
            <span className="text-sm text-slate-700">Title</span>
            <input
              required
              value={form.title}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, title: event.target.value }))
              }
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-slate-900 outline-none focus:ring-2 focus:ring-blue-500/40"
              placeholder="Cyber Escape"
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
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-slate-900 outline-none focus:ring-2 focus:ring-blue-500/40"
              placeholder="Hack the system"
            />
          </label>

          <label className="space-y-1">
            <span className="text-sm text-slate-700">Difficulty</span>
            <select
              value={form.difficulty}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, difficulty: event.target.value }))
              }
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-slate-900 outline-none focus:ring-2 focus:ring-blue-500/40"
            >
              {difficultyOptions.map((difficulty) => (
                <option key={difficulty} value={difficulty}>
                  {difficulty}
                </option>
              ))}
            </select>
          </label>

          <label className="space-y-1">
            <span className="text-sm text-slate-700">Time Limit (minutes)</span>
            <input
              type="number"
              min="1"
              value={form.time_limit_minutes}
              onChange={(event) =>
                setForm((prev) => ({
                  ...prev,
                  time_limit_minutes: Number(event.target.value),
                }))
              }
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-slate-900 outline-none focus:ring-2 focus:ring-blue-500/40"
            />
          </label>

          <label className="space-y-1 md:col-span-2">
            <span className="text-sm text-slate-700">
              Room Key {isEdit ? "(optional)" : isFirstRoom ? "(not needed for first room)" : "(required)"}
            </span>
            <input
              value={form.room_key}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, room_key: event.target.value }))
              }
              disabled={!isEdit && isFirstRoom}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-slate-900 outline-none focus:ring-2 focus:ring-blue-500/40 disabled:cursor-not-allowed disabled:opacity-60"
              placeholder={
                !isEdit && isFirstRoom
                  ? "First room does not require a key"
                  : "Enter room key"
              }
            />
          </label>

          <label className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2">
            <input
              type="checkbox"
              checked={form.is_active}
              onChange={(event) =>
                setForm((prev) => ({
                  ...prev,
                  is_active: event.target.checked,
                }))
              }
            />
            <span className="text-sm text-slate-800">Active room</span>
          </label>
        </div>

        <div className="flex justify-end gap-2">
          <Link
            to="/games/escape-rooms"
            className="rounded-lg border border-slate-300 px-4 py-2 text-sm text-slate-900 hover:bg-slate-50"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={saving}
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-500 disabled:opacity-60"
          >
            {saving ? "Saving..." : isEdit ? "Update Room" : "Create Room"}
          </button>
        </div>
      </form>
    </section>
  );
}

