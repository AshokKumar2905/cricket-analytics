import { useEffect, useState } from "react";
import axios from "axios";
import { useParams } from "react-router-dom";

const API = "http://127.0.0.1:5000";

function PlayerDetail() {
  const { id } = useParams();

  const [player, setPlayer] = useState(null);
  const [stats, setStats] = useState(null);

  // =========================
  // FETCH PLAYER
  // =========================
  useEffect(() => {
    axios.get(`${API}/players`)
      .then(res => {
        const players = res.data.data || [];
        const found = players.find(p => p.id === id);
        setPlayer(found);
      })
      .catch(err => console.error("Player error:", err));
  }, [id]);

  // =========================
  // FETCH STATS (AFTER PLAYER)
  // =========================
  useEffect(() => {
    if (!player) return;

    axios.get(`${API}/player-stats`)
      .then(res => {
        const allStats = res.data.data || [];

        const foundStats = allStats.find(
          s => s.name === player.name
        );

        setStats(foundStats || {});
      })
      .catch(err => console.error("Stats error:", err));

  }, [player]);

  if (!player) return <h2>Loading Player...</h2>;
  if (!stats) return <h2>Loading Stats...</h2>;

  return (
    <div>
      {/* HEADER */}
      <h1 style={title}>{player.name}</h1>
      <p style={role}>{player.role}</p>

      {/* CARD */}
      <div style={card}>

        <h3 style={{ marginBottom: "15px" }}>📊 Player Stats</h3>

        <div style={statsGrid}>
          <Stat label="Runs" value={stats.runs} />
          <Stat label="Strike Rate" value={stats.strike_rate} />
          <Stat label="Wickets" value={stats.wickets} />
          <Stat label="Economy" value={stats.economy} />
        </div>

      </div>
    </div>
  );
}

/* ================= STAT BOX ================= */

function Stat({ label, value }) {
  return (
    <div style={statBox}>
      <h4>{label}</h4>
      <p>{value || 0}</p>
    </div>
  );
}

/* ================= STYLES ================= */

const title = {
  marginBottom: "10px",
  background: "linear-gradient(90deg, #38bdf8, #22c55e)",
  WebkitBackgroundClip: "text",
  color: "transparent",
  fontWeight: "bold"
};

const role = {
  marginBottom: "20px",
  color: "#94a3b8"
};

const card = {
  background: "linear-gradient(145deg, #1e293b, #020617)",
  padding: "20px",
  borderRadius: "16px",
  boxShadow: "0 10px 25px rgba(0,0,0,0.6)"
};

const statsGrid = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))",
  gap: "15px"
};

const statBox = {
  background: "#334155",
  padding: "15px",
  borderRadius: "10px",
  textAlign: "center"
};

export default PlayerDetail;