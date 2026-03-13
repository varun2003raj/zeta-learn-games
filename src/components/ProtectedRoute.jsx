import { useSelector } from "react-redux";
import { Navigate, Outlet, useLocation } from "react-router-dom";

const parseUser = (value) => {
  if (!value) return null;
  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
};

export default function ProtectedRoute({ children }) {
  const location = useLocation();
  const authUser = useSelector((state) => state.auth.user);
  const authToken = useSelector((state) => state.auth.accessToken);

  const token = authToken || localStorage.getItem("admin_access_token");
  const user = authUser || parseUser(localStorage.getItem("admin_user"));
  const role = String(user?.role || "").toLowerCase();

  if (!token || !user) {
    return <Navigate to="/admin/login" replace state={{ from: location }} />;
  }

  if (role !== "admin") {
    return <Navigate to="/login" replace />;
  }

  return children || <Outlet />;
}
