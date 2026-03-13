import api from "./api";

const ROOM_BASE = "/escape/admin/rooms/";
const PUZZLE_BASE = "/escape/admin/puzzles/";
const HINT_BASE = "/escape/admin/hints/";
const PROGRESS_BASE = "/escape/admin/progress/";
const ATTEMPT_BASE = "/escape/admin/attempts/";
const CONTROL_STATE_BASE = "/escape/admin/state/";
const CONTROL_START_BASE = "/escape/admin/start/";
const CONTROL_FINISH_BASE = "/escape/admin/finish/";
const CONTROL_RESET_BASE = "/escape/admin/reset/";
const PLAYER_ROOM_BASE = "/escape/rooms/";
const PLAYER_START_BASE = "/escape/start/";
const PLAYER_SUBMIT_BASE = "/escape/submit/";
const PLAYER_HINT_BASE = "/escape/hint/";
const PLAYER_PROGRESS_BASE = "/escape/progress/";
const PLAYER_ATTEMPT_BASE = "/escape/attempts/";
const PLAYER_LEADERBOARD_BASE = "/escape/leaderboard/";

const normalizeCollection = (payload) => {
  if (Array.isArray(payload)) {
    return {
      results: payload,
      count: payload.length,
      next: null,
      previous: null,
    };
  }

  if (payload && Array.isArray(payload.results)) {
    return {
      results: payload.results,
      count: Number(payload.count ?? payload.results.length),
      next: payload.next ?? null,
      previous: payload.previous ?? null,
    };
  }

  if (payload && Array.isArray(payload.data)) {
    return {
      results: payload.data,
      count: Number(payload.count ?? payload.data.length),
      next: payload.next ?? null,
      previous: payload.previous ?? null,
    };
  }

  return {
    results: [],
    count: 0,
    next: null,
    previous: null,
  };
};

const toBoolean = (value) => {
  if (typeof value === "boolean") return value;
  if (typeof value === "number") return value === 1;
  const normalized = String(value || "").trim().toLowerCase();
  return ["true", "1", "yes", "active", "completed"].includes(normalized);
};

const toNumber = (value, fallback = 0) => {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : fallback;
};

const normalizeDifficultyForApi = (value) => {
  const upper = String(value || "").trim().toUpperCase();
  if (["EASY", "MEDIUM", "HARD", "EXTREME"].includes(upper)) return upper;
  if (upper === "EXPERT") return "EXTREME";
  if (upper === "EASY") return "EASY";
  return "EASY";
};

const normalizeDifficultyForUi = (value) => {
  const upper = String(value || "").trim().toUpperCase();
  if (upper === "MEDIUM") return "Medium";
  if (upper === "HARD") return "Hard";
  if (upper === "EXTREME" || upper === "EXPERT") return "Extreme";
  return "Easy";
};

const normalizeHint = (hint = {}) => {
  const puzzleId = hint?.puzzle?.id || hint?.puzzle || hint?.puzzle_id || "";
  const penaltyPoints = toNumber(hint?.penalty_points ?? hint?.points, 0);
  const text = String(hint?.text || hint?.question_text || "").trim();

  return {
    ...hint,
    id: hint?.id,
    puzzle: puzzleId,
    level: puzzleId,
    text,
    question_text: text,
    penalty_points: penaltyPoints,
    points: penaltyPoints,
    is_active: true,
  };
};

const normalizePuzzle = (puzzle = {}) => {
  const roomId = puzzle?.room?.id || puzzle?.room || puzzle?.room_id || "";
  const hints = Array.isArray(puzzle?.hints)
    ? puzzle.hints.map((hint) => normalizeHint(hint))
    : [];
  const order = toNumber(puzzle?.order, 1);

  return {
    ...puzzle,
    id: puzzle?.id,
    room: roomId,
    escape_room: roomId,
    level_number: order,
    title: String(puzzle?.title || "").trim(),
    description: String(puzzle?.description || "").trim(),
    order,
    points: toNumber(puzzle?.points, 0),
    is_active: toBoolean(puzzle?.is_active ?? true),
    hints,
    questions_count: hints.length,
  };
};

const normalizeRoom = (room = {}) => {
  const puzzles = Array.isArray(room?.puzzles)
    ? room.puzzles.map((puzzle) => normalizePuzzle(puzzle))
    : [];
  const totalPoints = puzzles.reduce(
    (total, puzzle) => total + toNumber(puzzle?.points, 0),
    0
  );
  const isActive = toBoolean(room?.is_active ?? room?.is_published ?? true);

  const normalizedRoomKey = String(
    room?.room_key ??
      room?.unlock_key ??
      room?.unlockKey ??
      room?.key ??
      ""
  ).trim();

  return {
    ...room,
    id: room?.id ?? room?._id ?? room?.pk,
    title: String(room?.title || "").trim(),
    description: String(room?.description || "").trim(),
    difficulty: normalizeDifficultyForUi(room?.difficulty),
    time_limit_minutes: toNumber(room?.time_limit_minutes, 5),
    room_key: normalizedRoomKey,
    unlock_key: normalizedRoomKey,
    is_active: isActive,
    is_published: isActive,
    created_at: room?.created_at || null,
    puzzles,
    levels_count: puzzles.length,
    level_count: puzzles.length,
    total_points: totalPoints,
  };
};

const normalizeProgress = (progress = {}, roomTitleMap = new Map()) => {
  const roomId = progress?.room?.id || progress?.room || "";
  const roomTitle =
    roomTitleMap.get(roomId) ||
    roomTitleMap.get(toNumber(roomId, roomId)) ||
    `Room #${roomId || "-"}`;
  const currentPuzzle = normalizePuzzle(progress?.current_puzzle || {});

  return {
    ...progress,
    id: progress?.id,
    room: { id: roomId, title: roomTitle },
    room_name: roomTitle,
    escape_room: { id: roomId, title: roomTitle },
    current_level: currentPuzzle?.title || "-",
    current_puzzle: currentPuzzle,
    score: toNumber(progress?.total_score, 0),
    total_score: toNumber(progress?.total_score, 0),
    remaining_time_seconds: toNumber(progress?.remaining_time_seconds, 0),
    completed: toBoolean(progress?.completed),
    failed: toBoolean(progress?.failed),
    started_at: progress?.started_at || null,
    start_time: progress?.started_at || null,
    completed_at: progress?.completed_at || null,
    end_time: progress?.completed_at || null,
    expires_at: progress?.expires_at || null,
    user_name: progress?.user_name || "-",
    username: progress?.username || "-",
  };
};

const normalizeAttempt = (attempt = {}) => ({
  ...attempt,
  id: attempt?.id,
  user: attempt?.user ?? null,
  puzzle: attempt?.puzzle?.id || attempt?.puzzle || "",
  puzzle_id: attempt?.puzzle?.id || attempt?.puzzle || "",
  submitted_answer: String(attempt?.submitted_answer || "").trim(),
  is_correct: toBoolean(attempt?.is_correct),
  submitted_at: attempt?.submitted_at || null,
});

const normalizeLeaderboardEntry = (entry = {}) => ({
  ...entry,
  id: entry?.id,
  user: entry?.user ?? null,
  username: String(entry?.username || entry?.user_name || "Unknown"),
  room: entry?.room?.id || entry?.room || "",
  score: toNumber(entry?.score, 0),
  completion_time_seconds: toNumber(entry?.completion_time_seconds, 0),
  completed_at: entry?.completed_at || null,
  completed: toBoolean(entry?.completed ?? entry?.completed_at),
  rank: toNumber(entry?.rank, 0),
});

const normalizeControlState = (payload = {}) => ({
  status: String(payload?.status || "draft"),
  started_at: payload?.started_at || null,
  finished_at: payload?.finished_at || null,
  updated_at: payload?.updated_at || null,
  message: payload?.message || "",
});

const buildRoomPayload = (payload = {}, partial = false, roomKeyField = "unlock_key") => {
  const nextPayload = {};

  const normalizedRoomKey = String(
    payload?.unlock_key ?? payload?.room_key ?? payload?.unlockKey ?? payload?.key ?? ""
  ).trim();

  if (!partial || payload?.title !== undefined) {
    nextPayload.title = String(payload?.title || "").trim();
  }
  if (!partial || payload?.description !== undefined) {
    nextPayload.description = String(payload?.description || "").trim();
  }
  if (!partial || payload?.difficulty !== undefined) {
    nextPayload.difficulty = normalizeDifficultyForApi(payload?.difficulty);
  }
  if (!partial || payload?.time_limit_minutes !== undefined) {
    nextPayload.time_limit_minutes = toNumber(payload?.time_limit_minutes, 5);
  }
  if (
    !partial ||
    payload?.room_key !== undefined ||
    payload?.unlock_key !== undefined ||
    payload?.unlockKey !== undefined ||
    payload?.key !== undefined
  ) {
    nextPayload[roomKeyField] = normalizedRoomKey;
  }
  if (
    !partial ||
    payload?.is_active !== undefined ||
    payload?.is_published !== undefined
  ) {
    nextPayload.is_active = toBoolean(
      payload?.is_active ?? payload?.is_published ?? true
    );
  }

  return nextPayload;
};

const hasUnknownFieldError = (error, fieldName) => {
  const fieldErrors = error?.response?.data?.[fieldName];
  if (!fieldErrors) return false;
  if (!Array.isArray(fieldErrors)) {
    return String(fieldErrors).toLowerCase().includes("not allowed");
  }
  return fieldErrors.some((message) => String(message).toLowerCase().includes("not allowed"));
};

const buildPuzzlePayload = (payload = {}, partial = false) => {
  const roomId = payload?.escape_room ?? payload?.room ?? "";
  const order = payload?.order ?? payload?.level_number ?? 1;
  const answer = payload?.answer ?? "";

  const nextPayload = {};
  if (!partial || roomId !== "") {
    nextPayload.room = toNumber(roomId, 0);
  }
  if (!partial || payload?.title !== undefined) {
    nextPayload.title = String(payload?.title || "").trim();
  }
  if (!partial || payload?.description !== undefined) {
    nextPayload.description = String(payload?.description || "").trim();
  }
  if (!partial || payload?.points !== undefined) {
    nextPayload.points = toNumber(payload?.points, 0);
  }
  if (!partial || payload?.order !== undefined || payload?.level_number !== undefined) {
    nextPayload.order = toNumber(order, 1);
  }
  if (!partial || payload?.is_active !== undefined) {
    nextPayload.is_active = toBoolean(payload?.is_active ?? true);
  }
  if (!partial || payload?.answer !== undefined) {
    nextPayload.answer = String(answer || "").trim();
  }

  if (partial && !nextPayload.answer) {
    delete nextPayload.answer;
  }

  return nextPayload;
};

const buildHintPayload = (payload = {}, partial = false) => {
  const puzzleId = payload?.puzzle ?? payload?.level ?? payload?.level_id ?? "";
  const text = payload?.text ?? payload?.question_text ?? payload?.hint ?? "";
  const penaltyPoints = payload?.penalty_points ?? payload?.points ?? 2;

  const nextPayload = {};
  if (!partial || puzzleId !== "") {
    nextPayload.puzzle = toNumber(puzzleId, 0);
  }
  if (!partial || payload?.text !== undefined || payload?.question_text !== undefined) {
    nextPayload.text = String(text || "").trim();
  }
  if (
    !partial ||
    payload?.penalty_points !== undefined ||
    payload?.points !== undefined
  ) {
    nextPayload.penalty_points = toNumber(penaltyPoints, 2);
  }
  return nextPayload;
};

const mapAttempts = (attempts) =>
  [...attempts].sort((a, b) => {
    const aValue = new Date(a?.start_time || a?.started_at || 0).getTime() || 0;
    const bValue = new Date(b?.start_time || b?.started_at || 0).getTime() || 0;
    return bValue - aValue;
  });

const withApiError = (error, fallback) =>
  error?.response?.data?.detail ||
  error?.response?.data?.error ||
  error?.message ||
  fallback;

const escapeService = {
  normalizeCollection,
  withApiError,

  async collectAllPages(loader, initialQuery = {}) {
    const aggregated = [];
    let page = Number(initialQuery.page || 1);
    let keepLoading = true;
    let guard = 0;

    while (keepLoading && guard < 100) {
      const collection = await loader({ ...initialQuery, page });
      aggregated.push(...collection.results);

      keepLoading = Boolean(collection.next);
      page += 1;
      guard += 1;
    }

    return aggregated;
  },

  async _listRoomsPage({ page = 1 } = {}) {
    const response = await api.get(ROOM_BASE, { params: { page } });
    const collection = normalizeCollection(response.data);
    return {
      ...collection,
      results: collection.results.map((room) => normalizeRoom(room)),
    };
  },

  async listRooms({ search = "", difficulty = "all", page = 1, pageSize = 10 } = {}) {
    const allRooms = await this.collectAllPages(
      (query) => this._listRoomsPage(query),
      { page: 1 }
    );

    const normalizedSearch = String(search || "").trim().toLowerCase();
    const normalizedDifficulty = String(difficulty || "all").trim().toLowerCase();

    const filtered = allRooms.filter((room) => {
      const matchesSearch =
        !normalizedSearch ||
        room.title.toLowerCase().includes(normalizedSearch) ||
        room.description.toLowerCase().includes(normalizedSearch);
      const matchesDifficulty =
        normalizedDifficulty === "all" ||
        room.difficulty.toLowerCase() === normalizedDifficulty;
      return matchesSearch && matchesDifficulty;
    });

    const safePageSize = Math.max(1, toNumber(pageSize, 10));
    const safePage = Math.max(1, toNumber(page, 1));
    const start = (safePage - 1) * safePageSize;
    const end = start + safePageSize;
    const results = filtered.slice(start, end);
    const count = filtered.length;
    const next = end < count ? `page=${safePage + 1}` : null;
    const previous = safePage > 1 ? `page=${safePage - 1}` : null;

    return { results, count, next, previous };
  },

  async listAllRooms({ search = "", difficulty = "all" } = {}) {
    const allRooms = await this.collectAllPages(
      (query) => this._listRoomsPage(query),
      { page: 1 }
    );

    const normalizedSearch = String(search || "").trim().toLowerCase();
    const normalizedDifficulty = String(difficulty || "all").trim().toLowerCase();

    return allRooms.filter((room) => {
      const matchesSearch =
        !normalizedSearch ||
        room.title.toLowerCase().includes(normalizedSearch) ||
        room.description.toLowerCase().includes(normalizedSearch);
      const matchesDifficulty =
        normalizedDifficulty === "all" ||
        room.difficulty.toLowerCase() === normalizedDifficulty;
      return matchesSearch && matchesDifficulty;
    });
  },

  async _listPlayableRoomsPage({ page = 1 } = {}) {
    const response = await api.get(PLAYER_ROOM_BASE, { params: { page } });
    const collection = normalizeCollection(response.data);
    return {
      ...collection,
      results: collection.results.map((room) => normalizeRoom(room)),
    };
  },

  async listPlayableRooms({ search = "", difficulty = "all", page = 1, pageSize = 12 } = {}) {
    const allRooms = await this.collectAllPages(
      (query) => this._listPlayableRoomsPage(query),
      { page: 1 }
    );

    const normalizedSearch = String(search || "").trim().toLowerCase();
    const normalizedDifficulty = String(difficulty || "all").trim().toLowerCase();
    const filtered = allRooms.filter((room) => {
      const matchesSearch =
        !normalizedSearch ||
        room.title.toLowerCase().includes(normalizedSearch) ||
        room.description.toLowerCase().includes(normalizedSearch);
      const matchesDifficulty =
        normalizedDifficulty === "all" ||
        room.difficulty.toLowerCase() === normalizedDifficulty;
      return matchesSearch && matchesDifficulty;
    });

    const safePageSize = Math.max(1, toNumber(pageSize, 12));
    const safePage = Math.max(1, toNumber(page, 1));
    const start = (safePage - 1) * safePageSize;
    const end = start + safePageSize;
    const results = filtered.slice(start, end);
    const count = filtered.length;
    const next = end < count ? `page=${safePage + 1}` : null;
    const previous = safePage > 1 ? `page=${safePage - 1}` : null;

    return { results, count, next, previous };
  },

  async getPlayableRoom(roomId) {
    const response = await api.get(`${PLAYER_ROOM_BASE}${roomId}/`);
    return normalizeRoom(response.data);
  },

  async startRoom(roomId, roomKey = "") {
    const payload = {
      room_id: toNumber(roomId, 0),
    };
    const normalizedRoomKey = String(roomKey || "").trim();
    if (normalizedRoomKey) {
      payload.room_key = normalizedRoomKey;
    }

    const response = await api.post(PLAYER_START_BASE, payload);
    return normalizeProgress(response.data);
  },

  async submitAnswer({ puzzleId, answer }) {
    const response = await api.post(PLAYER_SUBMIT_BASE, {
      puzzle_id: toNumber(puzzleId, 0),
      answer: String(answer || "").trim(),
    });
    const payload = response?.data || {};
    return {
      ...payload,
      attempt: payload?.attempt ? normalizeAttempt(payload.attempt) : null,
      progress: payload?.progress ? normalizeProgress(payload.progress) : null,
      next_puzzle_hint: payload?.next_puzzle_hint
        ? {
            hint_id: payload.next_puzzle_hint.hint_id,
            hint_text: String(payload.next_puzzle_hint.hint_text || "").trim(),
          }
        : null,
      next_room_id: payload?.next_room_id || null,
      next_room_title: String(payload?.next_room_title || "").trim(),
      next_room_key: String(
        payload?.next_room_key ??
          payload?.next_room_unlock_key ??
          payload?.unlock_key ??
          payload?.room_key ??
          ""
      ).trim(),
      expected_puzzle_id: payload?.expected_puzzle_id || null,
      required_previous_room_id: payload?.required_previous_room_id || null,
    };
  },

  async requestHint({ puzzleId, hintId = "" }) {
    const payload = {
      puzzle_id: toNumber(puzzleId, 0),
    };
    if (hintId !== "" && hintId !== null && hintId !== undefined) {
      payload.hint_id = toNumber(hintId, 0);
    }

    const response = await api.post(PLAYER_HINT_BASE, payload);
    return {
      ...response.data,
      hint_id: response?.data?.hint_id,
      hint_text: String(response?.data?.hint_text || "").trim(),
      penalty_points: toNumber(response?.data?.penalty_points, 0),
      total_score: toNumber(response?.data?.total_score, 0),
    };
  },

  async getMyProgress({ roomId = "" } = {}) {
    const params = {};
    if (roomId) params.room_id = roomId;

    try {
      const response = await api.get(PLAYER_PROGRESS_BASE, { params });
      if (Array.isArray(response.data)) {
        const rows = response.data.map((row) => normalizeProgress(row));
        return rows[0] || null;
      }
      return normalizeProgress(response.data);
    } catch (error) {
      if (error?.response?.status === 404) {
        return null;
      }
      throw error;
    }
  },

  async listMyProgress({ roomId = "", all = true } = {}) {
    const params = {};
    if (roomId) params.room_id = roomId;
    if (all) params.all = 1;

    const response = await api.get(PLAYER_PROGRESS_BASE, { params });
    const rows = Array.isArray(response.data) ? response.data : [response.data];
    return rows.map((row) => normalizeProgress(row));
  },

  async listMyAttempts({ roomId = "", puzzleId = "" } = {}) {
    const params = {};
    if (roomId) params.room_id = roomId;
    if (puzzleId) params.puzzle_id = puzzleId;

    const response = await api.get(PLAYER_ATTEMPT_BASE, { params });
    const rows = Array.isArray(response.data)
      ? response.data
      : normalizeCollection(response.data).results;
    return rows.map((row) => normalizeAttempt(row));
  },

  async listLeaderboard({ roomId = "" } = {}) {
    if (roomId) {
      return this.getRoomLeaderboard(roomId);
    }
    const response = await api.get(PLAYER_LEADERBOARD_BASE);
    const rows = Array.isArray(response.data)
      ? response.data
      : normalizeCollection(response.data).results;
    return rows.map((row) => normalizeLeaderboardEntry(row));
  },

  async getRoomLeaderboard(roomId) {
    const response = await api.get(`${PLAYER_LEADERBOARD_BASE}${roomId}/`);
    const rows = Array.isArray(response.data)
      ? response.data
      : normalizeCollection(response.data).results;
    return rows.map((row) => normalizeLeaderboardEntry(row));
  },

  async getControlState() {
    const response = await api.get(CONTROL_STATE_BASE);
    return normalizeControlState(response.data);
  },

  async startEscapeEvent() {
    const response = await api.post(CONTROL_START_BASE);
    return normalizeControlState(response.data);
  },

  async finishEscapeEvent() {
    const response = await api.post(CONTROL_FINISH_BASE);
    return normalizeControlState(response.data);
  },

  async resetEscapeEvent() {
    const response = await api.post(CONTROL_RESET_BASE);
    return normalizeControlState(response.data);
  },

  async createRoom(payload) {
    try {
      const response = await api.post(ROOM_BASE, buildRoomPayload(payload, false, "unlock_key"));
      return normalizeRoom(response.data);
    } catch (error) {
      if (hasUnknownFieldError(error, "unlock_key")) {
        const response = await api.post(ROOM_BASE, buildRoomPayload(payload, false, "room_key"));
        return normalizeRoom(response.data);
      }
      throw error;
    }
  },

  async getRoom(roomId) {
    const response = await api.get(`${ROOM_BASE}${roomId}/`);
    return normalizeRoom(response.data);
  },

  async updateRoom(roomId, payload) {
    try {
      const response = await api.patch(
        `${ROOM_BASE}${roomId}/`,
        buildRoomPayload(payload, true, "unlock_key")
      );
      return normalizeRoom(response.data);
    } catch (error) {
      if (hasUnknownFieldError(error, "unlock_key")) {
        const response = await api.patch(
          `${ROOM_BASE}${roomId}/`,
          buildRoomPayload(payload, true, "room_key")
        );
        return normalizeRoom(response.data);
      }
      throw error;
    }
  },

  async deleteRoom(roomId) {
    await api.delete(`${ROOM_BASE}${roomId}/`);
  },

  async toggleRoomPublish(roomId, isPublished) {
    return this.updateRoom(roomId, { is_active: isPublished });
  },

  async _listPuzzlesPage({ page = 1, roomId = "" } = {}) {
    const params = { page };
    if (roomId) params.room_id = roomId;
    const response = await api.get(PUZZLE_BASE, { params });
    const collection = normalizeCollection(response.data);
    return {
      ...collection,
      results: collection.results.map((puzzle) => normalizePuzzle(puzzle)),
    };
  },

  async listLevelsByRoom(roomId) {
    return this._listPuzzlesPage({ page: 1, roomId });
  },

  async listAllPuzzles({ roomId = "" } = {}) {
    return this.collectAllPages(
      (query) => this._listPuzzlesPage({ ...query, roomId }),
      { page: 1 }
    );
  },

  async createLevel(payload) {
    const response = await api.post(PUZZLE_BASE, buildPuzzlePayload(payload, false));
    return normalizePuzzle(response.data);
  },

  async getLevel(levelId) {
    const response = await api.get(`${PUZZLE_BASE}${levelId}/`);
    return normalizePuzzle(response.data);
  },

  async updateLevel(levelId, payload) {
    const response = await api.patch(
      `${PUZZLE_BASE}${levelId}/`,
      buildPuzzlePayload(payload, true)
    );
    return normalizePuzzle(response.data);
  },

  async deleteLevel(levelId) {
    await api.delete(`${PUZZLE_BASE}${levelId}/`);
  },

  async _listHintsPage({ page = 1, puzzleId = "" } = {}) {
    const params = { page };
    if (puzzleId) params.puzzle_id = puzzleId;
    const response = await api.get(HINT_BASE, { params });
    const collection = normalizeCollection(response.data);
    return {
      ...collection,
      results: collection.results.map((hint) => normalizeHint(hint)),
    };
  },

  async listQuestionsByLevel(levelId) {
    return this._listHintsPage({ page: 1, puzzleId: levelId });
  },

  async listAllHints({ puzzleId = "" } = {}) {
    return this.collectAllPages(
      (query) => this._listHintsPage({ ...query, puzzleId }),
      { page: 1 }
    );
  },

  async createQuestion(payload) {
    const response = await api.post(HINT_BASE, buildHintPayload(payload, false));
    return normalizeHint(response.data);
  },

  async getQuestion(questionId) {
    const response = await api.get(`${HINT_BASE}${questionId}/`);
    return normalizeHint(response.data);
  },

  async updateQuestion(questionId, payload) {
    const response = await api.patch(
      `${HINT_BASE}${questionId}/`,
      buildHintPayload(payload, true)
    );
    return normalizeHint(response.data);
  },

  async deleteQuestion(questionId) {
    await api.delete(`${HINT_BASE}${questionId}/`);
  },

  async _listProgressPage({ page = 1, roomId = "", userId = "" } = {}) {
    const params = { page };
    if (roomId) params.room_id = roomId;
    if (userId) params.user_id = userId;
    const response = await api.get(PROGRESS_BASE, { params });
    const collection = normalizeCollection(response.data);
    return collection;
  },

  async listAllProgress({ roomId = "", userId = "" } = {}) {
    const rooms = await this.listAllRooms();
    const roomTitleMap = new Map(rooms.map((room) => [room.id, room.title]));
    const rows = await this.collectAllPages(
      (query) => this._listProgressPage({ ...query, roomId, userId }),
      { page: 1 }
    );
    return rows.map((row) => normalizeProgress(row, roomTitleMap));
  },

  async listAttempts({
    roomId = "",
    userId = "",
    completed = "all",
    page = 1,
    pageSize = 10,
  } = {}) {
    let rows = await this.listAllProgress({ roomId, userId });

    if (completed === "completed") {
      rows = rows.filter((row) => Boolean(row.completed));
    } else if (completed === "incomplete") {
      rows = rows.filter((row) => !row.completed && !row.failed);
    } else if (completed === "failed") {
      rows = rows.filter((row) => Boolean(row.failed));
    }

    const safePageSize = Math.max(1, toNumber(pageSize, 10));
    const safePage = Math.max(1, toNumber(page, 1));
    const start = (safePage - 1) * safePageSize;
    const end = start + safePageSize;

    return {
      results: rows.slice(start, end),
      count: rows.length,
      next: end < rows.length ? `page=${safePage + 1}` : null,
      previous: safePage > 1 ? `page=${safePage - 1}` : null,
    };
  },

  async listSubmissions({
    roomId = "",
    userId = "",
    puzzleId = "",
    page = 1,
    pageSize = 10,
  } = {}) {
    const params = { page };
    if (roomId) params.room_id = roomId;
    if (userId) params.user_id = userId;
    if (puzzleId) params.puzzle_id = puzzleId;
    if (pageSize) params.page_size = pageSize;

    const response = await api.get(ATTEMPT_BASE, { params });
    const collection = normalizeCollection(response.data);
    return {
      ...collection,
      results: collection.results.map((row) => normalizeAttempt(row)),
    };
  },

  async getDashboardStats() {
    const [rooms, puzzles, hints, progressRows] = await Promise.all([
      this.listAllRooms(),
      this.listAllPuzzles(),
      this.listAllHints(),
      this.listAllProgress(),
    ]);

    const attemptsByRoomMap = new Map();
    progressRows.forEach((row) => {
      const roomId = row?.room?.id || row?.escape_room?.id || "unknown";
      const roomTitle =
        row?.room?.title || row?.escape_room?.title || row?.room_name || "Unknown Room";
      const current = attemptsByRoomMap.get(roomId) || {
        roomId,
        roomTitle,
        total: 0,
        completed: 0,
      };
      current.total += 1;
      if (row.completed) current.completed += 1;
      attemptsByRoomMap.set(roomId, current);
    });

    const attemptsByRoom = [...attemptsByRoomMap.values()].sort(
      (a, b) => b.total - a.total
    );

    const completionSummary = {
      completed: progressRows.filter((row) => row.completed).length,
      inProgress: progressRows.filter((row) => !row.completed && !row.failed).length,
    };

    return {
      totals: {
        rooms: rooms.length,
        levels: puzzles.length,
        questions: hints.length,
        attempts: progressRows.length,
        completedUsers: completionSummary.completed,
      },
      attemptsByRoom,
      completionSummary,
      recentAttempts: mapAttempts(progressRows).slice(0, 8),
    };
  },
};

export default escapeService;
