import { useCallback, useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { useDispatch, useSelector } from "react-redux";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { logout, setTheme } from "../store/authSlice";
import ctfService from "../services/ctfService";
import { showConfirm, showPrompt } from "../utils/popup";

const routeTitleMap = {
  "/admin/dashboard": "Dashboard",
  "/admin/ctf/challenges": "CTF Challenges",
  "/admin/ctf/categories": "CTF Categories",
  "/admin/ctf/teams": "CTF Teams",
  "/admin/ctf/leaderboard": "CTF Leaderboard",
  "/admin/ctf/hints": "CTF Hints",
  "/admin/ctf/announcements": "CTF Announcements",
  "/admin/ctf/history": "CTF History",
  "/admin/escape-rooms": "Escape Rooms",
  "/admin/attempts": "Attempts",
};

const getTitle = (pathname) => {
  if (pathname.includes("/ctf/challenges")) return "CTF Challenges";
  if (pathname.includes("/ctf/categories")) return "CTF Categories";
  if (pathname.includes("/ctf/teams")) return "CTF Teams";
  if (pathname.includes("/ctf/leaderboard")) return "CTF Leaderboard";
  if (pathname.includes("/ctf/hints")) return "CTF Hints";
  if (pathname.includes("/ctf/announcements")) return "CTF Announcements";
  if (pathname.includes("/ctf/history")) return "CTF History";
  if (pathname.includes("/questions")) return "Questions";
  if (pathname.includes("/levels")) return "Levels";
  if (pathname.includes("/escape-rooms") && pathname.includes("/edit")) {
    return "Edit Escape Room";
  }
  if (pathname.includes("/escape-rooms") && pathname.includes("/new")) {
    return "Create Escape Room";
  }
  return routeTitleMap[pathname] || "Admin";
};

const ctfDetailLinks = [
  { label: "Challenges", to: "/admin/ctf/challenges", matches: ["/admin/ctf/challenges"] },
  { label: "Categories", to: "/admin/ctf/categories", matches: ["/admin/ctf/categories"] },
  { label: "Teams", to: "/admin/ctf/teams", matches: ["/admin/ctf/teams"] },
  { label: "Leaderboard", to: "/admin/ctf/leaderboard", matches: ["/admin/ctf/leaderboard"] },
  { label: "Hints", to: "/admin/ctf/hints", matches: ["/admin/ctf/hints"] },
  { label: "Announcements", to: "/admin/ctf/announcements", matches: ["/admin/ctf/announcements"] },
  { label: "History", to: "/admin/ctf/history", matches: ["/admin/ctf/history"] },
];

const escapeDetailLinks = [
  {
    label: "Rooms",
    to: "/admin/escape-rooms",
    matches: ["/admin/escape-rooms", "/admin/levels", "/admin/questions"],
  },
  { label: "Attempts", to: "/admin/attempts", matches: ["/admin/attempts"] },
];

const getGameType = (pathname) => {
  if (pathname.startsWith("/admin/ctf")) return "ctf";
  if (
    pathname.startsWith("/admin/escape-rooms") ||
    pathname.startsWith("/admin/levels") ||
    pathname.startsWith("/admin/questions") ||
    pathname.startsWith("/admin/attempts")
  ) {
    return "escape";
  }
  return "";
};

export default function AdminNavbar({ onMenuClick }) {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  const [ctfStatus, setCtfStatus] = useState("idle");
  const [ctfActionLoading, setCtfActionLoading] = useState("");
  const user = useSelector((state) => state.auth.user);
  const theme = useSelector((state) => state.auth.theme);

  const title = useMemo(() => getTitle(location.pathname), [location.pathname]);
  const gameType = useMemo(() => getGameType(location.pathname), [location.pathname]);
  const detailLinks =
    gameType === "ctf"
      ? ctfDetailLinks
      : gameType === "escape"
      ? escapeDetailLinks
      : [];
  const sectionLabel =
    gameType === "ctf" ? "CTF Game" : gameType === "escape" ? "Escape Rooms" : "Admin";
  const showCtfStatus = Boolean(ctfStatus && ctfStatus !== "unknown");
  const isLight = theme === "light";

  const loadCtfState = useCallback(async () => {
    try {
      const state = await ctfService.getCtfState();
      const statusValue = String(state?.status || "idle");
      setCtfStatus(statusValue);
    } catch {
      setCtfStatus("");
    }
  }, []);

  useEffect(() => {
    if (gameType !== "ctf") return;
    loadCtfState();
  }, [gameType, loadCtfState]);

  const runCtfAction = async (action) => {
    const normalizedType = String(action || "").toLowerCase();
    const actionLabel =
      normalizedType === "start"
        ? "Start"
        : normalizedType === "finish"
        ? "Finish"
        : "Reset";

    const confirmed = await showConfirm(
      `Are you sure you want to ${actionLabel.toLowerCase()} the CTF now?`,
      `${actionLabel} CTF`,
      {
        okText: actionLabel,
        tone: normalizedType === "reset" ? "danger" : "warning",
      }
    );
    if (!confirmed) return;

    try {
      setCtfActionLoading(normalizedType);

      if (normalizedType === "start") {
        await ctfService.startCtf();
        toast.success("CTF started");
      } else if (normalizedType === "finish") {
        await ctfService.finishCtf();
        toast.success("CTF finished");
      } else if (normalizedType === "reset") {
        const historyName = await showPrompt(
          "Enter a history name for this reset archive.",
          "Reset CTF",
          {
            okText: "Reset Now",
            tone: "danger",
            placeholder: "Example: Round 1 Archive",
            requireInput: true,
          }
        );
        if (historyName === null) return;
        await ctfService.resetCtf(historyName.trim());
        toast.success("CTF reset complete");
      }

      await loadCtfState();
    } catch (error) {
      toast.error(ctfService.withApiError(error, "CTF action failed"));
    } finally {
      setCtfActionLoading("");
    }
  };

  const handleLogout = () => {
    dispatch(logout());
    navigate("/admin/login");
  };

  const toggleTheme = () => {
    dispatch(setTheme(isLight ? "dark" : "light"));
  };

  return (
    <header
      className={`admin-nav-shell sticky top-0 z-20 border-b px-4 py-3 backdrop-blur md:px-6 ${
        isLight
          ? "border-slate-200 bg-white/95"
          : "border-slate-800 bg-slate-950/90"
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <button
            type="button"
            aria-label="Open sidebar"
            onClick={onMenuClick}
            className={`rounded-lg px-3 py-2 text-sm font-semibold md:hidden ${
              isLight
                ? "bg-slate-100 text-slate-700"
                : "bg-slate-800 text-slate-200"
            }`}
          >
            Menu
          </button>
          <div>
            <p className="text-xs uppercase tracking-[0.22em] text-slate-400">
              {sectionLabel}
            </p>
            <h2
              className={`text-xl font-semibold ${
                isLight ? "text-slate-900" : "text-slate-100"
              }`}
            >
              {title}
            </h2>
          </div>
        </div>

        <div className="flex items-start gap-3">
          {detailLinks.length > 0 ? (
            <div className="hidden max-w-[54vw] flex-col gap-1 xl:flex">
              <div className="admin-links-row flex items-center gap-1 overflow-x-auto">
                {detailLinks.map((item) => {
                  const isActive = item.matches.some((prefix) =>
                    location.pathname.startsWith(prefix)
                  );
                  return (
                    <Link
                      key={item.to}
                      to={item.to}
                      className={`admin-link-chip whitespace-nowrap rounded-lg border px-2.5 py-1.5 text-xs font-semibold transition ${
                        isLight
                          ? isActive
                            ? "border-blue-300 bg-blue-100 text-blue-700"
                            : "border-slate-300 bg-white text-slate-700 hover:bg-slate-100"
                          : isActive
                          ? "border-blue-500/40 bg-blue-500/20 text-blue-100"
                          : "border-slate-700 bg-slate-900 text-slate-200 hover:bg-slate-800"
                      }`}
                    >
                      {item.label}
                    </Link>
                  );
                })}
              </div>

              {gameType === "ctf" ? (
                <div className="admin-ctf-controls flex items-center gap-1 overflow-x-auto">
                  {showCtfStatus ? (
                    <span
                      className={`rounded-md border px-2 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] ${
                        isLight
                          ? "border-slate-300 bg-white text-slate-700"
                          : "border-slate-700 bg-slate-900 text-slate-200"
                      }`}
                    >
                      {ctfStatus.replaceAll("_", " ")}
                    </span>
                  ) : null}
                  <button
                    type="button"
                    disabled={ctfActionLoading === "start"}
                    onClick={() => runCtfAction("start")}
                    className="rounded-md bg-emerald-600 px-2 py-1 text-[11px] font-semibold text-white hover:bg-emerald-500 disabled:opacity-60"
                  >
                    {ctfActionLoading === "start" ? "Starting..." : "Start"}
                  </button>
                  <button
                    type="button"
                    disabled={ctfActionLoading === "finish"}
                    onClick={() => runCtfAction("finish")}
                    className="rounded-md bg-amber-600 px-2 py-1 text-[11px] font-semibold text-white hover:bg-amber-500 disabled:opacity-60"
                  >
                    {ctfActionLoading === "finish" ? "Finishing..." : "Finish"}
                  </button>
                  <button
                    type="button"
                    disabled={ctfActionLoading === "reset"}
                    onClick={() => runCtfAction("reset")}
                    className="rounded-md bg-rose-600 px-2 py-1 text-[11px] font-semibold text-white hover:bg-rose-500 disabled:opacity-60"
                  >
                    {ctfActionLoading === "reset" ? "Resetting..." : "Reset"}
                  </button>
                </div>
              ) : null}
            </div>
          ) : null}

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={toggleTheme}
              className={`rounded-lg px-3 py-2 text-sm font-medium ${
                isLight
                  ? "bg-slate-100 text-slate-700 hover:bg-slate-200"
                  : "bg-slate-800 text-slate-100 hover:bg-slate-700"
              }`}
            >
              {isLight ? "Dark" : "Light"}
            </button>

            <div className="relative">
              <button
                type="button"
                onClick={() => setMenuOpen((prev) => !prev)}
                className={`rounded-lg px-3 py-2 text-left text-sm font-medium ${
                  isLight
                    ? "bg-blue-50 text-blue-700 hover:bg-blue-100"
                    : "bg-blue-500/20 text-blue-100 hover:bg-blue-500/30"
                }`}
              >
                {user?.email || user?.username || "Admin"}
              </button>

              {menuOpen ? (
                <div
                  className={`absolute right-0 mt-2 w-64 rounded-xl border p-3 shadow-xl ${
                    isLight
                      ? "border-slate-200 bg-white"
                      : "border-slate-700 bg-slate-900"
                  }`}
                >
                  <p
                    className={`text-sm font-semibold ${
                      isLight ? "text-slate-900" : "text-slate-100"
                    }`}
                  >
                    {user?.username || "Administrator"}
                  </p>
                  <p className="mt-1 text-xs text-slate-400">
                    Role: {user?.role || "admin"}
                  </p>
                  <button
                    type="button"
                    onClick={handleLogout}
                    className="mt-3 w-full rounded-lg bg-rose-600 px-3 py-2 text-sm font-semibold text-white hover:bg-rose-500"
                  >
                    Logout
                  </button>
                </div>
              ) : null}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
