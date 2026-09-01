import { NavLink, useLocation, useNavigate } from "react-router-dom";
import {
  getSectionLinks,
  isGamesHomePath,
  isSectionItemActive,
} from "../navigation";

export default function GamesPageActions() {
  const navigate = useNavigate();
  const location = useLocation();
  const sectionLinks = getSectionLinks(location.pathname);
  const isGamesHome = isGamesHomePath(location.pathname);

  return (
    <div className="mb-6 space-y-3">
      <div className="flex flex-wrap items-center justify-end gap-2">
        {!isGamesHome ? (
          <NavLink
            to="/games/dashboard"
            className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
          >
            Games Home
          </NavLink>
        ) : null}
        <button
          type="button"
          onClick={() => navigate("/dashboard")}
          className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
        >
          Main Admin
        </button>
      </div>

      {sectionLinks.length ? (
        <div className="flex flex-wrap gap-2">
          {sectionLinks.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={() =>
                `rounded-full px-4 py-2 text-sm font-medium transition ${
                  isSectionItemActive(location.pathname, item.to)
                    ? "bg-gradient-to-r from-teal-500 to-sky-600 text-white shadow-[0_10px_24px_rgba(2,132,199,0.2)]"
                    : "border border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                }`
              }
            >
              {item.label}
            </NavLink>
          ))}
        </div>
      ) : null}
    </div>
  );
}
