import { useEffect, useState } from "react";
import API from "../api/axios";
import Navbar from "../components/Navbar";
import { Link, useNavigate } from "react-router-dom";
import { showPopup } from "../utils/popup";
import useRotatingPublicTheme from "../hooks/useRotatingPublicTheme";

export default function Announcements() {
  const [ann, setAnn] = useState([]);
  const navigate = useNavigate();
  const themeModel = useRotatingPublicTheme();

  useEffect(() => {
    API.get("ctf/announcements/")
      .then((res) => setAnn(res.data))
      .catch((err) => {
        if (err?.response?.status === 403) {
          void showPopup("Create or join a team first.", "Access Required");
          navigate("/my-team");
          return;
        }
        void showPopup("Error loading announcements", "Error");
      });
  }, [navigate]);

  return (
    <div className={`ctf-shell public-shell min-h-screen bg-gray-950 text-white relative public-model-${themeModel}`}>
      <Navbar />

      <div className="p-6 announcements-shell">
        <div className="mb-4">
          <Link
            to="/ctf-hub"
            className="inline-block bg-gray-800 px-4 py-2 rounded-lg font-bold hover:bg-gray-700"
          >
            Back to Dashboard
          </Link>
        </div>

        <h1 className="text-3xl font-bold text-green-400 mb-6">
          Announcements
        </h1>

        <div className="space-y-4">
          {ann.map((a) => (
            <div
              key={a.id}
              className="bg-gray-900 p-5 rounded-2xl border border-gray-800"
            >
              <h2 className="text-xl font-bold text-yellow-400">
                {a.title}
              </h2>
              <p className="text-gray-300 mt-2">{a.message}</p>
              <p className="text-gray-500 text-sm mt-3">
                {a.created_at}
              </p>
            </div>
          ))}
        </div>
      </div>

      <style>{`
        .announcements-shell {
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
        .announcements-shell h1,
        .announcements-shell h2,
        .announcements-shell p {
          text-shadow: 0 2px 10px rgba(0, 0, 0, 0.7);
        }
      `}</style>
    </div>
  );
}
