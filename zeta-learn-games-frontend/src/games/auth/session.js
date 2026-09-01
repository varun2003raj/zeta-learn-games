import {
  ADMIN_TOKEN_KEY,
  ADMIN_USER_KEY,
} from "../../services/authService";

const GAMES_SESSION_KEY = "gamesAdminSession";
const GAME_ADMIN_ROLES = new Set(["admin", "game_admin"]);

function canUseStorage() {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}

function parseJson(value) {
  if (!value) return null;
  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
}

function normalizeAdminName(user = {}, fallback = "Games Admin") {
  return user.name || user.full_name || user.username || user.email || fallback;
}

function normalizeRole(user = {}, fallback = "admin") {
  return user.role || user.userType || fallback;
}

export function readGameAdminSession() {
  if (!canUseStorage()) return null;

  const accessToken = window.localStorage.getItem(ADMIN_TOKEN_KEY) || "";
  const user = parseJson(window.localStorage.getItem(ADMIN_USER_KEY));

  if (accessToken && user) {
    return {
      accessToken,
      refreshToken: "",
      role: normalizeRole(user, "admin"),
      adminName: normalizeAdminName(user),
      user,
    };
  }

  try {
    const raw = window.localStorage.getItem(GAMES_SESSION_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === "object" ? parsed : null;
  } catch {
    return null;
  }
}

export function persistGameAdminSession(meta = {}) {
  if (!canUseStorage()) return null;

  const user = meta.user && typeof meta.user === "object" ? meta.user : {};
  const accessToken = meta.accessToken || meta.token || meta.access || "";
  const refreshToken = meta.refreshToken || meta.refresh || "";

  if (!accessToken) {
    return null;
  }

  const session = {
    accessToken,
    refreshToken: "",
    role: normalizeRole(user, meta.role || "admin"),
    source: meta.source || "games-login",
    adminName: meta.adminName || meta.name || normalizeAdminName(user),
    authenticatedAt: new Date().toISOString(),
    user: {
      ...user,
      role: normalizeRole(user, meta.role || "admin"),
      name: normalizeAdminName(user),
    },
  };

  window.localStorage.setItem(ADMIN_TOKEN_KEY, accessToken);
  window.localStorage.setItem(ADMIN_USER_KEY, JSON.stringify(session.user));
  window.localStorage.setItem(GAMES_SESSION_KEY, JSON.stringify(session));

  return session;
}

export function clearGameAdminSession() {
  if (!canUseStorage()) return;
  window.localStorage.removeItem(ADMIN_TOKEN_KEY);
  window.localStorage.removeItem(ADMIN_USER_KEY);
  window.localStorage.removeItem(GAMES_SESSION_KEY);
}

export function isGameAdminAuthenticated() {
  const session = readGameAdminSession();
  const role = String(
    session?.role || session?.user?.role || session?.user?.userType || ""
  ).toLowerCase();

  return Boolean(session?.accessToken && GAME_ADMIN_ROLES.has(role));
}

export function hasMainAdminSession() {
  if (!canUseStorage()) return false;

  const token = window.localStorage.getItem("token");
  const role = String(window.localStorage.getItem("role") || "").toLowerCase();

  return Boolean(token && role === "admin");
}

export function syncGameSessionFromMainAdmin() {
  return isGameAdminAuthenticated();
}
