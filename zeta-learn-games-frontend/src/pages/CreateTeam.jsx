// import { useState } from "react";
// import API from "../api/axios";
// import Navbar from "../components/Navbar";
// import { useNavigate } from "react-router-dom";
// import { showPopup } from "../utils/popup";
// import useRotatingPublicTheme from "../hooks/useRotatingPublicTheme";

// export default function CreateTeam() {
//   const [name, setName] = useState("");
//   const nav = useNavigate();
//   const themeModel = useRotatingPublicTheme();

//   const createTeam = async (e) => {
//     e.preventDefault();

//     try {
//       const res = await API.post("teams/create/", { name });
//       await showPopup(`Team Created Successfully!\nYour Team Code: ${res.data.team.code}`, "Success");

//       console.log(res.data);
//       nav("/my-team");
//     } catch (err) {
//       const msg = err?.response?.data?.error || "Team creation failed!";
//       await showPopup(msg, "Error");
//     }
//   };

//   return (
//     <div className={`ctf-shell public-shell min-h-screen bg-gray-950 text-white public-model-${themeModel}`}>
//       <Navbar />

//       <div className="p-6 flex justify-center items-center">
//         <form
//           onSubmit={createTeam}
//           className="bg-gray-900 p-8 rounded-2xl border border-gray-800 w-[450px]"
//         >
//           <h1 className="text-3xl font-bold text-green-400 mb-6">
//             Create Team
//           </h1>

//           <input
//             className="w-full p-3 rounded-xl bg-gray-800 mb-4"
//             placeholder="Enter Team Name"
//             value={name}
//             onChange={(e) => setName(e.target.value)}
//           />

//           <button className="w-full bg-green-600 p-3 rounded-xl font-bold hover:bg-green-700">
//             Create Team
//           </button>
//         </form>
//       </div>
//     </div>
//   );
// }
import { useEffect, useState } from "react";
import API from "../api/axios";
import Navbar from "../components/Navbar";
import { useNavigate } from "react-router-dom";
import { showPopup } from "../utils/popup";
import useRotatingPublicTheme from "../hooks/useRotatingPublicTheme";

export default function CreateTeam() {
  const [name, setName] = useState("");
  const [teamExists, setTeamExists] = useState(false);
  const [loading, setLoading] = useState(true);

  const nav = useNavigate();
  const themeModel = useRotatingPublicTheme();

  /* CHECK IF USER ALREADY HAS TEAM */

  useEffect(() => {
    API.get("teams/my-team/")
      .then((res) => {
        if (res.data && res.data.team) {
          setTeamExists(true);
        }
        setLoading(false);
      })
      .catch(() => {
        setTeamExists(false);
        setLoading(false);
      });
  }, []);

  /* CREATE TEAM */

  const createTeam = async (e) => {
    e.preventDefault();

    if (teamExists) {
      await showPopup("Team already created!", "Info");
      return;
    }

    try {
      const res = await API.post("teams/create/", { name });

      await showPopup(
        `Team Created Successfully!\nYour Team Code: ${res.data.team.code}`,
        "Success",
      );

      nav("/my-team");
    } catch (err) {
      const msg = err?.response?.data?.error || "Team creation failed!";
      await showPopup(msg, "Error");
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
        {teamExists ? (
          <div className="bg-gray-900 p-8 rounded-2xl border border-gray-800 w-[450px] text-center">
            <h1 className="text-3xl font-bold text-yellow-400 mb-4">
              Team Already Created
            </h1>

            <p className="text-gray-400 mb-6">
              You already have a team. Go to My Team to view it.
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
            onSubmit={createTeam}
            className="bg-gray-900 p-8 rounded-2xl border border-gray-800 w-[450px]"
          >
            <h1 className="text-3xl font-bold text-green-400 mb-6">
              Create Team
            </h1>

            <input
              className="w-full p-3 rounded-xl bg-gray-800 mb-4"
              placeholder="Enter Team Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />

            <button className="w-full bg-green-600 p-3 rounded-xl font-bold hover:bg-green-700">
              Create Team
            </button>
          </form>
        )}
      </div>
    </div>
  );
}