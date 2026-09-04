import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

const parseStoredUser = () => {
  try {
    return JSON.parse(localStorage.getItem("user") || "null");
  } catch {
    return null;
  }
};

export default function PublicNavbar() {
  const navigate = useNavigate();
  const [token, setToken] = useState(localStorage.getItem("token") || "");
  const [user, setUser] = useState(parseStoredUser());

  useEffect(() => {
    const syncSession = () => {
      setToken(localStorage.getItem("token") || "");
      setUser(parseStoredUser());
    };

    window.addEventListener("storage", syncSession);
    window.addEventListener("focus", syncSession);
    return () => {
      window.removeEventListener("storage", syncSession);
      window.removeEventListener("focus", syncSession);
    };
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setToken("");
    setUser(null);
    navigate("/login");
  };

  return (
    <header className="public-navbar sticky top-0 z-40">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 sm:px-6">
        <Link to="/" className="public-brand group flex items-center gap-3">
          <span className="public-brand-icon">Z</span>
          <div className="leading-none">
            <p className="public-brand-kicker">Zeta</p>
            <p className="public-brand-name">Games</p>
          </div>
        </Link>

        <div className="flex items-center gap-2">
          {token ? (
            <>
              <button type="button"
               onClick={() => navigate("/profile")}
               className="public-btn public-btn-soft">
                {user?.username || "User"}
              </button>

              <button
                type="button"
                onClick={() => navigate("/admin/login")}
                className="public-btn public-btn-soft"
              >
                Admin
              </button>


              <button
                type="button"
                onClick={handleLogout}
                className="public-btn public-btn-danger"
              >
                Logout
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="public-btn public-btn-soft">
                Login
              </Link>
              <Link to="/register" className="public-btn public-btn-primary">
                Sign Up
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}

