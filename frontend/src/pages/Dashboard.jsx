import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip,
  ResponsiveContainer, Cell
} from "recharts";

const BAR_COLORS = ["#38bdf8", "#22c55e", "#a855f7", "#f59e0b", "#ef4444", "#06b6d4"];

function Dashboard() {
  const [teams, setTeams]     = useState([]);
  const [matches, setMatches] = useState([]);
  const [selectedMatch, setSelectedMatch] = useState("");
  const [data, setData]       = useState(null);
  const [mode, setMode]       = useState("tournament");
  const [loading, setLoading] = useState(true);

  const navigate = useNavigate();

  useEffect(() => {
    api.get("/matches")
      .then(res => {
        const list = res.data.data || [];
        setMatches(list);

        if (list.length > 0) {
          setSelectedMatch(list[0].id);
        }
      })
      .catch(err => console.error("Match fetch error:", err));
  }, []);

  useEffect(() => {
    if (mode === "match" && !selectedMatch) return;

    setLoading(true);

    const url =
      mode === "match"
        ? `/dashboard/${selectedMatch}`
        : "/leaderboard";

    api.get(url)
      .then(res => {
        if (mode === "match") {
          setData(res.data.data);
        } else {
          setTeams(res.data.data || []);
        }
        setLoading(false);
      })
      .catch(err => {
        console.error("Dashboard error:", err);
        setLoading(false);
      });
  }, [mode, selectedMatch]);

  if (loading) return <h2 style={{ color: "white", padding: 30 }}>Loading...</h2>;

  let topTeam, topPlayer, totalTeams, totalPlayers;

  if (mode === "match" && data) {
    topTeam = {
      team: data.top_team,
      total_runs: data.team_runs[data.top_team]
    };

    topPlayer = data.best_batter;
    totalTeams = data.teams.length;
    totalPlayers = data.total_players;

  } else {
    topTeam = teams[0];

    const allPlayers = teams.flatMap(t => t.players || []);
    topPlayer = [...allPlayers].sort((a, b) => b.runs - a.runs)[0];

    totalTeams = teams.length;
    totalPlayers = allPlayers.length;
  }

  const handleResetAll = async () => {
    const confirmReset = window.confirm(
      "⚠️ This will delete ALL data (Players, Matches, Performance). Continue?"
    );

    if (!confirmReset) return;

    try {
      await api.delete("/reset-all");

      setTeams([]);
      setData(null);
      setMatches([]);
      setSelectedMatch("");

      alert("✅ All data reset successfully!");
    } catch (error) {
      console.error("Reset error:", error);
      alert("❌ Failed to reset data");
    }
  };

  return (
    <div>

      {/* HERO */}
      <div className="hero">
        <div>
          <h1>🏏 Live Cricket Dashboard</h1>
          <p style={{ color: "#94a3b8" }}>
            {mode === "match" ? "Match Insights" : "Tournament Insights"}
          </p>
        </div>
        <div className="live-badge">LIVE</div>
      </div>

      {/* MODE TOGGLE */}
      <div style={{ marginBottom: "20px" }}>
        <button onClick={() => setMode("tournament")} style={{ marginRight: 10 }}>
          Tournament
        </button>
        <button onClick={() => setMode("match")}>
          Match
        </button>
      </div>

      {/* ✅ FIXED: BUTTON INSIDE RETURN */}
      <button
        onClick={handleResetAll}
        style={{
          background: "#ef4444",
          color: "white",
          border: "none",
          padding: "10px 16px",
          borderRadius: "8px",
          cursor: "pointer",
          marginBottom: "20px"
        }}
      >
        🗑 Reset All Data
      </button>

      {/* MATCH SELECT */}
      {mode === "match" && (
        <div style={{ marginBottom: "20px" }}>
          <select
            value={selectedMatch}
            onChange={(e) => setSelectedMatch(e.target.value)}
            style={{
              padding: "10px",
              borderRadius: "8px",
              background: "#0f172a",
              color: "white",
              border: "1px solid #334155"
            }}
          >
            {matches.map(m => (
              <option key={m.id} value={m.id}>
                {m.team1} vs {m.team2} ({m.format})
              </option>
            ))}
          </select>
        </div>
      )}

      {/* SUMMARY CARDS */}
      <div className="top-cards">
        <div className="highlight-card">
          <p style={cardLabel}>
            {mode === "match" ? "🏆 Winner" : "🏆 Top Team"}
          </p>
          <h2 style={cardValue}>{topTeam?.team || "—"}</h2>
          <p style={cardSub}>{topTeam?.total_runs ?? 0} Runs</p>
        </div>

        <div className="highlight-card">
          <p style={cardLabel}>🥇 Best Batter</p>
          <h2 style={cardValue}>{topPlayer?.name || "—"}</h2>
          <p style={cardSub}>{topPlayer?.runs ?? 0} Runs</p>
        </div>

        <div className="highlight-card">
          <p style={cardLabel}>👥 Total Teams</p>
          <h2 style={cardValue}>{totalTeams}</h2>
        </div>

        <div className="highlight-card">
          <p style={cardLabel}>🧑‍🤝‍🧑 Total Players</p>
          <h2 style={cardValue}>{totalPlayers}</h2>
        </div>
      </div>

      {/* MATCH VIEW */}
      {mode === "match" && data && (
        <div className="card">
          <h2>🏏 Match Summary</h2>
          {data.teams.map(team => (
            <p key={team}>
              <strong>{team}</strong>: {data.team_runs[team]} runs
            </p>
          ))}
        </div>
      )}

      {/* TOURNAMENT VIEW */}
      {mode === "tournament" && teams.length === 0 && (
        <p style={{ color: "#94a3b8" }}>
          No data yet. Add matches and performances first.
        </p>
      )}

      {mode === "tournament" && teams.map((team) => {
        const players = team.players || [];
        const totalPlayers = players.length;
        const avgSR = totalPlayers > 0
          ? (players.reduce((s, p) => s + (p.strike_rate || 0), 0) / totalPlayers).toFixed(2)
          : "0.00";

        return (
          <div key={team.team} className="card">
            <h2 style={{ marginBottom: 16 }}>🏏 {team.team}</h2>

            <div style={statsRow}>
              <StatBox label="Players" value={totalPlayers} />
              <StatBox label="Total Runs" value={team.total_runs ?? 0} />
              <StatBox label="Avg SR" value={avgSR} />
            </div>
          </div>
        );
      })}
    </div>
  );
}

function StatBox({ label, value }) {
  return (
    <div style={statBox}>
      <p style={{ color: "#64748b", fontSize: 12 }}>{label}</p>
      <p style={{ fontWeight: "bold", fontSize: 18, color: "white" }}>{value}</p>
    </div>
  );
}

const statsRow = {
  display: "flex",
  gap: "12px",
  marginBottom: "16px",
  flexWrap: "wrap"
};

const statBox = {
  background: "#0f172a",
  border: "1px solid #1e293b",
  padding: "12px 18px",
  borderRadius: "10px",
  minWidth: "110px",
  textAlign: "center"
};

const cardLabel = {
  color: "#64748b",
  fontSize: 13
};

const cardValue = {
  fontSize: 22,
  color: "white"
};

const cardSub = {
  color: "#38bdf8",
  fontSize: 13
};

export default Dashboard;