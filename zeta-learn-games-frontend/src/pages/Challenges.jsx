import { useEffect, useMemo, useState } from "react";
import API from "../api/axios";
import Navbar from "../components/Navbar";
import { Link } from "react-router-dom";
import { useNavigate } from "react-router-dom";
import { showPopup } from "../utils/popup";
import useRotatingPublicTheme from "../hooks/useRotatingPublicTheme";

export default function Challenges() {
  const [challenges, setChallenges] = useState([]);
  const [ctfBlockedMessage, setCtfBlockedMessage] = useState("");
  const navigate = useNavigate();
  const themeModel = useRotatingPublicTheme();
  const apiBase = API.defaults.baseURL || "";
  const backendBase = apiBase.endsWith("/api") ? apiBase.slice(0, -4) : apiBase;
  console.log("API BASE URL:", API.defaults.baseURL);

  const resolveFileUrl = (url) => {
    if (!url) return "";
    if (url.startsWith("http://") || url.startsWith("https://")) return url;
    if (url.startsWith("/")) return `${backendBase}${url}`;
    return `${backendBase}/${url}`;
  };

  const difficultyClass = (value) => {
    if (value === "easy") return "difficulty-easy";
    if (value === "medium") return "difficulty-medium";
    if (value === "hard") return "difficulty-hard";
    if (value === "ultra_hard") return "difficulty-ultra";
    return "difficulty-default";
  };

  const difficultyLabel = (value) => {
    if (value === "ultra_hard") return "Ultra Hard";
    return value ? value.charAt(0).toUpperCase() + value.slice(1) : "-";
  };

  const grouped = useMemo(() => {
    const map = {};
    challenges.forEach((c) => {
      const key = c.category_name || "Uncategorized";
      if (!map[key]) map[key] = [];
      map[key].push(c);
    });
    return Object.entries(map).sort((a, b) => a[0].localeCompare(b[0]));
  }, [challenges]);

  useEffect(() => {
    let mounted = true;
    const loadChallenges = () =>
      API.get("ctf/challenges/")
        .then((res) => {
          if (!mounted) return;
          setChallenges(Array.isArray(res.data) ? res.data : []);
          setCtfBlockedMessage("");
        })
        .catch((err) => {
          if (!mounted) return;
          const msg = err?.response?.data?.error || "Error loading challenges";
          if (err?.response?.status === 403) {
            if (msg.toLowerCase().includes("team")) {
              void showPopup("Create or join a team first.", "Access Required");
              navigate("/my-team");
              return;
            }
            setChallenges([]);
            setCtfBlockedMessage(msg);
            return;
          }
          void showPopup(msg, "Error");
        });

    loadChallenges();
    const id = setInterval(loadChallenges, 5000);
    const onFocus = () => loadChallenges();
    window.addEventListener("focus", onFocus);
    return () => {
      mounted = false;
      clearInterval(id);
      window.removeEventListener("focus", onFocus);
    };
  }, [navigate]);

  return (
    <div
      className={`ctf-shell public-shell min-h-screen bg-gray-950 text-white relative public-model-${themeModel}`}
    >
      <Navbar />

      <div className="p-6 challenges-shell">
        <div className="mb-4">
          <Link
            to="/ctf-hub"
            className="inline-block bg-gray-800 px-4 py-2 rounded-lg font-bold hover:bg-gray-700"
          >
            Back to Dashboard
          </Link>
        </div>

        <h1 className="text-3xl font-bold text-green-400 mb-6">Challenges</h1>

        {ctfBlockedMessage && (
          <div className="bg-blue-950/80 border border-yellow-500 rounded-2xl p-6 mb-6">
            <h2 className="text-4xl font-extrabold text-yellow-400 mb-3">
              CTF Status
            </h2>
            <p className="text-2xl text-slate-200">{ctfBlockedMessage}</p>
          </div>
        )}

        {!ctfBlockedMessage && grouped.length === 0 && (
          <p className="text-gray-400">No challenges available right now.</p>
        )}

        {grouped.map(([category, items]) => (
          <div key={category} className="mb-10">
            <h2 className="text-2xl font-bold text-yellow-400 mb-4">
              {category}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {items.map((c) => (
                <div
                  key={c.id}
                  className={`relative bg-gray-900 p-5 rounded-2xl border border-gray-800 ${c.is_completed ? "overflow-hidden" : ""}`}
                >
                  {c.is_completed && (
                    <div className="absolute inset-0 z-20 bg-black/75 flex items-center justify-center">
                      <span className="text-2xl font-extrabold tracking-wide text-green-400">
                        COMPLETED
                      </span>
                    </div>
                  )}

                  <h3 className="text-xl font-bold">{c.title}</h3>
                  <p className="text-gray-400">{c.category_name}</p>

                  <p className="text-green-400 font-bold mt-2">
                    {c.points} pts
                  </p>

                  <p
                    className={`text-sm mt-1 ${difficultyClass(c.difficulty)}`}
                  >
                    Difficulty: {difficultyLabel(c.difficulty)}
                  </p>

                  <Link
                    to={`/challenge/${c.id}`}
                    className="inline-block mt-4 bg-blue-600 px-4 py-2 rounded-xl hover:bg-blue-700"
                  >
                    View Challenge
                  </Link>

                  {c.file_url ? (
                    <a
                      href={resolveFileUrl(c.file_url)}
                      className="inline-block mt-3 ml-3 bg-indigo-600 px-4 py-2 rounded-xl hover:bg-indigo-700"
                      target="_blank"
                      rel="noreferrer"
                    >
                      Download File
                    </a>
                  ) : null}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      <style>{`
        .challenges-shell {
          position: relative;
          z-index: 2;
          width: min(1280px, calc(100% - 24px));
          margin: 12px auto;
          border-radius: 20px;
          border: 1px solid var(--ctf-panel-border, rgba(250, 204, 21, 0.2));
          background: linear-gradient(
            150deg,
            var(--ctf-panel-a, rgba(3, 10, 20, 0.62)),
            var(--ctf-panel-b, rgba(3, 10, 20, 0.48))
          );
          backdrop-filter: blur(3px);
          box-shadow: 0 18px 36px rgba(0, 0, 0, 0.4);
        }
        .challenges-shell h1,
        .challenges-shell h2,
        .challenges-shell h3,
        .challenges-shell p,
        .challenges-shell span {
          text-shadow: 0 2px 10px rgba(0, 0, 0, 0.7);
        }
      `}</style>
    </div>
  );
}
