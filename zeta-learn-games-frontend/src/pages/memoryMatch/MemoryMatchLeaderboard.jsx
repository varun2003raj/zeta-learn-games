import { Link, Navigate } from "react-router-dom";
import { useEffect, useState } from "react";
import Navbar from "../../components/Navbar";
import "./MemoryMatchLeaderboard.css";

export default function MemoryMatchLeaderboard() {
  const token = localStorage.getItem("token");

  const [leaderboard, setLeaderboard] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("https://zeta-learn-games.onrender.com/api/memory-match/leaderboard/"
      //"http://127.0.0.1:8000/api/memory-match/leaderboard/"
    )
      .then((response) => {
        if (!response.ok) {
          throw new Error("Failed to load leaderboard");
        }

        return response.json();
      })
      .then((data) => {
        setLeaderboard(data);
      })
      .catch((error) => {
        console.error("Leaderboard error:", error);
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="memory-leaderboard-page">
      <Navbar />

      <div className="memory-leaderboard-container">

        <div className="memory-leaderboard-title">
          <h1>🏆 Memory Match Leaderboard</h1>
          <p>See the best scores achieved by all players.</p>
        </div>

        <div className="memory-leaderboard-table-wrapper">
          <table className="memory-leaderboard-table">

            <thead>
              <tr>
                <th>#</th>
                <th>User</th>
                <th>Easy</th>
                <th>Medium</th>
                <th>Hard</th>
                <th>Expert</th>
                <th>Total</th>
              </tr>
            </thead>

            <tbody>

              {loading ? (
                <tr>
                  <td colSpan="7">
                    Loading leaderboard...
                  </td>
                </tr>
              ) : leaderboard.length === 0 ? (
                <tr>
                  <td colSpan="7">
                    No scores available yet.
                  </td>
                </tr>
              ) : (
                leaderboard.map((player) => (
                  <tr key={player.username}>

                    <td className="memory-leaderboard-rank">
                      {player.rank}
                    </td>

                    <td className="memory-leaderboard-user">
                      {player.username}
                    </td>

                    <td>{player.easy}</td>

                    <td>{player.medium}</td>

                    <td>{player.hard}</td>

                    <td>{player.expert}</td>

                    <td className="memory-leaderboard-total">
                      {player.total}
                    </td>

                  </tr>
                ))
              )}

            </tbody>

          </table>
        </div>

        <div style={{ textAlign: "center", marginTop: "25px" }}>
          <Link
            to="/memory-match"
            style={{
              display: "inline-block",
              padding: "10px 20px",
              border: "1px solid #38bdf8",
              borderRadius: "10px",
              color: "#bae6fd",
              textDecoration: "none",
            }}
          >
            ← Back to Memory Match
          </Link>
        </div>

      </div>
    </div>
  );
}