import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";
import escapeService from "../../services/escapeService";
import escapeBackground from "../../assets/escape/escapebackground.png";
import { resolveRoomPortal } from "./roomThemes";
import "./escapeGame.css";

const readError = (error, fallback) => escapeService.withApiError(error, fallback);

const roomStatusLabel = (status) => {
  if (status === "completed") return "Completed";
  if (status === "failed") return "Failed";
  if (status === "active") return "In Progress";
  if (status === "locked") return "Locked";
  return "Ready";
};

export default function EscapeMissionControl() {
  const navigate = useNavigate();
  const [rooms, setRooms] = useState([]);
  const [allProgressRows, setAllProgressRows] = useState([]);
  const [selectedRoomId, setSelectedRoomId] = useState("");
  const [systemNotice, setSystemNotice] = useState(null);
  const [isEntryModalOpen, setIsEntryModalOpen] = useState(false);
  const [roomKey, setRoomKey] = useState("");
  const [loadingRooms, setLoadingRooms] = useState(true);
  const [busyAction, setBusyAction] = useState("");
  const roomCardRefs = useRef(new Map());
  const swiperRailRef = useRef(null);
  const announcedKeyUnlocksRef = useRef(new Set());

  const roomTitleMap = useMemo(
    () => new Map(rooms.map((room) => [String(room.id), room.title || `Room #${room.id}`])),
    [rooms]
  );

  const applyErrorNotice = useCallback((error, fallback) => {
    const payload = error?.response?.data || {};
    const detail = readError(error, fallback);

    setSystemNotice({
      tone: "danger",
      text: detail,
      requiredPreviousRoomId: payload?.required_previous_room_id || null,
      requiredRoomId: payload?.required_room_id || null,
      expectedPuzzleId: payload?.expected_puzzle_id || null,
    });
  }, []);

  const loadGlobalProgress = useCallback(async () => {
    try {
      const rows = await escapeService.listMyProgress({ all: true });
      setAllProgressRows(rows);
    } catch {
      setAllProgressRows([]);
    }
  }, []);

  const loadRooms = useCallback(async () => {
    try {
      setLoadingRooms(true);
      const [collection, globalProgress] = await Promise.all([
        escapeService.listPlayableRooms({ pageSize: 200 }),
        escapeService.listMyProgress({ all: true }).catch(() => []),
      ]);

      const roomRows = collection?.results || [];
      setRooms(roomRows);
      setAllProgressRows(globalProgress);
      setSelectedRoomId(roomRows[0] ? String(roomRows[0].id) : "");
    } catch (error) {
      toast.error(readError(error, "Unable to load escape rooms."));
    } finally {
      setLoadingRooms(false);
    }
  }, []);

  useEffect(() => {
    void loadRooms();
  }, [loadRooms]);

  const orderedRooms = useMemo(
    () => [...rooms].sort((a, b) => Number(a?.id || 0) - Number(b?.id || 0)),
    [rooms]
  );

  const roomImageById = useMemo(() => {
    const map = new Map();
    orderedRooms.forEach((room, index) => {
      map.set(String(room.id), resolveRoomPortal(room, index));
    });
    return map;
  }, [orderedRooms]);

  const selectedRoomIndex = useMemo(
    () => orderedRooms.findIndex((room) => String(room.id) === String(selectedRoomId)),
    [orderedRooms, selectedRoomId]
  );

  useEffect(() => {
    const target = roomCardRefs.current.get(String(selectedRoomId));
    if (target && typeof target.scrollIntoView === "function") {
      target.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "center" });
    }
  }, [selectedRoomId]);

  useEffect(() => {
    const rail = swiperRailRef.current;
    if (!rail || typeof rail.scrollTo !== "function") return;
    rail.scrollTo({ left: 0, behavior: "auto" });
  }, [orderedRooms.length]);
  useEffect(() => {
    if (swiperRailRef.current) {
      swiperRailRef.current.focus();
    }
  }, []);

  const selectedRoom = useMemo(
    () => rooms.find((room) => String(room.id) === String(selectedRoomId)) || null,
    [rooms, selectedRoomId]
  );

  const selectedRoomImage = roomImageById.get(String(selectedRoomId)) || escapeBackground;

  const globalProgressByRoom = useMemo(() => {
    const sorted = [...allProgressRows].sort((a, b) => {
      const left = new Date(a?.started_at || 0).getTime() || 0;
      const right = new Date(b?.started_at || 0).getTime() || 0;
      return right - left;
    });

    const map = new Map();
    sorted.forEach((row) => {
      const roomId = String(row?.room?.id || row?.room || "");
      if (roomId && !map.has(roomId)) {
        map.set(roomId, row);
      }
    });

    return map;
  }, [allProgressRows]);

  const roomStateById = useMemo(() => {
    const map = new Map();

    orderedRooms.forEach((room, index) => {
      const roomId = String(room.id);
      const progressRow = globalProgressByRoom.get(roomId) || null;
      const previousRoom = index > 0 ? orderedRooms[index - 1] : null;
      const previousRoomCompleted = previousRoom
        ? Boolean(globalProgressByRoom.get(String(previousRoom.id))?.completed)
        : true;
      const lockedBySequence = Boolean(previousRoom && !previousRoomCompleted);

      let status = "ready";
      if (progressRow?.completed) {
        status = "completed";
      } else if (progressRow?.failed) {
        status = "failed";
      } else if (progressRow?.current_puzzle?.id) {
        status = "active";
      } else if (lockedBySequence) {
        status = "locked";
      }

      map.set(roomId, {
        status,
        progressRow,
        lockedBySequence,
        previousRoom,
      });
    });

    return map;
  }, [globalProgressByRoom, orderedRooms]);

  const selectedRoomState =
    roomStateById.get(String(selectedRoomId)) ||
    ({
      status: "ready",
      progressRow: null,
      lockedBySequence: false,
      previousRoom: null,
    });

  const requiresRoomKey = selectedRoomIndex > 0;
  const selectedNextRoom = selectedRoomIndex >= 0 ? orderedRooms[selectedRoomIndex + 1] || null : null;

  useEffect(() => {
    if (!orderedRooms.length) return;

    orderedRooms.forEach((room, index) => {
      const roomId = String(room.id);
      const roomState = roomStateById.get(roomId);
      if (!roomState?.progressRow?.completed) return;

      const nextRoom = orderedRooms[index + 1];
      const nextRoomKey = String(nextRoom?.room_key || "").trim();
      if (!nextRoom?.id || !nextRoomKey) return;

      const unlockId = `${roomId}->${String(nextRoom.id)}`;
      if (announcedKeyUnlocksRef.current.has(unlockId)) return;
      announcedKeyUnlocksRef.current.add(unlockId);

      toast.success(`Next room key unlocked: ${nextRoomKey}`);
    });
  }, [orderedRooms, roomStateById]);

  const focusRoomCard = useCallback((roomId) => {
    const target = roomCardRefs.current.get(String(roomId));
    if (target && typeof target.focus === "function") {
      target.focus({ preventScroll: true });
      target.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "center" });
    }
  }, []);
  

  // const selectRoomByOffset = useCallback(
  //   (offset, shouldFocus = false) => {
  //     if (!orderedRooms.length) return;

  //     const currentIndex = orderedRooms.findIndex(
  //       (room) => String(room.id) === String(selectedRoomId || orderedRooms[0]?.id || "")
  //     );
  //     const baseIndex = currentIndex >= 0 ? currentIndex : 0;
  //     const nextIndex = Math.min(orderedRooms.length - 1, Math.max(0, baseIndex + offset));
  //     const nextRoomId = String(orderedRooms[nextIndex].id);

  //     if (nextRoomId !== String(selectedRoomId)) {
  //       setSelectedRoomId(nextRoomId);
  //     }

  //     if (shouldFocus) {
  //       requestAnimationFrame(() => focusRoomCard(nextRoomId));
  //     }
  //   },
  //   [orderedRooms, selectedRoomId, focusRoomCard]
  // );
  const selectRoomByOffset = useCallback(
    (offset, shouldFocus = false) => {
      if (!orderedRooms.length) return;

      const currentIndex = orderedRooms.findIndex(
        (room) =>
          String(room.id) ===
          String(selectedRoomId || orderedRooms[0]?.id || ""),
      );

      const baseIndex = currentIndex >= 0 ? currentIndex : 0;
      const nextIndex = Math.min(
        orderedRooms.length - 1,
        Math.max(0, baseIndex + offset),
      );

      const nextRoomId = String(orderedRooms[nextIndex].id);

      if (nextRoomId !== String(selectedRoomId)) {
        setSelectedRoomId(nextRoomId);
      }

      //  FORCE SCROLL 
      const rail = swiperRailRef.current;
      const targetCard = roomCardRefs.current.get(nextRoomId);

      if (rail && targetCard) {
        rail.scrollTo({
          left:
            targetCard.offsetLeft -
            rail.offsetWidth / 2 +
            targetCard.offsetWidth / 2,
          behavior: "smooth",
        });
      }

      if (shouldFocus) {
        requestAnimationFrame(() => focusRoomCard(nextRoomId));
      }
    },
    [orderedRooms, selectedRoomId, focusRoomCard],
  );
  useEffect(() => {
    const handleKey = (event) => {
      if (event.key === "ArrowRight") {
        selectRoomByOffset(1, true);
      }

      if (event.key === "ArrowLeft") {
        selectRoomByOffset(-1, true);
      }
    };

    window.addEventListener("keydown", handleKey);

    return () => {
      window.removeEventListener("keydown", handleKey);
    };
  }, [selectRoomByOffset]);

  const handleSwiperKeyDown = useCallback(
    (event) => {
      if (event.key === "ArrowRight") {
        event.preventDefault();
        selectRoomByOffset(1, true);
        return;
      }

      if (event.key === "ArrowLeft") {
        event.preventDefault();
        selectRoomByOffset(-1, true);
      }
    },
    [selectRoomByOffset]
  );

  const openEntryModal = (roomId) => {
    const roomIdValue = String(roomId);
    const index = orderedRooms.findIndex((room) => String(room.id) === roomIdValue);
    const requiresKey = index > 0;
    const room = orderedRooms[index] || null;
    const roomState =
      roomStateById.get(roomIdValue) ||
      ({
        lockedBySequence: false,
      });

    setSelectedRoomId(roomIdValue);
    setSystemNotice(null);
    if (requiresKey && !roomState.lockedBySequence) {
      setRoomKey(String(room?.room_key || "").trim());
    } else {
      setRoomKey("");
    }
    setIsEntryModalOpen(true);
  };

  const handleEnterRoom = async () => {
    if (!selectedRoomId) return;

    if (selectedRoomState.lockedBySequence) {
      const blockedMessage = `Complete ${
        selectedRoomState.previousRoom?.title || "the previous room"
      } before entering this room.`;
      setSystemNotice({
        tone: "warning",
        text: blockedMessage,
        requiredPreviousRoomId: selectedRoomState.previousRoom?.id || null,
        requiredRoomId: null,
        expectedPuzzleId: null,
      });
      toast.error(blockedMessage);
      return;
    }

    if (selectedRoomState.status === "active") {
      setIsEntryModalOpen(false);
      navigate(`/escape-room/room/${selectedRoomId}`);
      return;
    }

    if (selectedRoomState.status === "completed") {
      setIsEntryModalOpen(false);
      toast.success("Room already completed.");
      return;
    }

    if (selectedRoomState.status === "failed") {
      setIsEntryModalOpen(false);
      toast.error("Room attempt already failed.");
      return;
    }

    const normalizedKey = String(roomKey || "").trim();
    if (requiresRoomKey && !normalizedKey) {
      const message = "Room key is required from Room 2 onward.";
      setSystemNotice({
        tone: "warning",
        text: message,
        requiredPreviousRoomId: selectedRoomState.previousRoom?.id || null,
        requiredRoomId: Number(selectedRoomId),
        expectedPuzzleId: null,
      });
      toast.error(message);
      return;
    }

    try {
      setBusyAction("start");
      setSystemNotice(null);

      await escapeService.startRoom(selectedRoomId, requiresRoomKey ? normalizedKey : "");

      setRoomKey("");
      setIsEntryModalOpen(false);
      toast.success("Room entered successfully.");
      await Promise.all([loadRooms(), loadGlobalProgress()]);
      navigate(`/escape-room/room/${selectedRoomId}`);
    } catch (error) {
      applyErrorNotice(error, "Unable to enter room.");
      toast.error(readError(error, "Unable to enter room."));
    } finally {
      setBusyAction("");
    }
  };

  // modal class
  const getModalThemeClass = () => {
    const id = Number(selectedRoomId);

    switch (id) {
      case 6:
        return "modal-theme-jungle";
      case 7:
        return "modal-theme-desert";
      case 8:
        return "modal-theme-ice";
      case 9:
        return "modal-theme-volcano";
      case 10:
        return "modal-theme-temple";
      case 11:
        return "modal-theme-lab";
      default:
        return "";
    }
  };
    

  if (loadingRooms) {
    return (
      <div className="escape-game-root" style={{ "--escape-page-bg": `url(${escapeBackground})` }}>
        <section className="escape-card escape-loading-card">Loading escape rooms...</section>
      </div>
    );
  }

  if (rooms.length === 0) {
    return (
      <div className="escape-game-root" style={{ "--escape-page-bg": `url(${escapeBackground})` }}>
        <section className="escape-card escape-empty-card">
          No active escape rooms are available right now.
        </section>
      </div>
    );
  }

  return (
    <div
      className="escape-game-root"
      style={{ "--escape-page-bg": `url(${escapeBackground})` }}
    >
      <section className="escape-card escape-battlefield-card">
        <div className="escape-battle-topbar">
          <div>
            <p className="escape-kicker">BATTLEFIELD OF TRIALS</p>
            <h1>Escape Room Gateway</h1>
          </div>
          
           <div>
            <button className="escape-main-btn" onClick={() => navigate("/")}>
              Back to Dashboard
            </button>
          </div> 
        </div>
      </section>

      {systemNotice ? (
        <section
          className={`escape-card escape-server-note escape-server-note-${systemNotice.tone || "danger"}`}
        >
          <div className="escape-section-head">
            <h2>Backend Notice</h2>
            <span>{(systemNotice.tone || "info").toUpperCase()}</span>
          </div>
          <p>{systemNotice.text}</p>
          {systemNotice.requiredPreviousRoomId ? (
            <p className="escape-note-meta">
              Required previous room:{" "}
              {roomTitleMap.get(String(systemNotice.requiredPreviousRoomId)) ||
                `Room #${systemNotice.requiredPreviousRoomId}`}
            </p>
          ) : null}
          {systemNotice.requiredRoomId ? (
            <p className="escape-note-meta">
              Room key required for room #{systemNotice.requiredRoomId}.
            </p>
          ) : null}
          {systemNotice.expectedPuzzleId ? (
            <p className="escape-note-meta">
              Expected puzzle id: #{systemNotice.expectedPuzzleId}
            </p>
          ) : null}
        </section>
      ) : null}

      <section className="escape-card escape-lobby-card">
        <div
          ref={swiperRailRef}
          className="escape-swiper-rail"
          role="list"
          aria-label="Escape rooms"
          tabIndex={0}
          //  onKeyDown={handleSwiperKeyDown}
        >
          {orderedRooms.map((room) => {
            const roomState = roomStateById.get(String(room.id));
            const status = roomState?.status || "ready";
            const imageSrc = roomImageById.get(String(room.id));

            return (
              <button
                key={room.id}
                type="button"
                role="listitem"
                className={`escape-portal-card ${
                  String(room.id) === String(selectedRoomId)
                    ? "escape-portal-card-active"
                    : ""
                } escape-portal-${status}`}
                style={{ "--portal-image": `url(${imageSrc})` }}
                onClick={() => openEntryModal(room.id)}
                // onKeyDown={handleSwiperKeyDown}
                ref={(element) => {
                  if (element) {
                    roomCardRefs.current.set(String(room.id), element);
                  } else {
                    roomCardRefs.current.delete(String(room.id));
                  }
                }}
              >
                <div className="escape-slide-overlay escape-slide-top">
                  <strong>{room.title || `Room #${room.id}`}</strong>
                </div>

                <div className="escape-slide-overlay escape-slide-bottom">
                  <span>{room.difficulty || "Easy"}</span>
                  <em
                    className={`escape-status-pill escape-status-pill-${status}`}
                  >
                    {roomStatusLabel(status)}
                  </em>
                </div>
              </button>
            );
          })}
        </div>
      </section>

      {isEntryModalOpen ? (
        <div
          className="escape-entry-overlay"
          onClick={() => setIsEntryModalOpen(false)}
        >
          <section
            className={`escape-entry-modal game-card animate-zoom-in ${getModalThemeClass()}`}
            role="dialog"
            aria-modal="true"
            aria-label="Enter room"
            onClick={(event) => event.stopPropagation()}
          >
            {/* ROOM IMAGE */}
            <div
              className="escape-entry-preview game-card-image animate-vortex"
              style={{ backgroundImage: `url(${selectedRoomImage})` }}
            />

            {/* ROOM TIME */}
            <p className="escape-entry-time game-card-text">
              ⏱ Time: {selectedRoom?.time_limit_minutes ?? 0} min
            </p>

            {!requiresRoomKey ? (
              <p className="escape-muted game-card-muted">
                Room 1 does not require a key.
              </p>
            ) : (
              <>
                {!selectedRoomState.lockedBySequence &&
                selectedRoom?.room_key ? (
                  <p className="escape-muted game-card-muted">
                    🔑 Unlocked key for this room: {selectedRoom.room_key}
                  </p>
                ) : null}

                {selectedRoomState.status === "completed" &&
                selectedNextRoom?.room_key ? (
                  <p className="escape-muted game-card-muted">
                    Next room key (
                    {selectedNextRoom.title || `Room #${selectedNextRoom.id}`}):{" "}
                    {selectedNextRoom.room_key}
                  </p>
                ) : null}

                <div className="escape-room-key-wrap">
                  <input
                    id="escape-room-key"
                    type="text"
                    value={roomKey}
                    onChange={(event) => setRoomKey(event.target.value)}
                    placeholder="Enter room key"
                    disabled={busyAction !== ""}
                    autoComplete="off"
                    className="game-card-input"
                  />
                </div>
              </>
            )}

            <button
              type="button"
              className="escape-main-btn game-card-btn animate-pulse-btn"
              disabled={busyAction !== "" || selectedRoomState.lockedBySequence}
              onClick={handleEnterRoom}
            >
              {busyAction === "start" ? "Entering..." : "Enter Room"}
            </button>
          </section>
        </div>
      ) : null}
    </div>
  );
}
