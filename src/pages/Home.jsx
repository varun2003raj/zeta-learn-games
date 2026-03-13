import { Link } from "react-router-dom";
import PublicNavbar from "../components/PublicNavbar";
import useRotatingPublicTheme from "../hooks/useRotatingPublicTheme";

const parseUser = () => {
  try {
    return JSON.parse(localStorage.getItem("user") || "null");
  } catch {
    return null;
  }
};

const guestHighlights = [
  {
    title: "Live CTF Battles",
    description:
      "Compete in fast-paced challenge rounds and push your team to the top.",
  },
  {
    title: "Escape Game Missions",
    description:
      "Solve puzzle chains, manage time pressure, and finish rooms with maximum score.",
  },
  {
    title: "Unified Player Profile",
    description:
      "Your account, team state, and progress stay synced across game modes.",
  },
];

const loggedInCards = [
  {
    title: "Treasure Hunt",
    badge: "01",
    description:
      "Solve pirate-style challenge trials with clue decoding, scoring, and progression.",
    to: "/treasure-hunt",
    action: "Enter Treasure Hunt",
  },
  {
    title: "CTF Game",
    badge: "02",
    description:
      "Open CTF hub with challenges, leaderboard, announcements, and team actions.",
    to: "/ctf-hub",
    action: "Enter CTF",
  },
  {
    title: "Escape Room",
    badge: "03",
    description:
      "Play timed puzzle missions and track room completion progress.",
    // to: "/escape-room",
    to: "/escape-intro",
    action: "Enter Escape",
  },
];

export default function Home() {
  const token = localStorage.getItem("token");
  const user = parseUser();
  const gameCards = loggedInCards;
  const themeModel = useRotatingPublicTheme();

  return (
    <div className={`public-shell public-model-${themeModel} min-h-screen`}>
      <PublicNavbar />

      <main className="public-main relative overflow-hidden">
        <section className="relative mx-auto max-w-6xl px-5 pb-16 pt-12 sm:px-7">
          {!token ? (
            <div className="space-y-10">
              <article className="public-hero p-8 sm:p-10">
                <p className="public-kicker">Zeta Games Platform</p>
                <h1 className="public-title public-title-wide">
                  Enter The Unified Premium Game Hub
                </h1>
                <p className="public-text mt-4 max-w-3xl text-base">
                  Login to unlock available games. Build your team, solve deeper
                  puzzles, and track live performance from one unified account.
                </p>
                <div className="mt-7 flex flex-wrap gap-3">
                  <Link to="/register" className="public-btn public-btn-primary">
                    Create Account
                  </Link>
                  <Link to="/login" className="public-btn public-btn-soft">
                    Login
                  </Link>
                </div>
              </article>

              <div className="grid gap-4 md:grid-cols-3">
                {guestHighlights.map((item) => (
                  <article key={item.title} className="public-card p-6">
                    <h2 className="public-card-title text-lg">{item.title}</h2>
                    <p className="public-text mt-2 text-sm leading-relaxed">
                      {item.description}
                    </p>
                  </article>
                ))}
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              <div>
                <p className="public-kicker">Available Games</p>
                <h1 className="public-title public-title-wide mt-2">
                  Welcome back{user?.username ? `, ${user.username}` : ""}
                </h1>
                <p className="public-text mt-3">Choose a game and enter instantly.</p>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                {gameCards.map((card) => (
                  <article key={card.title} className="public-card p-7">
                    <div className="mb-3 flex items-center justify-between">
                      <span className="public-badge">{card.badge}</span>
                    </div>
                    <h2 className="public-card-title">{card.title}</h2>
                    <p className="public-text mt-2 text-sm">{card.description}</p>
                    <Link to={card.to} className="public-btn public-btn-primary mt-5 inline-flex">
                      {card.action}
                    </Link>
                  </article>
                ))}
              </div>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
