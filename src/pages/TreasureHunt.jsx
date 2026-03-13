import { Link, Navigate } from "react-router-dom";
import TreasureHuntGame from "./treasureHunt/TreasureHuntGame";

export default function TreasureHunt() {
  const token = localStorage.getItem("token");

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="treasure-hunt-page relative">
      <Link
        to="/"
        className="fixed left-5 top-5 z-30 rounded-full border border-lime-300/70 bg-slate-950/70 px-5 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-lime-200 shadow-[0_0_22px_rgba(145,255,28,0.32)] backdrop-blur transition hover:bg-slate-900/85 hover:text-lime-100"
      >
        Back To Home
      </Link>
      <TreasureHuntGame />
    </div>
  );
}
