import { useEffect, useState } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";

const parseStoredUser = () => {
  try {
    return JSON.parse(localStorage.getItem("user") || "null");
  } catch {
    return null;
  }
};

const linkBaseClass =
  "ctf-nav-link rounded-lg px-3 py-2 text-sm font-semibold transition";

const linkClass = ({ isActive }) =>
  `${linkBaseClass} ${
    isActive
      ? "ctf-nav-link-active bg-blue-500/20 text-blue-100"
      : "ctf-nav-link-idle text-slate-300 hover:bg-slate-800 hover:text-slate-100"
  }`;

export default function Navbar({ variant = "default" }) {
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [token, setToken] = useState(localStorage.getItem("token") || "");
  const [user, setUser] = useState(parseStoredUser());
  const isEscapeGlassy = variant === "escape-glassy";

  useEffect(() => {
    const syncSession = () => {
      setToken(localStorage.getItem("token") || "");
      setUser(parseStoredUser());
    };

    window.addEventListener("storage", syncSession);
    window.addEventListener("focus", syncSession);

    return () => {
      window.removeEventListener("storage", syncSession);
      window.removeEventListener("focus", syncSession);
    };
  }, []);

  const isLoggedIn = Boolean(token);
  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setToken("");
    setUser(null);
    navigate("/login");
  };

  return (
    <header
      className={`ctf-nav top-0 z-40 backdrop-blur-xl ${
        isEscapeGlassy
          ? "fixed inset-x-0 border-b border-white/20 bg-white/8 shadow-[0_10px_30px_rgba(10,28,56,0.35)]"
          : "sticky border-b border-slate-800 bg-slate-950/90"
      }`}
    >
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3 sm:px-6">
        <Link to="/" className="ctf-nav-brand group flex items-center gap-3">
          <span
            className={`ctf-nav-brand-icon inline-flex h-9 w-9 items-center justify-center rounded-xl text-sm font-extrabold shadow-[0_0_18px_rgba(59,130,246,0.35)] ${
              isEscapeGlassy
                ? "border border-cyan-200/40 bg-white/10 text-cyan-50"
                : "border border-blue-400/40 bg-gradient-to-br from-blue-500/30 to-indigo-500/20 text-blue-100"
            }`}
          >
            Z
          </span>
          <div className="leading-none">
            <p
              className={`ctf-nav-brand-kicker text-[11px] uppercase tracking-[0.24em] ${
                isEscapeGlassy ? "text-cyan-100/70" : "text-slate-400"
              }`}
            >
              Zeta
            </p>
            <p
              className={`ctf-nav-brand-name text-base font-semibold ${
                isEscapeGlassy
                  ? "text-slate-50 group-hover:text-cyan-100"
                  : "text-slate-100 group-hover:text-blue-200"
              }`}
            >
              Games
            </p>
          </div>
        </Link>

        {!isLoggedIn ? (
          <button
            type="button"
            aria-label="Toggle menu"
            onClick={() => setMobileOpen((prev) => !prev)}
            className={`ctf-nav-menu-btn rounded-lg px-3 py-2 text-sm font-semibold md:hidden ${
              isEscapeGlassy
                ? "border border-white/25 bg-white/10 text-slate-100 hover:bg-white/20"
                : "border border-slate-700 bg-slate-900 text-slate-200 hover:bg-slate-800"
            }`}
          >
            Menu
          </button>
        ) : null}

        {!isLoggedIn ? (
          <nav className="ctf-nav-links hidden items-center gap-1 md:flex">
            <NavLink to="/" className={linkClass}>
              Home
            </NavLink>
            <p className="ctf-nav-hint px-3 text-xs uppercase tracking-[0.22em] text-slate-500">
              Login to unlock games
            </p>
          </nav>
        ) : (
          <div className="hidden md:block" />
        )}

        <div
          className={`ctf-nav-actions items-center gap-2 ${
            isLoggedIn ? "flex" : "hidden md:flex"
          }`}
        >
          {isLoggedIn ? (
            <>
              <button
                type="button"
                className={`ctf-nav-user-btn rounded-lg px-3 py-2 text-sm font-medium ${
                  isEscapeGlassy
                    ? "border border-white/25 bg-white/10 text-slate-100 hover:bg-white/20"
                    : "border border-slate-700 bg-slate-900 text-slate-200 hover:bg-slate-800"
                }`}
              >
                {user?.username || "Profile"}
              </button>
              <button
                type="button"
                onClick={handleLogout}
                className={`ctf-nav-logout-btn rounded-lg px-3 py-2 text-sm font-semibold ${
                  isEscapeGlassy
                    ? "border border-rose-300/45 bg-rose-400/18 text-rose-50 hover:bg-rose-400/28"
                    : "border border-rose-500/40 bg-rose-500/15 text-rose-100 hover:bg-rose-500/25"
                }`}
              >
                Logout
              </button>
            </>
          ) : (
            <>
              <Link
                to="/login"
                className={`ctf-nav-login-btn rounded-lg px-3 py-2 text-sm font-semibold ${
                  isEscapeGlassy
                    ? "border border-white/30 text-slate-100 hover:bg-white/15"
                    : "border border-slate-600 text-slate-100 hover:bg-slate-800"
                }`}
              >
                Login
              </Link>
              <Link
                to="/register"
                className={`ctf-nav-signup-btn rounded-lg px-3 py-2 text-sm font-semibold text-white ${
                  isEscapeGlassy
                    ? "bg-cyan-600/85 hover:bg-cyan-500/90"
                    : "bg-blue-600 hover:bg-blue-500"
                }`}
              >
                Sign Up
              </Link>
            </>
          )}
        </div>
      </div>

      {mobileOpen && !isLoggedIn ? (
        <div
          className={`ctf-nav-mobile px-4 py-3 md:hidden ${
            isEscapeGlassy
              ? "border-t border-white/20 bg-slate-900/50"
              : "border-t border-slate-800 bg-slate-950"
          }`}
        >
          <div className="flex flex-col gap-1">
            <NavLink to="/" className={linkClass}>
              Home
            </NavLink>
            <Link
              to="/login"
              className={`ctf-nav-login-btn rounded-lg px-3 py-2 text-sm font-semibold ${
                isEscapeGlassy
                  ? "border border-white/30 text-slate-100 hover:bg-white/15"
                  : "border border-slate-600 text-slate-100 hover:bg-slate-800"
              }`}
            >
              Login
            </Link>
            <Link
              to="/register"
              className={`ctf-nav-signup-btn rounded-lg px-3 py-2 text-sm font-semibold text-white ${
                isEscapeGlassy
                  ? "bg-cyan-600/85 hover:bg-cyan-500/90"
                  : "bg-blue-600 hover:bg-blue-500"
              }`}
            >
              Sign Up
            </Link>
          </div>
        </div>
      ) : null}
    </header>
  );
}
