import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "../api/axios";
import PublicNavbar from "../components/PublicNavbar";
import useRotatingPublicTheme from "../hooks/useRotatingPublicTheme";

export default function Login() {
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const themeModel = useRotatingPublicTheme();

  const handleLogin = async (event) => {
    event.preventDefault();
    setError("");

    try {
      setLoading(true);
      const identifier = username.trim();
      const res = await axios.post("/accounts/login/", {
        username: identifier,
        email: identifier,
        password,
      });

      if (!res.data.token || !res.data.user) {
        setError("Server error. Try again.");
        return;
      }

      localStorage.setItem("token", res.data.token);
      localStorage.setItem("user", JSON.stringify(res.data.user));
      localStorage.removeItem("admin_access_token");
      localStorage.removeItem("admin_refresh_token");
      localStorage.removeItem("admin_token");
      localStorage.removeItem("admin_user");
      localStorage.removeItem("adminToken");
      navigate("/");
    } catch (err) {
      const serverMessage =
        err?.response?.data?.error ||
        err?.response?.data?.detail ||
        err?.message;
      setError(serverMessage || "Invalid username or password");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`public-shell public-model-${themeModel} min-h-screen`}>
      <PublicNavbar />

      <main className="relative mx-auto flex min-h-[calc(100vh-68px)] max-w-6xl items-center justify-center px-5 py-10 sm:px-7">
        <form onSubmit={handleLogin} className="public-auth-card w-full max-w-md p-8 sm:p-10">
          <p className="public-kicker">Welcome Back</p>
          <h1 className="public-title public-title-auth mt-2">Login</h1>
          <p className="public-text mt-2 text-sm">
            Enter your username/email and password to continue.
          </p>

          <div className="mt-6 space-y-4">
            <label className="block">
              <span className="mb-1 block text-sm font-medium text-slate-300">
                Username or Email
              </span>
              <input
                type="text"
                value={username}
                onChange={(event) => setUsername(event.target.value)}
                required
                className="public-input w-full px-3 py-3"
                placeholder="username or email"
              />
            </label>

            <label className="block">
              <span className="mb-1 block text-sm font-medium text-slate-300">
                Password
              </span>
              <input
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                required
                className="public-input w-full px-3 py-3"
                placeholder="********"
              />
            </label>
          </div>

          {error ? (
            <div className="mt-4 rounded-xl border border-rose-500/40 bg-rose-900/30 px-3 py-2 text-sm text-rose-100">
              {error}
            </div>
          ) : null}

          <button
            type="submit"
            disabled={loading}
            className="public-btn public-btn-primary mt-7 w-full disabled:cursor-not-allowed disabled:opacity-70"
          >
            {loading ? "Signing in..." : "Login"}
          </button>

          <p className="public-text mt-4 text-sm">
            New user?{" "}
            <Link to="/register" className="public-inline-link font-semibold hover:underline">
              Register here
            </Link>
          </p>
        </form>
      </main>
    </div>
  );
}
