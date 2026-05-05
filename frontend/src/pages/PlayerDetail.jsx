import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../api";

function PlayerDetail() {
  const { id }                  = useParams();
  const navigate                = useNavigate();
  const [player, setPlayer]     = useState(null);
  const [stats, setStats]       = useState(null);
  const [loading, setLoading]   = useState(true);

  // =========================
  // FETCH PLAYER + STATS IN PARALLEL
  // =========================
  useEffect(() => {
    Promise.all([
      api.get("/players"),
      api.get("/player-stats")   // correct endpoint (was missing in backend)
    ])
      .then(([playersRes, statsRes]) => {
        const players  = playersRes.data.data  || [];
        const allStats = statsRes.data.data    || [];

        const foundPlayer = players.find(p => p.id === id) || null;

        // BUG FIX: match by player_id, not by name
        const foundStats  = allStats.find(s => s.player_id === id) || {};

        setPlayer(foundPlayer);
        setStats(foundStats);
      })
      .catch(err => console.error("PlayerDetail error:", err))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading)  return <h2>Loading...</h2>;
  if (!player)  return (
    <div>
      <h2>Player not found.</h2>
      <button onClick={() => navigate("/players")} style={btnBack}>← Back to Players</button>
    </div>
  );

  return (
    <div>
      {/* BACK BUTTON */}
      <button onClick={() => navigate("/players")} style={btnBack}>← Back</button>

      {/* HEADER */}
      <h1 style={titleStyle}>{player.name}</h1>
      <p style={roleStyle}>{player.role}</p>

      {/* BATTING CARD */}
      <div style={card}>
        <h3 style={{ marginBottom: "15px" }}>🏏 Batting Stats</h3>
        <div style={statsGrid}>
          <Stat label="Runs"        value={stats.runs        ?? 0} />
          <Stat label="Balls Faced" value={stats.balls       ?? 0} />
          <Stat label="Strike Rate" value={stats.strike_rate ?? 0} />
        </div>
      </div>

      {/* BOWLING CARD */}
      <div style={{ ...card, marginTop: "20px" }}>
        <h3 style={{ marginBottom: "15px" }}>🎯 Bowling Stats</h3>
        <div style={statsGrid}>
          <Stat label="Wickets"      value={stats.wickets      ?? 0}     />
          <Stat label="Overs"        value={stats.overs        ?? "0.0"} />
          <Stat label="Runs Conceded" value={stats.runs_conceded ?? 0}   />
          <Stat label="Economy"      value={stats.economy      ?? 0}     />
        </div>
      </div>
    </div>
  );
}

/* ================= STAT BOX ================= */
function Stat({ label, value }) {
  return (
    <div style={statBox}>
      <h4 style={{ marginBottom: 6, color: "#94a3b8", fontSize: "13px" }}>{label}</h4>
      <p style={{ fontWeight: "bold", fontSize: "22px", margin: 0 }}>{value}</p>
    </div>
  );
}

/* ================= STYLES ================= */
const titleStyle = {
  marginBottom:         "6px",
  background:           "linear-gradient(90deg, #38bdf8, #22c55e)",
  WebkitBackgroundClip: "text",
  color:                "transparent",
  fontWeight:           "bold"
};

const roleStyle = {
  marginBottom: "20px",
  color:        "#94a3b8"
};

const card = {
  background:   "linear-gradient(145deg, #1e293b, #020617)",
  padding:      "20px",
  borderRadius: "16px",
  boxShadow:    "0 10px 25px rgba(0,0,0,0.6)"
};

const statsGrid = {
  display:             "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))",
  gap:                 "15px"
};

const statBox = {
  background:   "#334155",
  padding:      "15px",
  borderRadius: "10px",
  textAlign:    "center"
};

const btnBack = {
  marginBottom: "20px",
  background:   "#334155",
  color:        "white",
  border:       "none",
  padding:      "8px 16px",
  borderRadius: "8px",
  cursor:       "pointer"
};

export default PlayerDetail;