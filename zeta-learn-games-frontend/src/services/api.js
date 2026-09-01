import axios from "axios";

const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8000";

const stripTrailingSlash = (value) => value.replace(/\/+$/, "");

const withAuthPrefix = (token) => {
  if (!token) return "";
  if (/^Bearer\s/i.test(token) || /^Token\s/i.test(token)) {
    return token;
  }

  // Prefer Token auth for opaque keys, Bearer for JWT-shaped tokens.
  const isJwtLike = token.split(".").length === 3;
  return isJwtLike ? `Bearer ${token}` : `Token ${token}`;
};

const clearAdminSession = () => {
  localStorage.removeItem("admin_access_token");
  localStorage.removeItem("admin_refresh_token");
  localStorage.removeItem("admin_user");
};

const clearPlayerSession = () => {
  localStorage.removeItem("token");
  localStorage.removeItem("user");
};

const isAuthEndpoint = (requestUrl = "") =>
  requestUrl.includes("/accounts/login/") || requestUrl.includes("/accounts/register/");

const isAdminApiRequest = (requestUrl = "") =>
  String(requestUrl || "").toLowerCase().includes("/admin/");

const resolveTokenForRequest = (requestUrl = "") => {
  const adminAccessToken = localStorage.getItem("admin_access_token") || "";
  const adminLegacyToken = localStorage.getItem("admin_token") || "";
  const userToken = localStorage.getItem("token") || "";

  // Player APIs should prefer the player session token.
  if (!isAdminApiRequest(requestUrl)) {
    return userToken || adminAccessToken || adminLegacyToken || "";
  }

  // Admin APIs should never pick player token first.
  return adminAccessToken || adminLegacyToken || "";
};

const swapAuthScheme = (authorizationValue = "") => {
  const value = String(authorizationValue || "").trim();
  if (!value) return "";

  if (/^Bearer\s/i.test(value)) {
    return value.replace(/^Bearer\s+/i, "Token ");
  }
  if (/^Token\s/i.test(value)) {
    return value.replace(/^Token\s+/i, "Bearer ");
  }
  return "";
};

const api = axios.create({
  baseURL: `${stripTrailingSlash(API_BASE)}/api`,
  timeout: 15000,
});

api.interceptors.request.use(
  (config) => {
    const requestUrl = config?.url || "";
    if (isAuthEndpoint(requestUrl)) {
      return config;
    }

    const token = resolveTokenForRequest(requestUrl);
    if (token) {
      config.headers.Authorization = withAuthPrefix(token);
    }
    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error?.response?.status;
    const requestUrl = String(error?.config?.url || "");
    const isLoginRequest = isAuthEndpoint(requestUrl);
    const requestIsAdmin = isAdminApiRequest(requestUrl);
    const originalRequest = error?.config;
    const sentAuthHeader = String(originalRequest?.headers?.Authorization || "");
    const hasAuthHeader = Boolean(sentAuthHeader);

    if (status === 401 && !isLoginRequest && hasAuthHeader) {
      const retryHeader = swapAuthScheme(sentAuthHeader);
      if (retryHeader && !originalRequest?._authSchemeRetried) {
        originalRequest._authSchemeRetried = true;
        originalRequest.headers = {
          ...(originalRequest.headers || {}),
          Authorization: retryHeader,
        };
        return api.request(originalRequest);
      }

      const isInsideAdmin = window.location.pathname.startsWith("/admin");
      if (isInsideAdmin || requestIsAdmin) {
        clearAdminSession();
      } else {
        clearPlayerSession();
      }

      if (!isInsideAdmin && window.location.pathname !== "/login") {
        window.location.href = "/login";
      }

      if (isInsideAdmin && window.location.pathname !== "/admin/login") {
        window.location.href = "/admin/login";
      }
    }

    return Promise.reject(error);
  }
);

export default api;
