import { Navigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import EscapeRoomPlay from "./escapeRoom/EscapeRoomPlay";

export default function EscapeRoomPlayMode() {
  const token = localStorage.getItem("token");

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="min-h-screen text-white">
      <Navbar variant="escape-glassy" />
      <main className="w-full">
        <EscapeRoomPlay />
      </main>
    </div>
  );
}
