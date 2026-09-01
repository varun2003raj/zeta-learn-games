import { Outlet } from "react-router-dom";
import "../../index.css";
import "../games.css";
import Sidebar from "../../components/Sidebar";
import GamesPageActions from "../components/GamesPageActions";

export default function AdminLayout() {
  return (
    <div className="app-layout admin-premium min-h-screen bg-transparent text-slate-900">
      <Sidebar />
      <div className="content">
        <div className="admin-content-wrap mx-auto w-full max-w-[1180px]">
          <main className="pb-8 pt-1 md:pt-2">
            <GamesPageActions />
            <Outlet />
          </main>
        </div>
      </div>
    </div>
  );
}
