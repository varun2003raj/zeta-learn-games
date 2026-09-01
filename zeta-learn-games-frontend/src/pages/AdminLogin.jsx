import { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { FaRegEye, FaRegEyeSlash } from "react-icons/fa";
import { FcGoogle } from "react-icons/fc";
import { auth } from "../Firebase/firebase";
import { GoogleAuthProvider, signInWithPopup, signOut } from "firebase/auth";

const USERS_URL = "https://zetamind-hub-node-backend.onrender.com/api/authUser";

function extractUsers(payload) {
  if (Array.isArray(payload)) return payload;
  if (!payload || typeof payload !== "object") return [];

  for (const key of ["data", "users", "list", "items"]) {
    if (Array.isArray(payload[key])) {
      return payload[key];
    }
  }

  for (const value of Object.values(payload)) {
    const users = extractUsers(value);
    if (users.length) {
      return users;
    }
  }

  return [];
}

function extractUser(payload) {
  if (!payload || typeof payload !== "object") return null;

  for (const key of ["data", "user", "result", "item"]) {
    const value = payload[key];
    if (value && typeof value === "object" && !Array.isArray(value)) {
      const nestedUser = extractUser(value);
      return nestedUser || value;
    }
  }

  if (payload._id || payload.id) {
    return payload;
  }

  for (const value of Object.values(payload)) {
    if (value && typeof value === "object" && !Array.isArray(value)) {
      const nestedUser = extractUser(value);
      if (nestedUser) {
        return nestedUser;
      }
    }
  }

  return null;
}

export default function AdminLogin() {
  
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const resolveAdminUser = async (adminUser, fallbackEmail) => {
    const emailValue = (adminUser?.email || fallbackEmail || "").trim().toLowerCase();
    const idValue = (adminUser?._id || adminUser?.id || "").trim();

    if (idValue && adminUser?.name && emailValue) {
      return { ...adminUser, _id: idValue, email: emailValue };
    }

    try {
      if (idValue) {
        const response = await axios.get(`${USERS_URL}/${idValue}`);
        const userById = extractUser(response.data);
        if (userById?.userType === "admin") {
          return userById;
        }
      }

      const response = await axios.get(USERS_URL);
      const users = extractUsers(response.data);
      const matchedAdmin = users.find((user) => {
        const userEmail = (user?.email || "").trim().toLowerCase();
        const userId = (user?._id || user?.id || "").trim();
        return user?.userType === "admin" && ((emailValue && userEmail === emailValue) || (idValue && userId === idValue));
      });

      if (matchedAdmin) {
        return matchedAdmin;
      }
    } catch (lookupError) {
      console.error("Failed to resolve admin profile:", lookupError);
    }

    return {
      ...adminUser,
      _id: idValue,
      email: emailValue || adminUser?.email || fallbackEmail || "",
    };
  };

  const persistAdminSession = (adminUser, tokenValue) => {
    localStorage.setItem("token", tokenValue);
    localStorage.setItem("role", "admin");

    if (adminUser?._id) {
      localStorage.setItem("adminId", adminUser._id);
    } else {
      localStorage.removeItem("adminId");
    }

    const adminEmail = adminUser?.email || email;
    if (adminEmail) {
      localStorage.setItem("adminEmail", adminEmail);
    }

    const adminName = adminUser?.name || adminUser?.firstName || "";
    if (adminName) {
      localStorage.setItem("adminName", adminName);
    } else {
      localStorage.removeItem("adminName");
    }

    localStorage.setItem("adminProfile", JSON.stringify(adminUser || {}));

  };

  /* ================= ADMIN EMAIL LOGIN ================= */
 const handleLogin = async (e) => {
  e.preventDefault();
  setLoading(true);
  setError("");

  try {
    const res = await axios.post(
      `${USERS_URL}/login`,
      { email, password }
    );

    const loginUser =
      res.data?.data?.user ||
      res.data?.data ||
      res.data?.user ||
      {};
    const userType = loginUser?.userType || res.data?.data?.userType;

    if (userType !== "admin") {
      setError("Access denied. Only admins allowed.");
      return;
    }

    const adminUser = await resolveAdminUser(loginUser, email);
    persistAdminSession(adminUser, res.data.token);

    navigate("/dashboard");
  } catch (err) {
    setError(err.response?.data?.message || "Login failed");
  } finally {
    // 🔹 TURN OFF LOADING in all cases
    setLoading(false);
  }
};

  /* ================= ADMIN GOOGLE LOGIN ================= */
  const handleGoogleLogin = async () => {
    setLoading(true);
    setError("");

    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      const googleEmail = result.user.email;

      const res = await axios.get(USERS_URL);
      const users = extractUsers(res.data);

      const adminUser = users.find(
        (u) => u.email === googleEmail && u.userType === "admin"
      );

      if (!adminUser) {
        setError("Access denied. Only admin allowed.");
        await signOut(auth);
        return;
      }

      persistAdminSession(adminUser, "admin-access");

      await signOut(auth); // remove firebase session
      navigate("/dashboard");
    } catch (err) {
      await signOut(auth);
      console.error(err);
      setError("Google login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        <h2 style={styles.title}>Admin Login</h2>

        {/* EMAIL LOGIN */}
        <form onSubmit={handleLogin}>
          <label style={styles.fieldLabel}>Admin Email</label>
          <input
            type="email"
            placeholder="Admin Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            style={styles.input}
          />

          <label style={styles.fieldLabel}>Password</label>
          <div style={styles.passwordBox}>
            <input
              type={showPassword ? "text" : "password"}
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              style={styles.input}
            />
            <span
              onClick={() => setShowPassword(!showPassword)}
              style={styles.eye}
            >
              {showPassword ? <FaRegEyeSlash /> : <FaRegEye />}
            </span>
          </div>

          <button type="submit" disabled={loading} style={styles.button}>
            {loading ? "Logging in..." : "Login"}
          </button>
        </form>

        {/* OR */}
        <div style={styles.divider}>OR</div>

        {/* GOOGLE LOGIN */}
        <button
          onClick={handleGoogleLogin}
          disabled={loading}
          style={styles.googleBtn}
        >
          <FcGoogle size={22} />
          <span>Login with Google</span>
        </button>

        {error && <p style={styles.error}>{error}</p>}
      </div>
    </div>
  );
}

/* ================= STYLES ================= */
const styles = {
  page: {
    height: "100vh",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background:
      "radial-gradient(860px 500px at -8% -20%, rgba(59,130,246,0.12), transparent 60%), linear-gradient(160deg,#f6f9ff 0%,#eef4ff 55%,#f9fcff 100%)",
    fontFamily: "\"Sora\", \"Trebuchet MS\", \"Segoe UI\", sans-serif",
  },
  card: {
    width: "390px",
    background: "linear-gradient(160deg,#ffffff,#f7fbff)",
    padding: "34px",
    borderRadius: "20px",
    border: "1px solid #d8e4f3",
    boxShadow: "0 14px 30px rgba(80,108,150,0.15)",
  },
  title: {
    textAlign: "center",
    marginBottom: "24px",
    fontSize: "28px",
    color: "#10213a",
  },
  input: {
    width: "100%",
    padding: "12px 42px 12px 14px",
    marginBottom: "16px",
    borderRadius: "12px",
    border: "1px solid #d8e4f3",
    background: "#ffffff",
    color: "#10213a",
  },
  fieldLabel: {
    display: "block",
    marginBottom: "6px",
    fontSize: "13px",
    fontWeight: "700",
    color: "#3c4f6c",
  },
  passwordBox: { position: "relative" },
  eye: {
    position: "absolute",
    right: "12px",
    top: "50%",
    transform: "translateY(-50%)",
    cursor: "pointer",
    color: "#0f766e",
  },
  button: {
    width: "100%",
    padding: "12px",
    background: "linear-gradient(135deg, #0ea5a0, #0284c7)",
    color: "#fff",
    border: "none",
    borderRadius: "12px",
    fontWeight: "700",
    cursor: "pointer",
  },
  googleBtn: {
    width: "100%",
    padding: "12px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "10px",
    borderRadius: "12px",
    border: "1px solid #d8e4f3",
    background: "#ffffff",
    color: "#17325a",
    cursor: "pointer",
    fontWeight: "700",
    marginTop: "10px",
  },
  divider: {
    textAlign: "center",
    margin: "18px 0",
    color: "#7085a5",
    fontSize: "13px",
  },
  error: {
    marginTop: "14px",
    color: "#dc2626",
    textAlign: "center",
    fontWeight: "600",
  },
};
