import { useState } from "react";
import { Outlet } from "react-router-dom";
import { useSelector } from "react-redux";
import Sidebar from "../../components/Sidebar";
import AdminNavbar from "../../components/AdminNavbar";

export default function AdminLayout() {
  const theme = useSelector((state) => state.auth.theme);
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const isLight = theme === "light";

  return (
    <div
      className={`admin-premium flex min-h-screen ${
        isLight
          ? "bg-slate-100 text-slate-900"
          : "bg-[radial-gradient(circle_at_top_left,#1e293b_0%,#020617_55%,#020617_100%)] text-slate-50"
      }`}
    >
      <Sidebar
        collapsed={collapsed}
        mobileOpen={mobileOpen}
        onToggleCollapsed={() => setCollapsed((prev) => !prev)}
        onCloseMobile={() => setMobileOpen(false)}
        theme={theme}
      />

      <div className="flex min-h-screen flex-1 flex-col transition-all duration-300">
        <div className="mx-auto flex w-full max-w-[1680px] flex-1 flex-col">
          <AdminNavbar onMenuClick={() => setMobileOpen(true)} />
          <main className="flex-1 px-4 pb-6 pt-4 md:px-6">
            <div className="admin-content-wrap w-full">
              <Outlet />
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}
