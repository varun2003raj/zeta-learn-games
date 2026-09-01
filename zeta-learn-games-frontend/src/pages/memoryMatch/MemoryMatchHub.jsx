import { Link, Navigate } from "react-router-dom";
import Navbar from "../../components/Navbar";

import memoryMatchBackground from "../../assets/memorymatch/background.avif";
import "./MemoryMatchHub.css";

const memoryMatchItems = [
  {
    title: "Games",
    description: "Play Memory Match and test your cybersecurity memory.",
    to: "/memory-match/levels",
    action: "Play Memory Match",
  },
  {
    title: "Leaderboard",
    description: "View scores and see who has the highest Memory Match score.",
    to: "/memory-match/leaderboard",
    action: "Open Leaderboard",
  },
];

export default function MemoryMatchHub() {
  const token = localStorage.getItem("token");

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  return (
  <div
    className="memory-match-hub"
    style={{
      backgroundImage: `url(${memoryMatchBackground})`,
      backgroundSize: "cover",
      backgroundPosition: "center",
      backgroundAttachment: "fixed",
    }}
  >
      <Navbar />

      <main className="relative overflow-hidden">
        <section className="relative mx-auto max-w-6xl px-5 pb-14 pt-10 sm:px-7">
          <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs uppercase tracking-[0.24em] text-blue-300">
                Memory Match
              </p>

              <h1 className="mt-2 text-4xl font-semibold text-slate-50">
                Cyber Memory Match
              </h1>

              <p className="mt-3 text-slate-300">
                Match cybersecurity cards, earn points, and compete for the
                highest score.
              </p>
            </div>

            <Link
              to="/"
              className="rounded-xl border border-slate-600 px-4 py-2 text-sm font-semibold text-slate-100 hover:bg-slate-800"
            >
              Back to Home
            </Link>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            {memoryMatchItems.map((item) => (
              <article
                key={item.title}
                className="rounded-2xl border border-slate-800 bg-slate-900/65 p-6 shadow-xl shadow-black/30 backdrop-blur"
              >
                <h2 className="text-2xl font-semibold text-slate-100">
                  {item.title}
                </h2>

                <p className="mt-2 text-sm text-slate-400">
                  {item.description}
                </p>

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