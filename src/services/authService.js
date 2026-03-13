import api from "./api";

export const ADMIN_ACCESS_TOKEN_KEY = "admin_access_token";
export const ADMIN_REFRESH_TOKEN_KEY = "admin_refresh_token";
export const ADMIN_USER_KEY = "admin_user";
export const ADMIN_THEME_KEY = "admin_theme";

const parseUser = (value) => {
  if (!value) return null;
  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
};

const getAccessToken = (payload) =>
  payload?.access ||
  payload?.access_token ||
  payload?.token ||
  payload?.jwt ||
  payload?.tokens?.access ||
  "";

const getRefreshToken = (payload) =>
  payload?.refresh || payload?.refresh_token || payload?.tokens?.refresh || "";

const isAdminUser = (user) => {
  const role = String(user?.role || "").toLowerCase();
  return role === "admin";
};

const persistSession = ({ accessToken, refreshToken, user }) => {
  localStorage.setItem(ADMIN_ACCESS_TOKEN_KEY, accessToken);
  if (refreshToken) {
    localStorage.setItem(ADMIN_REFRESH_TOKEN_KEY, refreshToken);
  } else {
    localStorage.removeItem(ADMIN_REFRESH_TOKEN_KEY);
  }
  localStorage.setItem(ADMIN_USER_KEY, JSON.stringify(user));
};

const clearSession = () => {
  localStorage.removeItem(ADMIN_ACCESS_TOKEN_KEY);
  localStorage.removeItem(ADMIN_REFRESH_TOKEN_KEY);
  localStorage.removeItem(ADMIN_USER_KEY);
};

const authService = {
  async loginAdmin({ email, password }) {
    const identifier = String(email || "").trim();
    const response = await api.post("/accounts/login/", {
      email: identifier,
      username: identifier,
      password,
    });

    const payload = response.data || {};
    const accessToken = getAccessToken(payload);
    const refreshToken = getRefreshToken(payload);
    const user = payload.user || payload.profile || null;

    if (!accessToken || !user) {
      throw new Error("Invalid login response from server.");
    }

    if (!isAdminUser(user)) {
      throw new Error("Access denied. Admin role required.");
    }

    persistSession({ accessToken, refreshToken, user });
    return { accessToken, refreshToken, user };
  },

  logoutAdmin() {
    clearSession();
  },

  getStoredSession() {
    const accessToken = localStorage.getItem(ADMIN_ACCESS_TOKEN_KEY) || "";
    const refreshToken = localStorage.getItem(ADMIN_REFRESH_TOKEN_KEY) || "";
    const user = parseUser(localStorage.getItem(ADMIN_USER_KEY));

    if (!accessToken || !user || !isAdminUser(user)) {
      return { accessToken: "", refreshToken: "", user: null };
    }

    return { accessToken, refreshToken, user };
  },

  isAdminUser,
};

export default authService;
