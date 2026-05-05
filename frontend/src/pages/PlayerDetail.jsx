import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../api";

function PlayerDetail() {
  const { id }                  = useParams();
  const navigate                = useNavigate();
  const [player, setPlayer]     = useState(null);
  const [stats, setStats]       = useState(null);
  const [loading, setLoading]   = useState(true);

  // Fetch Player and Stats concurrently using your existing api.js logic
  useEffect(() => {
    setLoading(true);
    Promise.all([
      api.get("/players"),
      api.get("/player-stats") 
    ])
      .then(([playersRes, statsRes]) => {
        const players  = playersRes.data.data  || [];
        const allStats = statsRes.data.data    || [];

        const foundPlayer = players.find(p => String(p.id) === String(id)) || null;

        // BUG FIX: Strictly match by player_id
        const foundStats  = allStats.find(s => String(s.player_id) === String(id)) || {};

        setPlayer(foundPlayer);
        setStats(foundStats);
      })
      .catch(err => {
        console.error("PlayerDetail fetch error:", err);
      })
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return (
    <div style={{ padding: "40px", textAlign: "center", color: "#38bdf8" }}>
      <h2>Loading Player Profile...</h2>
    </div>
  );

  if (!player) return (
    <div style={{ padding: "40px", textAlign: "center" }}>
      <h2 style={{ color: "#ef4444" }}>Player not found.</h2>
      <button onClick={() => navigate("/players")} style={btnBack}>← Back to Players</button>
    </div>
  );

  return (
    <div className="page-fade-in">
      {/* NAVIGATION */}
      <button onClick={() => navigate("/players")} style={btnBack}>← Back to Players</button>

      {/* PLAYER IDENTITY SECTION */}
      <div style={headerSection}>
        <h1 style={titleStyle}>{player.name}</h1>
        <p style={roleStyle}>{player.role} • ID: {player.id}</p>
      </div>

      {/* STATS CONTAINERS */}
      <div style={gridContainer}>
        {/* BATTING CARD */}
        <div style={card}>
          <h3 style={cardTitle}>🏏 Batting Analytics</h3>
          <div style={statsGrid}>
            <Stat label="Runs"         value={stats.runs        ?? 0} />
            <Stat label="Balls Faced"  value={stats.balls       ?? 0} />
            <Stat label="Strike Rate"  value={stats.strike_rate ?? "0.00"} />
          </div>
        </div>

        {/* BOWLING CARD */}
        <div style={card}>
          <h3 style={cardTitle}>🎯 Bowling Analytics</h3>
          <div style={statsGrid}>
            <Stat label="Wickets"       value={stats.wickets       ?? 0}     />
            <Stat label="Overs"         value={stats.overs         ?? "0.0"} />
            <Stat label="Runs Conceded" value={stats.runs_conceded ?? 0}     />
            <Stat label="Economy"       value={stats.economy       ?? "0.00"} />
          </div>
        </div>
      </div>
    </div>
  );
}

/* ================= HELPER COMPONENTS ================= */
function Stat({ label, value }) {
  return (
    <div style={statBox}>
      <h4 style={statLabel}>{label}</h4>
      <p style={statValue}>{value}</p>
    </div>
  );
}

/* ================= STYLES ================= */
const headerSection = {
  marginBottom: "30px",
  borderBottom: "1px solid #1e293b",
  paddingBottom: "15px"
};

const titleStyle = {
  margin: "0 0 5px 0",
  background: "linear-gradient(90deg, #38bdf8, #22c55e)",
  WebkitBackgroundClip: "text",
  WebkitTextFillColor: "transparent",
  fontWeight: "bold",
  fontSize: "36px"
};

const roleStyle = {
  margin: 0,
  color: "#94a3b8",
  fontSize: "16px",
  letterSpacing: "0.05em",
  textTransform: "uppercase"
};

const gridContainer = {
  display: "flex",
  flexDirection: "column",
  gap: "20px"
};

const card = {
  background: "#0f172a",
  padding: "25px",
  borderRadius: "16px",
  border: "1px solid #1e293b",
  boxShadow: "0 4px 20px rgba(0,0,0,0.4)"
};

const cardTitle = {
  margin: "0 0 20px 0",
  fontSize: "18px",
  color: "#f8fafc",
  borderLeft: "4px solid #38bdf8",
  paddingLeft: "12px"
};

const statsGrid = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))",
  gap: "15px"
};

const statBox = {
  background: "#020617",
  padding: "18px",
  borderRadius: "12px",
  textAlign: "center",
  border: "1px solid #1e293b"
};

const statLabel = {
  marginBottom: "8px",
  color: "#64748b",
  fontSize: "12px",
  textTransform: "uppercase",
  letterSpacing: "0.1em"
};

const statValue = {
  fontWeight: "bold",
  fontSize: "24px",
  margin: 0,
  color: "#f1f5f9"
};

const btnBack = {
  marginBottom: "25px",
  background: "#1e293b",
  color: "#f8fafc",
  border: "1px solid #334155",
  padding: "10px 18px",
  borderRadius: "8px",
  cursor: "pointer",
  fontSize: "14px",
  transition: "all 0.2s"
};

export default PlayerDetail;