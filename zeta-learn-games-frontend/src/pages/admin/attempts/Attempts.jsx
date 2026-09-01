import { useCallback, useEffect, useMemo, useState } from "react";
import escapeService from "../../../services/escapeService";
import Table from "../../../components/Table";
import LoadingSpinner from "../../../components/LoadingSpinner";
import ErrorState from "../../../components/ErrorState";
import { formatDateTime } from "../../../utils/admin";

const attemptUser = (row) =>
  row?.user_email ||
  row?.user?.email ||
  row?.user_name ||
  row?.username ||
  (row?.user ? `User #${row.user}` : "-");

const attemptRoom = (row) =>
  row?.room_title ||
  row?.escape_room?.title ||
  row?.room?.title ||
  row?.room_name ||
  (row?.room ? `Room #${row.room}` : "-");

const attemptPuzzle = (row) =>
  row?.current_puzzle_title ||
  row?.current_puzzle?.title ||
  row?.current_level ||
  (row?.current_puzzle ? `Puzzle #${row.current_puzzle}` : "-");

export default function Attempts() {
  const [mode, setMode] = useState("progress");
  const [rooms, setRooms] = useState([]);
  const [puzzles, setPuzzles] = useState([]);
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [roomFilter, setRoomFilter] = useState("");
  const [userFilter, setUserFilter] = useState("");
  const [puzzleFilter, setPuzzleFilter] = useState("");
  const [completedFilter, setCompletedFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [count, setCount] = useState(0);
  const pageSize = 10;

  const roomMap = useMemo(
    () => new Map(rooms.map((room) => [String(room.id), room.title])),
    [rooms]
  );
  const puzzleMap = useMemo(() => new Map(puzzles.map((puzzle) => [String(puzzle.id), puzzle])), [puzzles]);

  const loadMetadata = useCallback(async () => {
    try {
      const [roomRows, puzzleRows] = await Promise.all([
        escapeService.listAllRooms(),
        escapeService.listAllPuzzles(),
      ]);
      setRooms(roomRows);
      setPuzzles(puzzleRows);
    } catch {
      setRooms([]);
      setPuzzles([]);
    }
  }, []);

  const loadRows = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      if (mode === "progress") {
        const response = await escapeService.listAttempts({
          page,
          roomId: roomFilter,
          userId: userFilter,
          completed: completedFilter,
          pageSize,
        });
        setRows(response.results || []);
        setCount(Number(response.count || response.results?.length || 0));
      } else {
        const response = await escapeService.listSubmissions({
          page,
          roomId: roomFilter,
          userId: userFilter,
          puzzleId: puzzleFilter,
          pageSize,
        });
        setRows(response.results || []);
        setCount(Number(response.count || response.results?.length || 0));
      }
    } catch (errorValue) {
      setError(
        errorValue?.response?.data?.detail ||
          errorValue?.response?.data?.error ||
          "Unable to load escape admin logs"
      );
    } finally {
      setLoading(false);
    }
  }, [mode, page, roomFilter, userFilter, puzzleFilter, completedFilter]);

  useEffect(() => {
    void loadMetadata();
  }, [loadMetadata]);

  useEffect(() => {
    void loadRows();
  }, [loadRows]);

  const totalPages = useMemo(
    () => Math.max(1, Math.ceil(Number(count || 0) / pageSize)),
    [count]
  );

  const progressColumns = [
    { key: "user", title: "User", render: (row) => attemptUser(row) },
    { key: "room", title: "Escape Room", render: (row) => attemptRoom(row) },
    {key: "attempt_number",title: "Attempt",render: (row) => row.attempt_number ?? "-",},
    { key: "level", title: "Current Puzzle", render: (row) => attemptPuzzle(row) },
    { key: "score", title: "Score", render: (row) => row.total_score ?? row.score ?? 0 },
    {
      key: "status",
      title: "Status",
      render: (row) => {
        const status = String(row.status || "").toUpperCase();

        const completed = status === "COMPLETED";
        const failed = status === "FAILED";

        const label = completed
          ? "Completed"
          : failed
          ? "Failed"
          : "In Progress";

        const tone = completed
          ? "border-emerald-500/40 bg-emerald-500/20 text-emerald-200"
          : failed
          ? "border-rose-500/40 bg-rose-500/20 text-rose-200"
          : "border-amber-500/40 bg-amber-500/20 text-amber-200";
        return <span className={`rounded-full border px-2 py-1 text-xs ${tone}`}>{label}</span>;
      },
    },
    {
      key: "remaining_time_seconds",
      title: "Remaining",
      render: (row) => `${Number(row.remaining_time_seconds || 0)}s`,
    },
    {
      key: "started_at",
      title: "Started",
      render: (row) => formatDateTime(row.start_time || row.started_at),
    },
    {
      key: "completed_at",
      title: "Completed At",
      render: (row) => formatDateTime(row.end_time || row.completed_at),
    },
  ];

  const submissionColumns = [
    {
  key: "submission_label",
  title: "Submission",
  render: (row) => {
    const puzzle = puzzleMap.get(
      String(row.puzzle_id || row.puzzle || "")
    );

    const roomId = puzzle?.room || puzzle?.escape_room || "";
    const roomNumber = roomId || "-";
    const puzzleNumber = puzzle?.order || puzzle?.level_number || "-";

    const samePuzzleRows = rows.filter((item) => {
      const itemPuzzle = puzzleMap.get(
        String(item.puzzle_id || item.puzzle || "")
      );

      const itemRoomId =
        itemPuzzle?.room || itemPuzzle?.escape_room || "";

      return (
        String(itemRoomId) === String(roomId) &&
        String(item.puzzle_id || item.puzzle || "") ===
          String(row.puzzle_id || row.puzzle || "") &&
        item.submitted_at &&
        row.submitted_at &&
        new Date(item.submitted_at) <= new Date(row.submitted_at)
      );
    });

    const submissionNumber = samePuzzleRows.length;

    return `R${roomNumber}-P${puzzleNumber}-${submissionNumber}`;
  },
},
{
  key: "user",
  title: "User",
  render: (row) =>
    row.user_name ||
    row.user?.username ||
    row.user?.email ||
    "-",
},
    {
      key: "room",
      title: "Room",
      render: (row) => {
        const puzzle = puzzleMap.get(String(row.puzzle_id || row.puzzle || ""));
        const roomId = puzzle?.room || puzzle?.escape_room || "";
        return roomMap.get(String(roomId)) || (roomId ? `Room #${roomId}` : "-");
      },
    },
    {
      key: "puzzle",
      title: "Puzzle",
      render: (row) => {
        const puzzle = puzzleMap.get(String(row.puzzle_id || row.puzzle || ""));
        return puzzle?.title || `Puzzle #${row.puzzle_id || row.puzzle || "-"}`;
      },
    },
    {
      key: "submitted_answer",
      title: "Submitted Answer",
      render: (row) => row.submitted_answer || "-",
    },
    {
      key: "is_correct",
      title: "Correct",
      render: (row) => (
        <span
          className={`rounded-full border px-2 py-1 text-xs ${
            row.is_correct
              ? "border-emerald-500/40 bg-emerald-500/20 text-emerald-200"
              : "border-rose-500/40 bg-rose-500/20 text-rose-200"
          }`}
        >
          {row.is_correct ? "Yes" : "No"}
        </span>
      ),
    },
    {
      key: "submitted_at",
      title: "Submitted At",
      render: (row) => formatDateTime(row.submitted_at),
    },
  ];

  const columns = mode === "progress" ? progressColumns : submissionColumns;

  if (loading && rows.length === 0) {
    return <LoadingSpinner label="Loading escape admin data..." />;
  }

  return (
    <section className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold text-slate-100">
          Escape Admin Logs
        </h1>
        <p className="text-sm text-slate-400">
          Uses admin progress and admin attempts APIs with filters.
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => {
            setMode("progress");
            setPage(1);
          }}
          className={`rounded-lg border px-3 py-1.5 text-sm ${
            mode === "progress"
              ? "border-blue-500/50 bg-blue-500/20 text-blue-100"
              : "border-slate-700 text-slate-200"
          }`}
        >
          Progress Sessions
        </button>
        <button
          type="button"
          onClick={() => {
            setMode("submissions");
            setPage(1);
          }}
          className={`rounded-lg border px-3 py-1.5 text-sm ${
            mode === "submissions"
              ? "border-blue-500/50 bg-blue-500/20 text-blue-100"
              : "border-slate-700 text-slate-200"
          }`}
        >
          Puzzle Submissions
        </button>
      </div>

      <div className="grid gap-3 rounded-2xl border border-slate-800 bg-slate-900/60 p-4 md:grid-cols-4">
        <label className="space-y-1">
          <span className="text-xs uppercase tracking-[0.15em] text-slate-400">
            Escape Room
          </span>
          <select
            value={roomFilter}
            onChange={(event) => {
              setRoomFilter(event.target.value);
              setPage(1);
            }}
            className="w-full rounded-xl border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-slate-100 outline-none focus:ring-2 focus:ring-blue-500/40"
          >
            <option value="">All Rooms</option>
            {rooms.map((room) => (
              <option key={room.id} value={room.id}>
                {room.title}
              </option>
            ))}
          </select>
        </label>

        <label className="space-y-1">
          <span className="text-xs uppercase tracking-[0.15em] text-slate-400">
            User ID
          </span>
          <input
            value={userFilter}
            onChange={(event) => {
              setUserFilter(event.target.value);
              setPage(1);
            }}
            placeholder="Filter by user id"
            className="w-full rounded-xl border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-slate-100 outline-none focus:ring-2 focus:ring-blue-500/40"
          />
        </label>

        {mode === "progress" ? (
          <label className="space-y-1">
            <span className="text-xs uppercase tracking-[0.15em] text-slate-400">
              Status
            </span>
            <select
              value={completedFilter}
              onChange={(event) => {
                setCompletedFilter(event.target.value);
                setPage(1);
              }}
              className="w-full rounded-xl border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-slate-100 outline-none focus:ring-2 focus:ring-blue-500/40"
            >
              <option value="all">All</option>
              <option value="completed">Completed</option>
              <option value="incomplete">In Progress</option>
              <option value="failed">Failed</option>
            </select>
          </label>
        ) : (
          <label className="space-y-1">
            <span className="text-xs uppercase tracking-[0.15em] text-slate-400">
              Puzzle
            </span>
            <select
              value={puzzleFilter}
              onChange={(event) => {
                setPuzzleFilter(event.target.value);
                setPage(1);
              }}
              className="w-full rounded-xl border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-slate-100 outline-none focus:ring-2 focus:ring-blue-500/40"
            >
              <option value="">All Puzzles</option>
              {puzzles.map((puzzle) => (
                <option key={puzzle.id} value={puzzle.id}>
                  {puzzle.title || `Puzzle #${puzzle.id}`}
                </option>
              ))}
            </select>
          </label>
        )}

        <div className="flex items-end">
          <button
            type="button"
            onClick={() => {
              setRoomFilter("");
              setUserFilter("");
              setPuzzleFilter("");
              setCompletedFilter("all");
              setPage(1);
            }}
            className="w-full rounded-xl border border-slate-600 px-3 py-2 text-sm font-semibold text-slate-200 hover:bg-slate-800"
          >
            Reset Filters
          </button>
        </div>
      </div>

      {error ? <ErrorState message={error} onRetry={loadRows} /> : null}

      <Table
        columns={columns}
        data={rows}
        loading={loading}
        emptyMessage="No records found for current filters."
      />

      <div className="flex items-center justify-end gap-2">
        <button
          type="button"
          disabled={page <= 1}
          onClick={() => setPage((prev) => Math.max(1, prev - 1))}
          className="rounded-lg border border-slate-700 px-3 py-1.5 text-sm text-slate-200 disabled:opacity-40"
        >
          Previous
        </button>
        <span className="text-sm text-slate-300">
          Page {page} / {totalPages}
        </span>
        <button
          type="button"
          disabled={page >= totalPages}
          onClick={() => setPage((prev) => Math.min(totalPages, prev + 1))}
          className="rounded-lg border border-slate-700 px-3 py-1.5 text-sm text-slate-200 disabled:opacity-40"
        >
          Next
        </button>
      </div>
    </section>
  );
}
