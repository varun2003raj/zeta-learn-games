import { useCallback, useEffect, useMemo, useState } from "react";
// import { Link, useParams } from "react-router-dom";
import { Link, useParams, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import escapeService from "../../services/escapeService";
import { showPopup } from "../../utils/popup";
import escapeBackground from "../../assets/escape/escapebackground.png";
import { resolveRoomTheme } from "./roomThemes";
import "./escapeGame.css";

const readError = (error, fallback) => escapeService.withApiError(error, fallback);
const getPuzzleLabel = (puzzle, index) => puzzle?.order || puzzle?.level_number || index + 1;

export default function EscapeRoomPlay() {
  const { roomId } = useParams();
  const navigate = useNavigate();
  const [room, setRoom] = useState(null);
  const [progress, setProgress] = useState(null);
  const [nextRoom, setNextRoom] = useState(null);
  const [answer, setAnswer] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [requestingHint, setRequestingHint] = useState(false);
  

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const [roomValue, progressValue, roomsCollection] = await Promise.all([
        escapeService.getPlayableRoom(roomId),
        escapeService.getMyProgress({ roomId }),
        escapeService.listPlayableRooms({ pageSize: 200 }).catch(() => null),
      ]);
      setRoom(roomValue);
      setProgress(progressValue);

      const playableRooms = Array.isArray(roomsCollection?.results) ? roomsCollection.results : [];
      if (playableRooms.length > 0) {
        const ordered = [...playableRooms].sort((a, b) => Number(a?.id || 0) - Number(b?.id || 0));
        const currentId = String(roomValue?.id ?? roomId);
        const currentIndex = ordered.findIndex((entry) => String(entry.id) === currentId);
        const next = currentIndex >= 0 ? ordered[currentIndex + 1] || null : null;
        if (next) {
          let roomKey = String(next.room_key || next.unlock_key || next.unlockKey || next.key || "").trim();
          if (!roomKey) {
            try {
              const nextRoomDetail = await escapeService.getPlayableRoom(next.id);
              roomKey = String(
                nextRoomDetail?.room_key ||
                  nextRoomDetail?.unlock_key ||
                  nextRoomDetail?.unlockKey ||
                  nextRoomDetail?.key ||
                  ""
              ).trim();
            } catch {
              roomKey = "";
            }
          }

          setNextRoom({
            id: next.id,
            title: next.title || "",
            roomKey,
          });
        } else {
          setNextRoom(null);
        }
      } else {
        setNextRoom(null);
      }
    } catch (error) {
      toast.error(readError(error, "Unable to load room puzzle state."));
    } finally {
      setLoading(false);
    }
  }, [roomId]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  const puzzles = useMemo(
    () =>
      [...(room?.puzzles || [])].sort(
        (a, b) => Number(a?.order || a?.level_number || 0) - Number(b?.order || b?.level_number || 0)
      ),
    [room]
  );

  const currentPuzzle = useMemo(() => {
    const currentId = String(progress?.current_puzzle?.id || "");
    const fromRoom = puzzles.find((puzzle) => String(puzzle.id) === currentId);
    return fromRoom || progress?.current_puzzle || null;
  }, [progress, puzzles]);

  const isFinished = Boolean(progress?.completed || progress?.failed);
  const currentPuzzleIndex = useMemo(
    () => puzzles.findIndex((puzzle) => String(puzzle.id) === String(currentPuzzle?.id || "")),
    [puzzles, currentPuzzle]
  );

  const theme = useMemo(() => resolveRoomTheme(room || { id: roomId }), [room, roomId]);
  const themedBackground = theme?.background || escapeBackground;
  const playRootStyle = {
    "--escape-page-bg": `url(${themedBackground})`,
    "--escape-accent": theme?.accent || "#7ac3ff",
    "--escape-paper-text": theme?.paperText || "#2b2b2b",
    "--escape-button-text": theme?.buttonText || "#f8fafc",
  };

  const handleSubmitAnswer = async () => {
    if (!currentPuzzle?.id || !String(answer || "").trim()) {
      toast.error("Enter an answer first.");
      return;
    }

    try {
      setSubmitting(true);
      const result = await escapeService.submitAnswer({
        puzzleId: currentPuzzle.id,
        answer,
      });

      const isCorrect = Boolean(result?.attempt?.is_correct);
      if (isCorrect) {
        toast.success("Correct answer submitted.");
      } else {
        toast.error("Incorrect answer.");
      }

      if (result?.next_puzzle_hint?.hint_text) {
        await showPopup(result.next_puzzle_hint.hint_text, "Next Puzzle Hint", {
          tone: "info",
          okText: "Continue",
        });
      }

      if (result?.next_room_key) {
        setNextRoom({
          id: result?.next_room_id || nextRoom?.id || "",
          title: result?.next_room_title || nextRoom?.title || "",
          roomKey: result.next_room_key,
        });
      }

      setAnswer("");
      await loadData();
    } catch (error) {
      toast.error(readError(error, "Unable to submit answer."));
    } finally {
      setSubmitting(false);
    }
  };

  const handleRequestHint = async () => {
    if (!currentPuzzle?.id) return;
    try {
      setRequestingHint(true);
      const response = await escapeService.requestHint({ puzzleId: currentPuzzle.id });
      if (!response?.hint_text) {
        toast.error("No hint returned.");
        return;
      }
      await showPopup(response.hint_text, "Puzzle Hint", { tone: "warning", okText: "Got It" });
      await loadData();
    } catch (error) {
      toast.error(readError(error, "Unable to fetch hint."));
    } finally {
      setRequestingHint(false);
    }
  };

  if (loading) {
    return (
      <div className="escape-game-root escape-game-root-play" style={playRootStyle}>
        <section className="mx-auto max-w-5xl p-4 text-slate-100">Loading puzzles...</section>
      </div>
    );
  }

  if (!room) {
    return (
      <div className="escape-game-root escape-game-root-play" style={playRootStyle}>
        <section className="mx-auto max-w-5xl space-y-3 p-4 text-slate-100">
          <p>Room not found.</p>
          <Link to="/escape-room" className="inline-flex rounded-lg border border-slate-600 px-3 py-2 text-sm">
            Back to Rooms
          </Link>
        </section>
      </div>
    );
  }

  return (
    <div
      className="escape-game-root escape-game-root-play"
      style={playRootStyle}
    >
      <section className="escape-play-shell">
        <div className="escape-play-head">
          <h1>{room.title}</h1>
        </div>

        <div className="escape-play-stage">
          <div className="escape-play-frame-panel">
            {/* {isFinished ? (
              <div className={`escape-play-finish escape-play-finish-${progress?.completed ? "done" : "failed"}`}>
                <p>{progress?.completed ? "Room completed. Great run." : "Room attempt failed."}</p>
                {progress?.completed ? (
                  nextRoom?.roomKey ? (
                    <p className="escape-play-next-key">
                      Next room key ({nextRoom.title || `Room #${nextRoom.id}`}): {nextRoom.roomKey}
                    </p>
                  ) : (
                    <p className="escape-play-next-key">No next room key. You finished the final room.</p>
                  )
                ) : null}
                
              </div>
            ) : currentPuzzle ? ( */}
            {isFinished ? (
              <div
                className={`escape-play-finish escape-play-finish-${progress?.completed ? "done" : "failed"}`}
              >
                <p>
                  {progress?.completed
                    ? "Room completed. Great run."
                    : "Room attempt failed."}
                </p>

                {progress?.completed ? (
                  nextRoom?.roomKey ? (
                    <p className="escape-play-next-key">
                      Next room key ({nextRoom.title || `Room #${nextRoom.id}`}
                      ): {nextRoom.roomKey}
                    </p>
                  ) : (
                    <p className="escape-play-next-key">
                      No next room key. You finished the final room.
                    </p>
                  )
                ) : null}

                {/* ⭐ NEXT BUTTON */}
                <div style={{ marginTop: "20px" }}>
                  <button
                    className="escape-play-submit-btn"
                    onClick={() => navigate("/escape-room", { replace: true })}
                  >
                    Next
                  </button>
                </div>
              </div>
            ) : currentPuzzle ? (
              <div className="escape-play-current">
                <p className="escape-play-step-meta">
                  Puzzle {getPuzzleLabel(currentPuzzle, currentPuzzleIndex)} of{" "}
                  {puzzles.length}
                </p>
                <h2>{currentPuzzle.title}</h2>
                <p className="escape-play-description">
                  {currentPuzzle.description || "No description"}
                </p>
                <input
                  value={answer}
                  onChange={(event) => setAnswer(event.target.value)}
                  placeholder="Enter answer"
                  className="escape-play-answer-input"
                  autoComplete="off"
                />
                <div className="escape-play-actions-row">
                  <button
                    type="button"
                    onClick={() => void handleSubmitAnswer()}
                    disabled={submitting}
                    className="escape-play-submit-btn"
                  >
                    {submitting ? "Submitting..." : "Submit"}
                  </button>
                  <button
                    type="button"
                    onClick={() => void handleRequestHint()}
                    disabled={requestingHint}
                    className="escape-play-hint-btn"
                  >
                    {requestingHint ? "Loading..." : "Hint"}
                  </button>
                </div>
              </div>
            ) : (
              <p className="escape-play-empty">
                No active puzzle. Enter room from lobby first.
              </p>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
