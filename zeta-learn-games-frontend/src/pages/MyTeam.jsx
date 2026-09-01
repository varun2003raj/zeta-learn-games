import { useEffect, useRef, useState } from "react";
import API from "../api/axios";
import Navbar from "../components/Navbar";
import { Link } from "react-router-dom";
import useRotatingPublicTheme from "../hooks/useRotatingPublicTheme";

export default function MyTeam() {
  const [teamData, setTeamData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmText, setConfirmText] = useState("");
  const [confirmAction, setConfirmAction] = useState(""); // delete | leave
  const [statusPopup, setStatusPopup] = useState({ open: false, text: "" });
  const statusTimerRef = useRef(null);
  const themeModel = useRotatingPublicTheme();
  const teamShellStyles = `
    .team-shell {
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
    .team-shell h1,
    .team-shell h2,
    .team-shell p,
    .team-shell th,
    .team-shell td {
      text-shadow: 0 2px 10px rgba(0, 0, 0, 0.7);
    }
  `;

  useEffect(() => {
    API.get("teams/my-team/")
      .then((res) => {
        setTeamData(res.data);
        setLoading(false);
      })
      .catch(() => {
        setTeamData(null);
        setLoading(false);
      });
  }, []);

  useEffect(() => {
    return () => {
      if (statusTimerRef.current) clearTimeout(statusTimerRef.current);
    };
  }, []);

  const showStatus = (text) => {
    setStatusPopup({ open: true, text });
    if (statusTimerRef.current) clearTimeout(statusTimerRef.current);
    statusTimerRef.current = setTimeout(() => {
      setStatusPopup({ open: false, text: "" });
    }, 2200);
  };

  const openConfirm = (action) => {
    setConfirmAction(action);
    setConfirmText("");
    setConfirmOpen(true);
  };

  const closeConfirm = () => {
    setConfirmOpen(false);
    setConfirmText("");
    setConfirmAction("");
  };

  const submitConfirm = async () => {
    if (confirmText.trim() !== "confirm") {
      showStatus("Type 'confirm' exactly.");
      return;
    }

    try {
      if (confirmAction === "delete") {
        await API.delete("teams/delete/");
        showStatus("Team deleted successfully.");
      } else if (confirmAction === "leave") {
        await API.post("teams/leave/");
        showStatus("You left the team successfully.");
      }

      closeConfirm();
      setTeamData(null);
    } catch (err) {
      const msg = err?.response?.data?.error || "Action failed.";
      showStatus(msg);
    }
  };

  if (loading) {
    return (
      <div className={`ctf-shell public-shell min-h-screen bg-gray-950 text-white relative public-model-${themeModel}`}>
        <Navbar />
        <div className="p-6 team-shell">
          <p className="text-gray-400">Loading team data...</p>
        </div>
        <style>{teamShellStyles}</style>
      </div>
    );
  }

  if (!teamData) {
    return (
      <div className={`ctf-shell public-shell min-h-screen bg-gray-950 text-white relative public-model-${themeModel}`}>
        <Navbar />

        {statusPopup.open && (
          <div className="fixed inset-0 z-[5000] pointer-events-none flex items-center justify-center bg-black/40">
            <div className="bg-black/70 border border-yellow-400/50 rounded-2xl px-7 py-5">
              <p className="text-yellow-300 font-bold text-lg">{statusPopup.text}</p>
            </div>
          </div>
        )}

        <div className="p-6 team-shell">
          <h1 className="text-3xl font-bold text-green-400 mb-4">My Team</h1>

          <p className="text-gray-400 mb-6">You are not in a team yet. Create or join a team.</p>

          <div className="flex gap-4">
            <Link to="/create-team" className="bg-green-600 px-6 py-3 rounded-xl font-bold hover:bg-green-700">
              Create Team
            </Link>

            <Link to="/join-team" className="bg-blue-600 px-6 py-3 rounded-xl font-bold hover:bg-blue-700">
              Join Team
            </Link>
          </div>
        </div>
        <style>{teamShellStyles}</style>
      </div>
    );
  }

  const { team, members } = teamData;
  const contributions = teamData.member_contributions || [];
  const currentUser = JSON.parse(localStorage.getItem("user") || "null");
  const isLeader = currentUser && currentUser.username === team.leader_name;

  return (
    <div
      className={`ctf-shell public-shell min-h-screen bg-gray-950 text-white relative public-model-${themeModel}`}
    >
      <Navbar />

      {confirmOpen && (
        <div className="fixed inset-0 z-[5000] flex items-center justify-center bg-black/60">
          <div className="bg-[#0f172a] border border-yellow-400/40 rounded-2xl p-6 w-[420px]">
            <h3 className="text-2xl font-extrabold text-yellow-300 mb-2">
              Confirm Action
            </h3>
            <p className="text-gray-300 mb-4">
              Type <b>confirm</b> to{" "}
              {confirmAction === "delete"
                ? "delete your team"
                : "leave your team"}
              .
            </p>
            <input
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              className="w-full bg-gray-900 border border-gray-700 rounded-xl px-4 py-3 text-white"
              placeholder="Type confirm"
            />
            <div className="flex gap-3 mt-4 justify-end">
              <button
                onClick={closeConfirm}
                className="bg-gray-700 px-4 py-2 rounded-lg font-bold"
              >
                Cancel
              </button>
              <button
                onClick={submitConfirm}
                className="bg-green-700 px-4 py-2 rounded-lg font-bold"
              >
                Submit
              </button>
            </div>
          </div>
        </div>
      )}

      {statusPopup.open && (
        <div className="fixed inset-0 z-[5000] pointer-events-none flex items-center justify-center bg-black/35">
          <div className="bg-black/70 border border-yellow-400/50 rounded-2xl px-7 py-5">
            <p className="text-yellow-300 font-bold text-lg">
              {statusPopup.text}
            </p>
          </div>
        </div>
      )}

      <div className="p-6 team-shell">
        <div className="mb-4">
          <Link
            to="/ctf-hub"
            className="inline-block bg-gray-800 px-4 py-2 rounded-lg font-bold hover:bg-gray-700"
          >
            Back to Dashboard
          </Link>
        </div>

        <h1 className="text-4xl font-bold text-green-400 mb-6">My Team</h1>

        <div className="bg-gray-900 p-6 rounded-2xl border border-gray-800 mb-8">
          <h2 className="text-3xl font-bold text-yellow-400">{team.name}</h2>

          <p className="text-gray-300 mt-3">
            <span className="text-gray-400">Leader:</span>{" "}
            <span className="text-white font-bold">{team.leader_name}</span>
          </p>

          <p className="text-gray-300 mt-2">
            <span className="text-gray-400">Team Code:</span>{" "}
            <span className="text-green-400 font-bold text-xl">
              {team.code}
            </span>
          </p>

          <p className="text-gray-300 mt-2">
            <span className="text-gray-400">Team Score:</span>{" "}
            <span className="text-green-400 font-bold text-xl">
              {team.score}
            </span>
          </p>
        </div>

        <h2 className="text-2xl font-bold text-green-400 mb-4">Team Members</h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {members.map((m) => (
            <div
              key={m.id}
              className="bg-gray-900 p-4 rounded-2xl border border-gray-800"
            >
              <p className="text-lg font-bold text-green-400">{m.username}</p>
              <p className="text-gray-500 text-sm mt-1">
                Joined: {m.joined_at}
              </p>
            </div>
          ))}
        </div>

        <h2 className="text-2xl font-bold text-green-400 mt-10 mb-4">
          Member Contributions
        </h2>

        <div className="bg-gray-900 rounded-2xl border border-gray-800 overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-800">
              <tr>
                <th className="p-4 text-left">Member</th>
                <th className="p-4 text-left">Solved</th>
                <th className="p-4 text-left">Points</th>
              </tr>
            </thead>
            <tbody>
              {contributions.map((c) => (
                <tr
                  key={c.user_id}
                  className="border-b border-gray-800 last:border-b-0"
                >
                  <td className="p-4">{c.username}</td>
                  <td className="p-4">{c.solved_count}</td>
                  <td className="p-4 font-bold text-green-400">
                    {c.total_points}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="mt-8">
          {isLeader ? (
            <button
              onClick={() => openConfirm("delete")}
              className="bg-red-700 px-5 py-2 rounded-lg font-bold hover:bg-red-800"
            >
              Delete Team
            </button>
          ) : (
            <button
              onClick={() => openConfirm("leave")}
              className="bg-orange-700 px-5 py-2 rounded-lg font-bold hover:bg-orange-800"
            >
              Leave Team
            </button>
          )}
        </div>
      </div>
      <style>{teamShellStyles}</style>
    </div>
  );
}
