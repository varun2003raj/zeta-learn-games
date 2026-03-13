import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import API from "../api/axios";
import { showPopup } from "../utils/popup";
import PublicNavbar from "../components/PublicNavbar";
import useRotatingPublicTheme from "../hooks/useRotatingPublicTheme";

export default function Register() {
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const themeModel = useRotatingPublicTheme();

  const handleRegister = async (event) => {
    event.preventDefault();
    try {
      setLoading(true);
      await API.post("accounts/register/", {
        username,
        email,
        password,
      });

      await showPopup("Registered Successfully!", "Success");
      navigate("/login");
    } catch {
      await showPopup("Registration failed!", "Error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`public-shell public-model-${themeModel} min-h-screen`}>
      <PublicNavbar />

      <main className="relative mx-auto flex min-h-[calc(100vh-68px)] max-w-6xl items-center justify-center px-5 py-10 sm:px-7">
        <form onSubmit={handleRegister} className="public-auth-card w-full max-w-md p-8 sm:p-10">
          <p className="public-kicker">Create Account</p>
          <h1 className="public-title public-title-auth mt-2">Register</h1>
          <p className="public-text mt-2 text-sm">
            Create your account to unlock games.
          </p>

          <div className="mt-6 space-y-4">
            <label className="block">
              <span className="mb-1 block text-sm font-medium text-slate-300">
                Username
              </span>
              <input
                value={username}
                onChange={(event) => setUsername(event.target.value)}
                required
                className="public-input w-full px-3 py-3"
                placeholder="username"
              />
            </label>

            <label className="block">
              <span className="mb-1 block text-sm font-medium text-slate-300">
                Email
              </span>
              <input
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                required
                className="public-input w-full px-3 py-3"
                placeholder="you@example.com"
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

          <button
            type="submit"
            disabled={loading}
            className="public-btn public-btn-primary mt-7 w-full disabled:cursor-not-allowed disabled:opacity-70"
          >
            {loading ? "Creating..." : "Register"}
          </button>

          <p className="public-text mt-4 text-sm">
            Already have an account?{" "}
            <Link to="/login" className="public-inline-link font-semibold hover:underline">
              Login here
            </Link>
          </p>
        </form>
      </main>
    </div>
  );
}
