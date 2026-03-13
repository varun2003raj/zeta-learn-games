// import { Navigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import EscapeMissionControl from "./escapeRoom/EscapeMissionControl";

export default function EscapeRoomMode() {

  const token = localStorage.getItem("token");

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="min-h-screen text-white">
      <Navbar variant="escape-glassy" />

      <main className="w-full">
        <EscapeMissionControl />
      </main>
    </div>
  );
}