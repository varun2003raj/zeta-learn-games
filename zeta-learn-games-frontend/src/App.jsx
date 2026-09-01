import {
  BrowserRouter as Router,
  Navigate,
  Route,
  Routes,
  useLocation,
} from "react-router-dom";
import { Toaster } from "react-hot-toast";
import { lazy, Suspense } from "react";

// Normal imports
import Home from "./pages/Home";
import Login from "./pages/Login";
import Register from "./pages/Register";
import CircuitBoardBackground from "./components/CircuitBoardBackground";
import ProtectedRoute from "./components/ProtectedRoute";

// Lazy-loaded pages
const Profile = lazy(() => import("./pages/Profile"));
const Challenges = lazy(() => import("./pages/Challenges"));
const ChallengeDetail = lazy(() => import("./pages/ChallengeDetail"));
const Leaderboard = lazy(() => import("./pages/Leaderboard"));
const Announcements = lazy(() => import("./pages/Announcements"));
const CreateTeam = lazy(() => import("./pages/CreateTeam"));
const JoinTeam = lazy(() => import("./pages/JoinTeam"));
const MyTeam = lazy(() => import("./pages/MyTeam"));
const CtfHub = lazy(() => import("./pages/CtfHub"));

const EscapeIntro = lazy(() => import("./pages/escapeRoom/EscapeIntro"));
const EscapeRoomPlay = lazy(() => import("./pages/escapeRoom/EscapeRoomPlay"));
const EscapeRoomMode = lazy(() => import("./pages/EscapeRoomMode"));
const EscapeRoomPlayMode = lazy(() => import("./pages/EscapeRoomPlayMode"));

const TreasureHunt = lazy(() => import("./pages/TreasureHunt"));

// Memory Match
const MemoryMatchHub = lazy(
  () => import("./pages/memoryMatch/MemoryMatchHub")
);
const MemoryMatch = lazy(
  () => import("./games/pages/MemoryMatch")
);
const MemoryMatchLevels = lazy(
  () => import("./pages/memoryMatch/MemoryMatchLevels")
);

const MemoryMatchLeaderboard = lazy(
  () => import("./pages/memoryMatch/MemoryMatchLeaderboard")
);

// Admin
const AdminLayout = lazy(
  () => import("./pages/admin/AdminLayout")
);
const AdminLogin = lazy(
  () => import("./pages/admin/Login")
);
const Dashboard = lazy(
  () => import("./pages/admin/Dashboard")
);
const CtfChallenges = lazy(
  () => import("./pages/admin/ctf/Challenges")
);
const CtfCategories = lazy(
  () => import("./pages/admin/ctf/Categories")
);
const CtfTeams = lazy(
  () => import("./pages/admin/ctf/Teams")
);
const CtfLeaderboard = lazy(
  () => import("./pages/admin/ctf/Leaderboard")
);
const CtfHints = lazy(
  () => import("./pages/admin/ctf/Hints")
);
const CtfAnnouncements = lazy(
  () => import("./pages/admin/ctf/Announcements")
);
const CtfHistory = lazy(
  () => import("./pages/admin/ctf/History")
);

const EscapeRoomList = lazy(
  () => import("./pages/admin/escapeRooms/EscapeRoomList")
);
const EscapeRoomForm = lazy(
  () => import("./pages/admin/escapeRooms/EscapeRoomForm")
);

const LevelList = lazy(
  () => import("./pages/admin/levels/LevelList")
);
const LevelForm = lazy(
  () => import("./pages/admin/levels/LevelForm")
);

const QuestionList = lazy(
  () => import("./pages/admin/questions/QuestionList")
);
const QuestionForm = lazy(
  () => import("./pages/admin/questions/QuestionForm")
);

const Attempts = lazy(
  () => import("./pages/admin/attempts/Attempts")
);


function AppContent() {
  const { pathname } = useLocation();

  const hideCircuitBackground =
    pathname.startsWith("/escape-room");

  return (
    <>
      <Toaster
        position="top-right"
        toastOptions={{
          style: {
            background: "#0f172a",
            color: "#f8fafc",
            border:
              "1px solid rgba(100, 116, 139, 0.4)",
          },
        }}
      />

      <div className="app-shell">
        {!hideCircuitBackground ? (
          <CircuitBoardBackground />
        ) : null}

        <Suspense
          fallback={
            <div className="min-h-screen bg-gray-950 text-white flex items-center justify-center">
              <div className="text-lg font-semibold">
                Loading...
              </div>
            </div>
          }
        >
          <Routes>

            {/* Main */}
            <Route path="/" element={<Home />} />

            <Route
              path="/games"
              element={<Navigate to="/" replace />}
            />

            <Route
              path="/ctf-hub"
              element={<CtfHub />}
            />

            {/* Escape Room */}
            <Route
              path="/escape-room"
              element={<EscapeRoomMode />}
            />

            <Route
              path="/escape-room/room/:roomId"
              element={<EscapeRoomPlayMode />}
            />

            <Route
              path="/escape-intro"
              element={<EscapeIntro />}
            />

            {/* Memory Match */}
            <Route
              path="/memory-match"
              element={<MemoryMatchHub />}
            />

            <Route
              path="/memory-match/levels"
              element={<MemoryMatchLevels />}
            />

            <Route
              path="/memory-match/games"
              element={<MemoryMatch />}
            />

            <Route
              path="/memory-match/leaderboard"
              element={<MemoryMatchLeaderboard />}
            />

            {/* Treasure Hunt */}
            <Route
              path="/treasure-hunt"
              element={<TreasureHunt />}
            />

            {/* CTF */}
            <Route
              path="/challenges"
              element={<Challenges />}
            />

            <Route
              path="/challenge/:id"
              element={<ChallengeDetail />}
            />

            <Route
              path="/leaderboard"
              element={<Leaderboard />}
            />

            <Route
              path="/announcements"
              element={<Announcements />}
            />

            {/* Teams */}
            <Route
              path="/create-team"
              element={<CreateTeam />}
            />

            <Route
              path="/join-team"
              element={<JoinTeam />}
            />

            <Route
              path="/my-team"
              element={<MyTeam />}
            />

            {/* Profile */}
            <Route
              path="/profile"
              element={<Profile />}
            />

            {/* Authentication */}
            <Route
              path="/login"
              element={<Login />}
            />

            <Route
              path="/register"
              element={<Register />}
            />

            {/* Admin Login */}
            <Route
              path="/admin/login"
              element={<AdminLogin />}
            />

            <Route
              path="/admin"
              element={
                <Navigate
                  to="/admin/dashboard"
                  replace
                />
              }
            />

            {/* Protected Admin */}
            <Route element={<ProtectedRoute />}>

              <Route
                path="/admin"
                element={<AdminLayout />}
              >

                <Route
                  path="dashboard"
                  element={<Dashboard />}
                />

                <Route
                  path="ctf/challenges"
                  element={<CtfChallenges />}
                />

                <Route
                  path="ctf/categories"
                  element={<CtfCategories />}
                />

                <Route
                  path="ctf/teams"
                  element={<CtfTeams />}
                />

                <Route
                  path="ctf/leaderboard"
                  element={<CtfLeaderboard />}
                />

                <Route
                  path="ctf/hints"
                  element={<CtfHints />}
                />

                <Route
                  path="ctf/announcements"
                  element={<CtfAnnouncements />}
                />

                <Route
                  path="ctf/history"
                  element={<CtfHistory />}
                />

                {/* Escape Rooms */}
                <Route
                  path="escape-rooms"
                  element={<EscapeRoomList />}
                />

                <Route
                  path="escape-rooms/new"
                  element={<EscapeRoomForm />}
                />

                <Route
                  path="escape-rooms/:roomId/edit"
                  element={<EscapeRoomForm />}
                />

                <Route
                  path="escape-rooms/:roomId/levels"
                  element={<LevelList />}
                />

                <Route
                  path="escape-rooms/:roomId/levels/new"
                  element={<LevelForm />}
                />

                {/* Levels */}
                <Route
                  path="levels/:levelId/edit"
                  element={<LevelForm />}
                />

                <Route
                  path="levels/:levelId/questions"
                  element={<QuestionList />}
                />

                <Route
                  path="levels/:levelId/questions/new"
                  element={<QuestionForm />}
                />

                {/* Questions */}
                <Route
                  path="questions/:questionId/edit"
                  element={<QuestionForm />}
                />

                {/* Attempts */}
                <Route
                  path="attempts"
                  element={<Attempts />}
                />

              </Route>

            </Route>

            {/* 404 */}
            <Route
              path="*"
              element={<Navigate to="/" replace />}
            />

          </Routes>
        </Suspense>
      </div>
    </>
  );
}


function App() {
  return (
    <Router>
      <AppContent />
    </Router>
  );
}

export default App;