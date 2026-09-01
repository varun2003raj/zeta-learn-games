import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import toast from "react-hot-toast";
import Table from "../../../components/Table";
import Modal from "../../../components/Modal";
import ErrorState from "../../../components/ErrorState";
import EmptyState from "../../../components/EmptyState";
import escapeService from "../../../services/escapeService";
import {
  fetchEscapeRooms,
  setRoomQuery,
  clearRoomError,
} from "../../../store/escapeSlice";
import { difficultyOptions, statusBadgeClass } from "../../../utils/admin";
import { showConfirm } from "../../../utils/popup";

const getRoomPayload = (room, nextPublishState) => ({
  title: room.title || "",
  description: room.description || "",
  difficulty: room.difficulty || "Easy",
  time_limit_minutes: Number(room.time_limit_minutes || 0),
  is_active: nextPublishState,
});

export default function EscapeRoomList() {
  const dispatch = useDispatch();
  const { rooms, roomQuery, roomMeta, loading, error } = useSelector(
    (state) => state.escape
  );

  const [searchInput, setSearchInput] = useState(roomQuery.search);
  const [deletingRoom, setDeletingRoom] = useState(null);
  const [actionLoadingId, setActionLoadingId] = useState(null);
  const [controlState, setControlState] = useState({
    status: "draft",
    started_at: null,
    finished_at: null,
    updated_at: null,
  });
  const [controlLoading, setControlLoading] = useState(false);
  const [controlError, setControlError] = useState("");
  const [controlAction, setControlAction] = useState("");

  useEffect(() => {
    dispatch(fetchEscapeRooms(roomQuery));
  }, [dispatch, roomQuery]);

  const loadControlState = useCallback(async () => {
    try {
      setControlLoading(true);
      setControlError("");
      const stateValue = await escapeService.getControlState();
      setControlState(stateValue || {});
    } catch (errorValue) {
      setControlError(
        errorValue?.response?.data?.detail ||
          errorValue?.response?.data?.error ||
          "Unable to load escape control state"
      );
    } finally {
      setControlLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadControlState();
  }, [loadControlState]);

  useEffect(() => {
    const timeout = setTimeout(() => {
      dispatch(setRoomQuery({ search: searchInput, page: 1 }));
    }, 350);
    return () => clearTimeout(timeout);
  }, [dispatch, searchInput]);

  const totalPages = useMemo(() => {
    const pageSize = Number(roomQuery.pageSize || 10);
    const count = Number(roomMeta.count || rooms.length || 0);
    return Math.max(1, Math.ceil(count / pageSize));
  }, [roomQuery.pageSize, roomMeta.count, rooms.length]);

  const refresh = () => {
    dispatch(clearRoomError());
    dispatch(fetchEscapeRooms(roomQuery));
    void loadControlState();
  };

  const runControlAction = async (type) => {
    const normalizedType = String(type || "");
    const actionLabel =
      normalizedType === "start"
        ? "Start"
        : normalizedType === "finish"
        ? "Finish"
        : "Reset";

    const confirmed = await showConfirm(
      `Are you sure you want to ${actionLabel.toLowerCase()} Escape Room event now?`,
      `${actionLabel} Escape Event`,
      {
        okText: actionLabel,
        tone: normalizedType === "reset" ? "danger" : "warning",
      }
    );
    if (!confirmed) return;

    try {
      setControlAction(normalizedType);
      if (normalizedType === "start") {
        await escapeService.startEscapeEvent();
        toast.success("Escape event started");
      } else if (normalizedType === "finish") {
        await escapeService.finishEscapeEvent();
        toast.success("Escape event finished");
      } else if (normalizedType === "reset") {
        await escapeService.resetEscapeEvent();
        toast.success("Escape event reset");
      }

      await loadControlState();
    } catch (errorValue) {
      toast.error(
        errorValue?.response?.data?.detail ||
          errorValue?.response?.data?.error ||
          "Escape event action failed"
      );
    } finally {
      setControlAction("");
    }
  };

  const onDelete = async () => {
    if (!deletingRoom) return;
    try {
      setActionLoadingId(deletingRoom.id);
      await escapeService.deleteRoom(deletingRoom.id);
      toast.success("Escape room deleted");
      setDeletingRoom(null);
      refresh();
    } catch (errorValue) {
      toast.error(
        errorValue?.response?.data?.detail ||
          errorValue?.response?.data?.error ||
          "Delete failed"
      );
    } finally {
      setActionLoadingId(null);
    }
  };

  const onTogglePublish = async (room) => {
    const nextState = !room.is_active;
    try {
      setActionLoadingId(room.id);
      await escapeService.updateRoom(room.id, getRoomPayload(room, nextState));
      toast.success(nextState ? "Room activated" : "Room deactivated");
      refresh();
    } catch (errorValue) {
      toast.error(
        errorValue?.response?.data?.detail ||
          errorValue?.response?.data?.error ||
          "Unable to update publish state"
      );
    } finally {
      setActionLoadingId(null);
    }
  };

  const columns = [
    {
      key: "title",
      title: "Title",
      render: (room) => (
        <div>
          <p className="font-semibold text-slate-900">{room.title}</p>
          <p className="text-xs text-slate-500">
            {room.description?.slice(0, 70) || "No description"}
          </p>
        </div>
      ),
    },
    {
      key: "difficulty",
      title: "Difficulty",
      render: (room) => room.difficulty || "-",
    },
    {
      key: "total_points",
      title: "Total Points",
      render: (room) => room.total_points ?? 0,
    },
    {
      key: "time_limit_minutes",
      title: "Time Limit",
      render: (room) => `${room.time_limit_minutes ?? 0} mins`,
    },
    {
      key: "is_published",
      title: "Status",
      render: (room) => (
        <button
          type="button"
          onClick={() => onTogglePublish(room)}
          disabled={actionLoadingId === room.id}
          className={`rounded-full border px-2 py-1 text-xs font-semibold ${statusBadgeClass(
            room.is_active
          )} disabled:opacity-60`}
        >
          {room.is_active ? "Active" : "Inactive"}
        </button>
      ),
    },
    {
      key: "levels_count",
      title: "Levels",
      render: (room) => room.levels_count ?? room.level_count ?? "-",
    },
    {
      key: "actions",
      title: "Actions",
      render: (room) => (
        <div className="flex flex-wrap gap-2">
          <Link
            to={`/games/escape-rooms/${room.id}/levels`}
            className="rounded-lg border border-slate-300 px-2 py-1 text-xs text-slate-900 hover:bg-slate-50"
          >
            View
          </Link>
          <Link
            to={`/games/escape-rooms/${room.id}/edit`}
            className="rounded-lg border border-blue-200 bg-blue-50 px-2 py-1 text-xs text-blue-700 hover:bg-blue-100"
          >
            Edit
          </Link>
          <button
            type="button"
            onClick={() => setDeletingRoom(room)}
            className="rounded-lg border border-rose-200 bg-rose-50 px-2 py-1 text-xs text-rose-700 hover:bg-rose-100"
          >
            Delete
          </button>
        </div>
      ),
    },
  ];

  return (
    <section className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Escape Rooms</h1>
          <p className="text-sm text-slate-500">
            Search, filter, publish, and manage all rooms.
          </p>
        </div>
        <Link
          to="/games/escape-rooms/new"
          className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-500"
        >
          Create Escape Room
        </Link>
      </div>

      <div className="space-y-3 rounded-2xl border border-slate-200 bg-white/92 p-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h2 className="text-sm font-semibold uppercase tracking-[0.14em] text-slate-800">
              Escape Event Control
            </h2>
            <p className="text-xs text-slate-500">
              Backend APIs: state, start, finish, reset.
            </p>
          </div>
          <span className="rounded-full border border-indigo-200 bg-indigo-50 px-2 py-1 text-xs text-indigo-700">
            {String(controlState.status || "draft").replaceAll("_", " ")}
          </span>
        </div>

        {controlError ? (
          <p className="text-xs text-rose-300">{controlError}</p>
        ) : null}

        <div className="grid gap-2 text-xs text-slate-500 md:grid-cols-3">
          <p>Started: {controlState.started_at || "-"}</p>
          <p>Finished: {controlState.finished_at || "-"}</p>
          <p>Updated: {controlState.updated_at || "-"}</p>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            disabled={controlLoading || controlAction === "start"}
            onClick={() => void runControlAction("start")}
            className="rounded-lg bg-emerald-600 px-3 py-2 text-xs font-semibold text-white hover:bg-emerald-500 disabled:opacity-60"
          >
            {controlAction === "start" ? "Starting..." : "Start"}
          </button>
          <button
            type="button"
            disabled={controlLoading || controlAction === "finish"}
            onClick={() => void runControlAction("finish")}
            className="rounded-lg bg-amber-600 px-3 py-2 text-xs font-semibold text-white hover:bg-amber-500 disabled:opacity-60"
          >
            {controlAction === "finish" ? "Finishing..." : "Finish"}
          </button>
          <button
            type="button"
            disabled={controlLoading || controlAction === "reset"}
            onClick={() => void runControlAction("reset")}
            className="rounded-lg bg-rose-600 px-3 py-2 text-xs font-semibold text-white hover:bg-rose-500 disabled:opacity-60"
          >
            {controlAction === "reset" ? "Resetting..." : "Reset"}
          </button>
        </div>
      </div>

      <div className="grid gap-3 rounded-2xl border border-slate-200 bg-white/92 p-4 md:grid-cols-3">
        <label className="space-y-1">
          <span className="text-xs uppercase tracking-[0.15em] text-slate-500">
            Search Title
          </span>
          <input
            value={searchInput}
            onChange={(event) => setSearchInput(event.target.value)}
            placeholder="Search rooms..."
            className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 outline-none focus:ring-2 focus:ring-blue-500/40"
          />
        </label>

        <label className="space-y-1">
          <span className="text-xs uppercase tracking-[0.15em] text-slate-500">
            Difficulty
          </span>
          <select
            value={roomQuery.difficulty}
            onChange={(event) =>
              dispatch(
                setRoomQuery({ difficulty: event.target.value, page: 1 })
              )
            }
            className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 outline-none focus:ring-2 focus:ring-blue-500/40"
          >
            <option value="all">All</option>
            {difficultyOptions.map((difficulty) => (
              <option key={difficulty} value={difficulty}>
                {difficulty}
              </option>
            ))}
          </select>
        </label>

        <div className="flex items-end">
          <button
            type="button"
            onClick={() => {
              setSearchInput("");
              dispatch(setRoomQuery({ search: "", difficulty: "all", page: 1 }));
            }}
            className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-800 hover:bg-slate-50"
          >
            Reset Filters
          </button>
        </div>
      </div>

      {error.rooms ? <ErrorState message={error.rooms} onRetry={refresh} /> : null}

      <Table
        columns={columns}
        data={rooms}
        loading={loading.rooms}
        emptyMessage="No escape rooms found."
      />

      {!loading.rooms && rooms.length === 0 && !error.rooms ? (
        <EmptyState
          title="No escape rooms yet"
          description="Create your first room to start adding levels and questions."
          action={
            <Link
              to="/games/escape-rooms/new"
              className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-500"
            >
              Create Room
            </Link>
          }
        />
      ) : null}

      <div className="flex items-center justify-end gap-2">
        <button
          type="button"
          disabled={roomQuery.page <= 1}
          onClick={() =>
            dispatch(setRoomQuery({ page: Math.max(1, roomQuery.page - 1) }))
          }
          className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm text-slate-800 disabled:opacity-40"
        >
          Previous
        </button>
        <span className="text-sm text-slate-700">
          Page {roomQuery.page} / {totalPages}
        </span>
        <button
          type="button"
          disabled={roomQuery.page >= totalPages}
          onClick={() =>
            dispatch(setRoomQuery({ page: Math.min(totalPages, roomQuery.page + 1) }))
          }
          className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm text-slate-800 disabled:opacity-40"
        >
          Next
        </button>
      </div>

      <Modal
        isOpen={Boolean(deletingRoom)}
        title="Delete Escape Room"
        description={`Delete "${deletingRoom?.title || ""}"? This will remove linked levels/questions depending on backend constraints.`}
        confirmText={actionLoadingId ? "Deleting..." : "Delete"}
        onCancel={() => setDeletingRoom(null)}
        onConfirm={onDelete}
      />
    </section>
  );
}

