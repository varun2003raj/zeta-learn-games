import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useLocation, useNavigate } from "react-router-dom";
import { clearAuthError, loginAdmin } from "../../store/authSlice";
import { ADMIN_TOKEN_KEY, ADMIN_USER_KEY } from "../../services/authService";
import "../games.css";

const GAME_ADMIN_ROLES = new Set(["admin", "game_admin"]);
const AUTO_LOGIN_USERNAME = "Zetamind";
const AUTO_LOGIN_PASSWORD = "Mindzeta";

export default function AdminLogin() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const auth = useSelector((state) => state.auth);

  const [username, setUsername] = useState(AUTO_LOGIN_USERNAME);
  const [password, setPassword] = useState(AUTO_LOGIN_PASSWORD);
  const [autoLoginAttempted, setAutoLoginAttempted] = useState(false);

  const persistLoginResult = (session) => {
    if (!session?.accessToken || !session?.user) return;
    localStorage.setItem(ADMIN_TOKEN_KEY, session.accessToken);
    localStorage.setItem(ADMIN_USER_KEY, JSON.stringify(session.user));
  };

  useEffect(() => {
    const role = String(auth.user?.role || auth.user?.userType || "").toLowerCase();
    if (GAME_ADMIN_ROLES.has(role) && auth.accessToken) {
      navigate("/games/dashboard", { replace: true });
    }
  }, [auth.user, auth.accessToken, navigate]);

  useEffect(() => {
    if (autoLoginAttempted || auth.status === "loading") {
      return;
    }

    setAutoLoginAttempted(true);
    void dispatch(
      loginAdmin({
        username: AUTO_LOGIN_USERNAME,
        password: AUTO_LOGIN_PASSWORD,
      })
    ).then((result) => {
      if (loginAdmin.fulfilled.match(result)) {
        persistLoginResult(result.payload);
      }
    });
  }, [autoLoginAttempted, auth.status, dispatch]);

  useEffect(
    () => () => {
      dispatch(clearAuthError());
    },
    [dispatch]
  );

  const onSubmit = async (event) => {
    event.preventDefault();
    const result = await dispatch(loginAdmin({ username, password }));
    if (loginAdmin.fulfilled.match(result)) {
      persistLoginResult(result.payload);
      const fromPath = location.state?.from?.pathname || "/games/dashboard";
      navigate(fromPath, { replace: true });
    }
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-transparent px-4">
      <div className="absolute -left-32 top-8 h-80 w-80 rounded-full bg-sky-100/80 blur-3xl" />
      <div className="absolute -right-32 bottom-8 h-96 w-96 rounded-full bg-emerald-100/80 blur-3xl" />

      <form
        onSubmit={onSubmit}
        className="relative z-10 w-full max-w-md rounded-[28px] border border-slate-200 bg-white/95 p-8 shadow-[0_18px_40px_rgba(80,108,150,0.18)] backdrop-blur"
      >
        <p className="text-xs uppercase tracking-[0.26em] text-teal-700">
          Zetamind Games
        </p>
        <h1 className="mt-2 text-3xl font-semibold text-slate-900">
          Admin Login
        </h1>
        <p className="mt-2 text-sm text-slate-500">
          Main admin users are automatically signed in to Games Admin. You can
          also continue with the configured games credential below.
        </p>

        <div className="mt-6 space-y-4">
          <label className="block">
            <span className="mb-1 block text-sm font-medium text-slate-700">
              Username
            </span>
            <input
              type="text"
              value={username}
              onChange={(event) => setUsername(event.target.value)}
              required
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-3 text-slate-900 outline-none ring-sky-500/20 transition focus:border-sky-300 focus:ring-4"
              placeholder="Username"
            />
          </label>

          <label className="block">
            <span className="mb-1 block text-sm font-medium text-slate-700">
              Password
            </span>
            <input
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-3 text-slate-900 outline-none ring-sky-500/20 transition focus:border-sky-300 focus:ring-4"
              placeholder="********"
            />
          </label>
        </div>

        {auth.error ? (
          <div className="mt-4 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
            {auth.error}
          </div>
        ) : null}

        <button
          type="submit"
          disabled={auth.status === "loading"}
          className="mt-6 w-full rounded-xl bg-gradient-to-r from-teal-500 to-sky-600 px-4 py-3 text-sm font-semibold text-white transition hover:from-teal-600 hover:to-sky-700 disabled:cursor-not-allowed disabled:opacity-70"
        >
          {auth.status === "loading" ? "Signing in..." : "Sign In"}
        </button>
      </form>
    </div>
  );
}
