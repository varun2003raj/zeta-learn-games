import { useEffect, useState } from "react";
import { Navigate, Outlet } from "react-router-dom";
import { isGameAdminAuthenticated } from "../auth/session";

function GamesPrivateRoute() {
  const [isAuthenticated, setIsAuthenticated] = useState(null);

  useEffect(() => {
    setIsAuthenticated(isGameAdminAuthenticated());
  }, []);

  if (isAuthenticated === null) {
    return null;
  }

  if (!isAuthenticated) {
    return <Navigate to="/games/login" replace />;
  }

  return <Outlet />;
}

export default GamesPrivateRoute;
