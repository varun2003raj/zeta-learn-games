// import { useEffect, useState } from "react";
import { useEffect, useState } from "react";
import API from "../api/axios";
import Navbar from "../components/Navbar";
import { useNavigate } from "react-router-dom";
import { showPopup } from "../utils/popup";
import useRotatingPublicTheme from "../hooks/useRotatingPublicTheme";

export default function JoinTeam() {
  const [code, setCode] = useState("");
  const [hasTeam, setHasTeam] = useState(false);
  const [loading, setLoading] = useState(true);

  const nav = useNavigate();
  const themeModel = useRotatingPublicTheme();

  /* CHECK IF USER ALREADY HAS A TEAM */

  useEffect(() => {
    API.get("teams/my-team/")
      .then((res) => {
        if (res.data && res.data.team) {
          setHasTeam(true);
        }
        setLoading(false);
      })
      .catch(() => {
        setHasTeam(false);
        setLoading(false);
      });
  }, []);

  /* JOIN TEAM */

  const joinTeam = async (e) => {
    e.preventDefault();

    try {
      await API.post("teams/join/", { code });

      await showPopup("Joined Team Successfully!", "Success");

      nav("/my-team");
    } catch (err) {
      const backendError =
        err?.response?.data?.error ||
        err?.response?.data?.message ||
        "Join failed! Check team code.";

      await showPopup(backendError, "Error");
    }
  };

  if (loading) {
    return (
      <div
        className={`ctf-shell public-shell min-h-screen bg-gray-950 text-white public-model-${themeModel}`}
      >
        <Navbar />
        <div className="flex justify-center items-center p-10">
          <p className="text-gray-400">Checking team status...</p>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`ctf-shell public-shell min-h-screen bg-gray-950 text-white public-model-${themeModel}`}
    >
      <Navbar />

      <div className="p-6 flex justify-center items-center">
        {hasTeam ? (
          <div className="bg-gray-900 p-8 rounded-2xl border border-gray-800 w-[450px] text-center">
            <h1 className="text-3xl font-bold text-yellow-400 mb-4">
              Already in a Team
            </h1>

            <p className="text-gray-400 mb-6">
              You are already part of a team.
            </p>

            <button
              onClick={() => nav("/my-team")}
              className="w-full bg-green-600 p-3 rounded-xl font-bold hover:bg-green-700"
            >
              Go To My Team
            </button>
          </div>
        ) : (
          <form
            onSubmit={joinTeam}
            className="bg-gray-900 p-8 rounded-2xl border border-gray-800 w-[450px]"
          >
            <h1 className="text-3xl font-bold text-green-400 mb-6">
              Join Team
            </h1>

            <input
              className="w-full p-3 rounded-xl bg-gray-800 mb-4 uppercase"
              placeholder="Enter Team Code"
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              required
            />

            <button className="w-full bg-blue-600 p-3 rounded-xl font-bold hover:bg-blue-700">
              Join Team
            </button>
          </form>
        )}
      </div>
    </div>
  );
}