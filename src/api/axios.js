import axios from "axios";

const instance = axios.create({
  baseURL: "https://zeta-ctf.onrender.com/api/",
});

// ✅ Attach correct token automatically
instance.interceptors.request.use(
  (config) => {
    const requestUrl = config.url || "";
    const isAuthEndpoint =
      requestUrl.includes("/accounts/login/") ||
      requestUrl.includes("/accounts/register/");

    if (isAuthEndpoint) {
      return config;
    }

    // If admin token exists use it, else use normal token
    const adminToken = localStorage.getItem("admin_token");
    const userToken = localStorage.getItem("token");

    const token = adminToken || userToken;

    if (token) {
      config.headers.Authorization = `Token ${token}`;
    }

    return config;
  },
  (error) => Promise.reject(error)
);

export default instance;
