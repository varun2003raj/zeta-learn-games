import { useEffect, useState } from "react";
import API from "../api/axios";
import Navbar from "../components/Navbar";
import { showPopup } from "../utils/popup";

export default function Profile() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    API.get("accounts/profile/")
      .then((res) => setUser(res.data))
      .catch(() => {
        void showPopup("Please login first!", "Login Required");
      });
  }, []);

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-950 text-white flex justify-center items-center">
        <p className="text-lg text-gray-400">Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <Navbar />

      <div className="p-6">
        <h1 className="text-4xl font-bold text-green-400 mb-6">
          My Profile
        </h1>

        <div className="bg-gray-900 p-6 rounded-2xl border border-gray-800 w-[420px] shadow-lg">
          <p className="text-lg mb-2">
            <span className="text-gray-400">Username:</span>{" "}
            <span className="text-white font-semibold">{user.username}</span>
          </p>

          <p className="text-lg mb-2">
            <span className="text-gray-400">Email:</span>{" "}
            <span className="text-white font-semibold">{user.email}</span>
          </p>

          <p className="text-lg">
            <span className="text-gray-400">Score:</span>{" "}
            <span className="text-green-400 font-bold text-xl">
              {user.score}
            </span>
          </p>
        </div>
      </div>
    </div>
  );
}
