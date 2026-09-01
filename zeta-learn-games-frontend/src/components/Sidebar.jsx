import { Link, useLocation } from "react-router-dom";

const gameButtons = [
  { key: "ctf", label: "CTF Game", path: "/admin/ctf/challenges", short: "CT" },
  { key: "escape", label: "Escape Rooms", path: "/admin/escape-rooms", short: "ER" },
];

const ctfButtons = [
  { label: "Challenges", path: "/admin/ctf/challenges" },
  { label: "Categories", path: "/admin/ctf/categories" },
  { label: "Teams", path: "/admin/ctf/teams" },
  { label: "Leaderboard", path: "/admin/ctf/leaderboard" },
  { label: "Announcements", path: "/admin/ctf/announcements" },
  { label: "History", path: "/admin/ctf/history" },
];

export default function Sidebar({
  collapsed,
  mobileOpen,
  onToggleCollapsed,
  onCloseMobile,
  theme,
}) {
  const location = useLocation();
  const panelTone =
    theme === "light"
      ? "bg-white/95 border-r border-slate-200"
      : "bg-slate-950/95 border-r border-slate-800";

  const activeGame =
    location.pathname.startsWith("/admin/ctf")
      ? "ctf"
      : location.pathname.startsWith("/admin/escape-rooms") ||
        location.pathname.startsWith("/admin/levels") ||
        location.pathname.startsWith("/admin/questions") ||
        location.pathname.startsWith("/admin/attempts")
      ? "escape"
      : "";

  const gameClass = (isActive) => {
    if (theme === "light") {
      return isActive
        ? "bg-blue-100 text-blue-700 border-blue-300"
        : "text-slate-700 border-transparent hover:bg-slate-100";
    }

    return isActive
      ? "bg-blue-500/20 text-blue-100 border-blue-500/40"
      : "text-slate-300 border-transparent hover:bg-slate-800/70";
  };

  return (
    <>
      {mobileOpen ? (
        <button
          type="button"
          aria-label="Close sidebar overlay"
          className="fixed inset-0 z-40 bg-slate-950/60 md:hidden"
          onClick={onCloseMobile}
        />
      ) : null}

      <aside
        className={`admin-sidebar fixed z-50 h-screen md:sticky md:top-0 md:z-30 md:block transition-all duration-300 ${panelTone} backdrop-blur-lg ${
          mobileOpen ? "left-0" : "-left-full md:left-0"
        } ${collapsed ? "w-20" : "w-72"}`}
      >
        <div className="flex h-full flex-col">
          <div
            className={`flex items-center justify-between border-b px-4 py-4 ${
              theme === "light" ? "border-slate-200" : "border-slate-800"
            }`}
          >
            <div className="overflow-hidden">
              <p className="text-xs uppercase tracking-[0.24em] text-slate-400">
                Escape Ops
              </p>
              <h1
                className={`whitespace-nowrap text-lg font-semibold ${
                  collapsed ? "hidden" : "block"
                } ${theme === "light" ? "text-slate-900" : "text-slate-50"}`}
              >
                Admin Panel
              </h1>
            </div>

            <button
              type="button"
              onClick={onToggleCollapsed}
              className={`hidden rounded-lg px-2 py-1 text-xs font-semibold md:block ${
                theme === "light"
                  ? "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  : "bg-slate-800 text-slate-300 hover:bg-slate-700"
              }`}
            >
              {collapsed ? ">" : "<"}
            </button>
          </div>

          <nav className="flex-1 space-y-4 overflow-y-auto px-3 py-4">
            {!collapsed ? (
              <p className="px-2 text-[10px] uppercase tracking-[0.2em] text-slate-400">
                Select Game
              </p>
            ) : null}

            {gameButtons.map((game) => (
              <Link
                key={game.key}
                to={game.path}
                onClick={onCloseMobile}
                className={`flex items-center gap-3 rounded-xl border px-3 py-3 text-sm font-medium transition ${gameClass(
                  activeGame === game.key
                )}`}
              >
                <span
                  className={`inline-flex h-8 w-8 items-center justify-center rounded-lg text-xs font-bold ${
                    theme === "light"
                      ? "bg-slate-200 text-slate-700"
                      : "bg-slate-700/40 text-slate-100"
                  }`}
                >
                  {game.short}
                </span>

                {!collapsed ? <span>{game.label}</span> : null}
              </Link>
            ))}

            {/* CTF MENU */}
            {activeGame === "ctf" ? (
              <div className="space-y-1 pl-2">
                {ctfButtons.map((item) => (
                  <Link
                    key={item.path}
                    to={item.path}
                    onClick={onCloseMobile}
                    className={`block rounded-lg px-3 py-2 text-sm transition ${
                      location.pathname === item.path
                        ? "bg-blue-500/20 text-blue-100"
                        : "text-slate-400 hover:bg-slate-800 hover:text-slate-100"
                    }`}
                  >
                    {item.label}
                  </Link>
                ))}
              </div>
            ) : null}
          </nav>
        </div>
      </aside>
    </>
  );
}
