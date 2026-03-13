import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useLocation, useNavigate } from "react-router-dom";
import { clearAuthError, loginAdmin } from "../../store/authSlice";

export default function AdminLogin() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const auth = useSelector((state) => state.auth);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  useEffect(() => {
    if (auth.user?.role === "admin" && auth.accessToken) {
      navigate("/admin/dashboard", { replace: true });
    }
  }, [auth.user, auth.accessToken, navigate]);

  useEffect(
    () => () => {
      dispatch(clearAuthError());
    },
    [dispatch]
  );

  const onSubmit = async (event) => {
    event.preventDefault();
    const result = await dispatch(loginAdmin({ email, password }));
    if (loginAdmin.fulfilled.match(result)) {
      const fromPath = location.state?.from?.pathname || "/admin/dashboard";
      navigate(fromPath, { replace: true });
    }
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-slate-950 px-4">
      <div className="absolute -left-32 top-8 h-80 w-80 rounded-full bg-blue-500/20 blur-3xl" />
      <div className="absolute -right-32 bottom-8 h-96 w-96 rounded-full bg-indigo-500/20 blur-3xl" />

      <form
        onSubmit={onSubmit}
        className="relative z-10 w-full max-w-md rounded-3xl border border-slate-700 bg-slate-900/85 p-8 shadow-2xl backdrop-blur"
      >
        <p className="text-xs uppercase tracking-[0.26em] text-blue-300">
          Escape Room Control
        </p>
        <h1 className="mt-2 text-3xl font-semibold text-slate-50">
          Admin Login
        </h1>
        <p className="mt-2 text-sm text-slate-400">
          Email and password are required. Admin role is enforced.
        </p>

        <div className="mt-6 space-y-4">
          <label className="block">
            <span className="mb-1 block text-sm font-medium text-slate-300">
              Email
            </span>
            <input
              type="text"
           
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
              className="w-full rounded-xl border border-slate-700 bg-slate-800 px-3 py-3 text-slate-100 outline-none ring-blue-500/40 transition focus:ring-2"
              placeholder="User Name"
            />
          </label>

          <label className="block">
            <span className="mb-1 block text-sm font-medium text-slate-300">
              Password
            </span>
            <input
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
              className="w-full rounded-xl border border-slate-700 bg-slate-800 px-3 py-3 text-slate-100 outline-none ring-blue-500/40 transition focus:ring-2"
              placeholder="********"
            />
          </label>
        </div>

        {auth.error ? (
          <div className="mt-4 rounded-xl border border-rose-500/40 bg-rose-900/30 px-3 py-2 text-sm text-rose-100">
            {auth.error}
          </div>
        ) : null}

        <button
          type="submit"
          disabled={auth.status === "loading"}
          className="mt-6 w-full rounded-xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-70"
        >
          {auth.status === "loading" ? "Signing in..." : "Sign In"}
        </button>
      </form>
    </div>
  );
}
