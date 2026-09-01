import { Link, Navigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import useRotatingPublicTheme from "../hooks/useRotatingPublicTheme";

const ctfItems = [
  {
    title: "Challenges",
    description: "Solve tasks and submit flags.",
    to: "/challenges",
    action: "Open Challenges",
  },
  {
    title: "Leaderboard",
    description: "Track live rank and team score.",
    to: "/leaderboard",
    action: "Open Leaderboard",
  },
  {
    title: "Announcements",
    description: "Read latest CTF event updates.",
    to: "/announcements",
    action: "Open Announcements",
  },
  {
    title: "Create Team",
    description: "Create a new team for this CTF.",
    to: "/create-team",
    action: "Create Team",
  },
  {
    title: "Join Team",
    description: "Join an existing team by team code.",
    to: "/join-team",
    action: "Join Team",
  },
  {
    title: "My Team",
    description: "View members and your team details.",
    to: "/my-team",
    action: "Open My Team",
  },
];

export default function CtfHub() {
  const token = localStorage.getItem("token");
  const themeModel = useRotatingPublicTheme();

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div
      className={`ctf-shell public-shell min-h-screen bg-gray-950 text-white public-model-${themeModel}`}
    >
      <Navbar />

      <main className="relative overflow-hidden">
        <div className="ctf-hub-theme-overlay pointer-events-none absolute inset-0" />

        <section className="relative mx-auto max-w-6xl px-5 pb-14 pt-10 sm:px-7">
          <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs uppercase tracking-[0.24em] text-blue-300">
                CTF Hub
              </p>
              <h1 className="mt-2 text-4xl font-semibold text-slate-50">
                Capture The Flag
              </h1>
              <p className="mt-3 text-slate-300">
                Everything for CTF is here: challenges, leaderboard,
                announcements, and team controls.
              </p>
            </div>
            <Link
              to="/"
              className="rounded-xl border border-slate-600 px-4 py-2 text-sm font-semibold text-slate-100 hover:bg-slate-800"
            >
              Back to Home
            </Link>
          </div>

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {ctfItems.map((item) => (
              <article
                key={item.title}
                className="rounded-2xl border border-slate-800 bg-slate-900/65 p-6 shadow-xl shadow-black/30 backdrop-blur"
              >
                <h2 className="text-2xl font-semibold text-slate-100">
                  {item.title}
                </h2>
                <p className="mt-2 text-sm text-slate-400">{item.description}</p>
                <Link
                  to={item.to}
                  className="mt-5 inline-flex rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-500"
                >
                  {item.action}
                </Link>
              </article>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}
