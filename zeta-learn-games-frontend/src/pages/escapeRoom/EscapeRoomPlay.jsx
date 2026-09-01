import { useCallback, useEffect, useMemo, useState } from "react";
// import { Link, useParams } from "react-router-dom";
import { Link, useParams, useNavigate } from "react-router-dom";

import toast from "react-hot-toast";
import escapeService from "../../services/escapeService";
import { showPopup } from "../../utils/popup";
import escapeBackground from "../../assets/escape/escapebackground.png";
import hotPortal from "../../assets/escape/hotportal.png";
import { resolveRoomTheme } from "./roomThemes";
import "./escapeGame.css";

const readError = (error, fallback) => escapeService.withApiError(error, fallback);
const getPuzzleLabel = (puzzle, index) => puzzle?.order || puzzle?.level_number || index + 1;

export default function EscapeRoomPlay() {
  const { roomId } = useParams();
  const navigate = useNavigate();

  console.log("ESCAPE PLAY LOADED, ROOM ID:", roomId);

  const [room, setRoom] = useState(null);
  const [progress, setProgress] = useState(null);
  const [allProgress, setAllProgress] = useState([]);
  const [nextRoom, setNextRoom] = useState(null);
  const [answer, setAnswer] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [requestingHint, setRequestingHint] = useState(false);
  const [timeLeft, setTimeLeft] = useState(0);
  

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

      const allProgressValue = await escapeService.listMyProgress({ all: true });
      console.log("FINAL ALL PROGRESS FROM API:", JSON.stringify(allProgressValue, null, 2));

      console.log(
  "FRONTEND SCORE TEST:",
  allProgressValue.map((row) => ({
    room: row.room_id,
    score: row.score,
    total_score: row.total_score,
    total_points: row.total_points,
  }))
);

const normalizedAllProgress = allProgressValue.map((row) => ({
  ...row,
  total_score: Number(row?.total_score ?? row?.score ?? 0),
  total_points: Number(row?.total_points ?? row?.room_total_points ?? 0),
}));

setAllProgress(normalizedAllProgress);

      const playableRooms = Array.isArray(roomsCollection?.results) ? roomsCollection.results : [];
      console.log("PLAYABLE ROOMS:", playableRooms);
      const totalExpeditionPoints = playableRooms.reduce(
        (sum, room) => sum + Number(room?.total_points || 0),
      0
    );
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
  if (!roomId) return;

  let cancelled = false;

  const start = async () => {
    try {
      console.log("STARTING ESCAPE ROOM:", roomId);

      const result = await escapeService.startEscape({ roomId });

      console.log("START RESPONSE:", result);
      console.log("EXPIRES AT:", result?.expires_at);

      if (!cancelled) {
        await loadData();
      }
    } catch (error) {
      if (!cancelled) {
        console.error("START ESCAPE ERROR:", error);
        toast.error(readError(error, "Unable to start escape room."));
      }
    }
  };

  void start();

  return () => {
    cancelled = true;
  };
}, [roomId]);

  

  useEffect(() => {
  if (!progress?.expires_at) return;

  const updateTimer = () => {
    const remaining = Math.max(
      0,
      Math.ceil((new Date(progress.expires_at).getTime() - Date.now()) / 1000)
    );

    setTimeLeft(remaining);
  };

  updateTimer();

  const timer = setInterval(updateTimer, 1000);

  return () => clearInterval(timer);
}, [progress?.expires_at]);

  const puzzles = useMemo(
    () =>
      [...(room?.puzzles || [])].sort(
        (a, b) => Number(a?.order || a?.level_number || 0) - Number(b?.order || b?.level_number || 0)
      ),
    [room]
  );

  const currentPuzzle = useMemo(() => {
    const currentId = String(
      progress?.current_puzzle?.id || progress?.current_puzzle || ""
    );
    const fromRoom = puzzles.find((puzzle) => String(puzzle.id) === currentId);
    return fromRoom || progress?.current_puzzle || null;
  }, [progress, puzzles]);

  const isFinished = Boolean(progress?.completed || progress?.failed);
  const isFinalRoom = Boolean(progress?.completed && !nextRoom);
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

    const isLastPuzzle =
      currentPuzzleIndex === puzzles.length - 1;

    // Correct + last puzzle
if (isCorrect && isLastPuzzle) {
  const nextTitle = nextRoom?.title || "";

  await showPopup(
    `🎉 COMPLETE!\n\n` +
      `You survived the ${room.title} and solved all ${puzzles.length} challenges.\n\n` +
      `Final Score: ${
        result?.total_score ??
        progress?.total_score ??
        0
      } / ${
        result?.room_total_points ??
        progress?.room_total_points ??
        0
      }`,
    "COMPLETE!",
    {
      tone: "success",
      okText: nextTitle ? "Next Room" : "Finish",
    }
  );

  if (nextRoom) {
  navigate("/escape-room", { replace: true });
  return;
}

  setAnswer("");
  await loadData();
  return;
}

    // Correct but not last puzzle
    if (isCorrect && result?.progress?.current_puzzle) {
      await showPopup(
        `Puzzle completed!\n\nNext: ${result.progress.current_puzzle.title}`,
        "Puzzle Completed",
        {
          tone: "success",
          okText: "Continue",
        }
      );
    }

    /*if (result?.next_room_key) {
      setNextRoom({
        id: result?.next_room_id || nextRoom?.id || "",
        title: result?.next_room_title || nextRoom?.title || "",
        roomKey: result.next_room_key,
      });
    }*/

    setAnswer("");

    await loadData();

  } catch (error) {
    toast.error(
      readError(error, "Unable to submit answer.")
    );
  } finally {
    setSubmitting(false);
  }
};

  const handleRequestHint = async () => {
    if (!currentPuzzle?.id) return;
    try {
      setRequestingHint(true);
      const response = await escapeService.requestHint({ puzzleId: currentPuzzle.id });
      setProgress((prev) => ({
  ...prev,
  total_score: response.total_score,
  room_total_points: response.room_total_points,
}));
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

    if (isFinalRoom) {
  const finalScore = allProgress.reduce(
    (sum, row) => sum + Number(row?.total_score ?? row?.score ?? 0),
    0
  );

  const finalTotalPoints = allProgress.reduce(
    (sum, row) => sum + Number(row?.total_points ?? 0),
    0
  );

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        width: "100vw",
        height: "100vh",
        backgroundImage: `url(${hotPortal})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        overflow: "auto",
      }}
    >
      <div className="escape-play-final-overlay">
        <h2>🎉 YOU ESCAPED!</h2>

        <p>You successfully escaped the entire expedition.</p>

        <p className="escape-play-final-score">
          Final Score: {finalScore} / {finalTotalPoints}
        </p>

        <p>All active rooms successfully completed.</p>

        <button
          type="button"
          className="escape-play-submit-btn"
          onClick={() =>
            navigate("/escape-room", { replace: true })
          }
        >
          Return to Escape Rooms
        </button>
      </div>
    </div>
  );
}
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

  if (isFinished && progress?.completed && !nextRoom) {
  return (
    <div
      className="escape-play-final-screen"
      style={{
        backgroundImage: `url(${hotPortal})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
        width: "100vw",
        minHeight: "100vh",
      }}
    >
      <div className="escape-play-final-overlay">
        <h2>🎉 YOU ESCAPED!</h2>

        <p>You successfully escaped the entire expedition.</p>

        <p className="escape-play-final-score">
          Final Score:{" "}
{allProgress.reduce(
  (sum, row) => sum + Number(row?.total_score ?? row?.score ?? 0),
  0
)}{" "}
/
{allProgress.reduce(
  (sum, row) => sum + Number(row?.total_points ?? 0),
  0
)}
        </p>

        <p>All active rooms successfully completed.</p>

        <button
          type="button"
          className="escape-play-submit-btn"
          onClick={() =>
            navigate("/escape-room", { replace: true })
          }
        >
          Return to Escape Rooms
        </button>
      </div>
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
              
    {currentPuzzle ? (
      
                <div className="escape-play-current">
                  <div className="escape-play-game-info">
                    <span>
                      Puzzle{" "}
                      {getPuzzleLabel(
                        currentPuzzle,
                        currentPuzzleIndex
                      )}{" "}
                      of {puzzles.length}
                    </span>

                    <span>|</span>

                    <span>
                      Time: {Math.floor(timeLeft / 60)}:
                      {String(timeLeft % 60).padStart(2, "0")}
                    </span>

                    <span>|</span>

                    <span>
                      Score: {progress?.total_score ?? 0}
                    </span>
                  </div>

                  <h2>{currentPuzzle.title}</h2>

                  <div className="escape-play-content-row">
                    <div className="escape-play-description">
                      <p>
                        {currentPuzzle.description ||
                          "No description"}
                      </p>
                    </div>

                    <div className="escape-play-divider" />

                    <div className="escape-play-challenge">
                      {currentPuzzle.challenge ? (
                        <pre>{currentPuzzle.challenge}</pre>
                      ) : (
                        <p>No challenge</p>
                      )}
                    </div>
                  </div>

                  <input
                    value={answer}
                    onChange={(event) =>
                      setAnswer(event.target.value)
                    }
                    placeholder="Enter answer"
                    className="escape-play-answer-input"
                    autoComplete="off"
                  />

                  <div className="escape-play-actions-row">
                    <button
                      type="button"
                      onClick={() =>
                        void handleSubmitAnswer()
                      }
                      disabled={submitting}
                      className="escape-play-submit-btn"
                    >
                      {submitting
                        ? "Submitting..."
                        : "Submit"}
                    </button>

                    <button
                      type="button"
                      onClick={() =>
                        void handleRequestHint()
                      }
                      disabled={requestingHint}
                      className="escape-play-hint-btn"
                    >
                      {requestingHint
                        ? "Loading..."
                        : "Hint"}
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