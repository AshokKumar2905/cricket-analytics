import { useEffect, useState } from "react";
import axios from "axios";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip,
  ResponsiveContainer
} from "recharts";

const API = "http://127.0.0.1:5000";

function Dashboard() {
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);

  // =========================
  // FETCH DATA
  // =========================
  useEffect(() => {
    axios.get(`${API}/leaderboard`)
      .then(res => {
        setTeams(res.data.data || []);
        setLoading(false);
      })
      .catch(err => {
        console.error("Dashboard error:", err);
        setTeams([]);
        setLoading(false);
      });
  }, []);

  if (loading) return <h2>Loading...</h2>;

  // ✅ MOVE THIS INSIDE COMPONENT
  const topTeam = teams[0];
  const topPlayer =
    topTeam?.players?.slice().sort((a, b) => b.runs - a.runs)[0];

  return (
    <div>

      {/* 🔥 HERO SECTION */}
      <div className="hero">
        <div>
          <h1>🏏 Live Cricket Dashboard</h1>
          <p style={{ color: "#94a3b8" }}>
            Real-time match insights & player performance
          </p>
        </div>

        <div className="live-badge">LIVE</div>
      </div>

      {/* 🔥 TOP CARDS */}
      <div className="top-cards">

        <div className="highlight-card">
          <h3>🏆 Top Team</h3>
          <h2>{topTeam?.team || "-"}</h2>
          <p>{topTeam?.total_runs || 0} Runs</p>
        </div>

        <div className="highlight-card">
          <h3>🥇 Best Batter</h3>
          <h2>{topPlayer?.name || "-"}</h2>
          <p>{topPlayer?.runs || 0} Runs</p>
        </div>

      </div>

      {teams.length === 0 && <p>No data available</p>}

      {/* ================= TEAM CARDS ================= */}
      {teams
        .filter(t => t && t.team && t.total_runs > 0)
        .map((team) => {

          const players = team.players || [];
          const totalPlayers = players.length;

          const avgSR =
            totalPlayers > 0
              ? (
                  players.reduce((sum, p) => sum + (p?.strike_rate || 0), 0) /
                  totalPlayers
                ).toFixed(2)
              : "0";

          return (
            <div key={team.team} className="card">

              {/* TEAM NAME */}
              <h2>🏏 {team.team}</h2>

              {/* STATS */}
              <div style={statsRow}>
                <StatBox label="Players" value={totalPlayers} />
                <StatBox label="Total Runs" value={team.total_runs || 0} />
                <StatBox label="Avg SR" value={avgSR} />
              </div>

              {/* PLAYER LIST */}
              {players.map((p, index) => (
                <div
                  key={index}
                  className="player-row"
                  style={{
                    background:
                      index === 0
                        ? "linear-gradient(90deg, #22c55e, #16a34a)"
                        : "rgba(255,255,255,0.05)"
                  }}
                >
                  <span className="rank">
                    {index === 0 ? "🥇" :
                     index === 1 ? "🥈" :
                     index === 2 ? "🥉" : `#${index + 1}`}
                  </span>

                  <span>{p.name}</span>

                  <span className="runs">{p.runs}</span>
                </div>
              ))}

              {/* CHART */}
              {players.length > 0 && (
                <div style={{ marginTop: "20px" }}>
                  <ResponsiveContainer width="100%" height={250}>
                    <BarChart data={players}>

                      <XAxis dataKey="name" stroke="#94a3b8" />
                      <YAxis stroke="#94a3b8" />

                      <Tooltip
                        contentStyle={{
                          backgroundColor: "#1e293b",
                          border: "none",
                          color: "white"
                        }}
                      />

                      <Bar dataKey="runs" radius={[10, 10, 0, 0]} />

                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}

            </div>
          );
        })}
    </div>
  );
}

/* ================= COMPONENT ================= */

function StatBox({ label, value }) {
  return (
    <div style={statBox}>
      <h4>{label}</h4>
      <p style={{ fontWeight: "bold" }}>{value}</p>
    </div>
  );
}

/* ================= STYLES ================= */

const statsRow = {
  display: "flex",
  gap: "15px",
  marginBottom: "15px"
};

const statBox = {
  background: "#334155",
  padding: "10px",
  borderRadius: "10px",
  width: "130px",
  textAlign: "center"
};

export default Dashboard;