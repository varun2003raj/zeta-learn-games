import { BrowserRouter as Router, Navigate, Route, Routes, useLocation } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import Home from "./pages/Home";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Profile from "./pages/Profile";
import Challenges from "./pages/Challenges";
import ChallengeDetail from "./pages/ChallengeDetail";
import Leaderboard from "./pages/Leaderboard";
import Announcements from "./pages/Announcements";
import CreateTeam from "./pages/CreateTeam";
import JoinTeam from "./pages/JoinTeam";
import MyTeam from "./pages/MyTeam";
import CtfHub from "./pages/CtfHub";
import EscapeIntro from "./pages/escapeRoom/EscapeIntro";

import EscapeRoomPlay from "./pages/escapeRoom/EscapeRoomPlay";

import EscapeRoomMode from "./pages/EscapeRoomMode";
import EscapeRoomPlayMode from "./pages/EscapeRoomPlayMode";
import TreasureHunt from "./pages/TreasureHunt";
import CircuitBoardBackground from "./components/CircuitBoardBackground";
import ProtectedRoute from "./components/ProtectedRoute";
import AdminLayout from "./pages/admin/AdminLayout";
import AdminLogin from "./pages/admin/Login";
import Dashboard from "./pages/admin/Dashboard";
import CtfChallenges from "./pages/admin/ctf/Challenges";
import CtfCategories from "./pages/admin/ctf/Categories";
import CtfTeams from "./pages/admin/ctf/Teams";
import CtfLeaderboard from "./pages/admin/ctf/Leaderboard";
import CtfHints from "./pages/admin/ctf/Hints";
import CtfAnnouncements from "./pages/admin/ctf/Announcements";
import CtfHistory from "./pages/admin/ctf/History";
import EscapeRoomList from "./pages/admin/escapeRooms/EscapeRoomList";
import EscapeRoomForm from "./pages/admin/escapeRooms/EscapeRoomForm";
import LevelList from "./pages/admin/levels/LevelList";
import LevelForm from "./pages/admin/levels/LevelForm";
import QuestionList from "./pages/admin/questions/QuestionList";
import QuestionForm from "./pages/admin/questions/QuestionForm";
import Attempts from "./pages/admin/attempts/Attempts";

function AppContent() {
  const { pathname } = useLocation();
  const hideCircuitBackground = pathname.startsWith("/escape-room");

  return (
    <>
      <Toaster
        position="top-right"
        toastOptions={{
          style: {
            background: "#0f172a",
            color: "#f8fafc",
            border: "1px solid rgba(100, 116, 139, 0.4)",
          },
        }}
      />

      <div className="app-shell">
        {!hideCircuitBackground ? <CircuitBoardBackground /> : null}
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/games" element={<Navigate to="/" replace />} />
          <Route path="/ctf-hub" element={<CtfHub />} />
          <Route path="/escape-room" element={<EscapeRoomMode />} />
          <Route
            path="/escape-room/room/:roomId"
            element={<EscapeRoomPlayMode />}
          />
          <Route path="/escape-intro" element={<EscapeIntro />} />

          <Route path="/escape-room" element={<EscapeRoomMode />} />

          <Route
            path="/escape-room/room/:roomId"
            element={<EscapeRoomPlay />}
          />
          <Route path="/treasure-hunt" element={<TreasureHunt />} />
          <Route path="/challenges" element={<Challenges />} />
          <Route path="/challenge/:id" element={<ChallengeDetail />} />
          <Route path="/leaderboard" element={<Leaderboard />} />
          <Route path="/announcements" element={<Announcements />} />
          <Route path="/create-team" element={<CreateTeam />} />
          <Route path="/join-team" element={<JoinTeam />} />
          <Route path="/my-team" element={<MyTeam />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          <Route path="/admin/login" element={<AdminLogin />} />
          <Route
            path="/admin"
            element={<Navigate to="/admin/dashboard" replace />}
          />

          <Route element={<ProtectedRoute />}>
            <Route path="/admin" element={<AdminLayout />}>
              <Route path="dashboard" element={<Dashboard />} />
              <Route path="ctf/challenges" element={<CtfChallenges />} />
              <Route path="ctf/categories" element={<CtfCategories />} />
              <Route path="ctf/teams" element={<CtfTeams />} />
              <Route path="ctf/leaderboard" element={<CtfLeaderboard />} />
              <Route path="ctf/hints" element={<CtfHints />} />
              <Route path="ctf/announcements" element={<CtfAnnouncements />} />
              <Route path="ctf/history" element={<CtfHistory />} />
              <Route path="escape-rooms" element={<EscapeRoomList />} />
              <Route path="escape-rooms/new" element={<EscapeRoomForm />} />
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
              <Route path="levels/:levelId/edit" element={<LevelForm />} />
              <Route
                path="levels/:levelId/questions"
                element={<QuestionList />}
              />
              <Route
                path="levels/:levelId/questions/new"
                element={<QuestionForm />}
              />
              <Route
                path="questions/:questionId/edit"
                element={<QuestionForm />}
              />
              <Route path="attempts" element={<Attempts />} />
            </Route>
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
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
