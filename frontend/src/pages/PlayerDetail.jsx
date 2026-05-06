import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../api";

function PlayerDetail() {
  const { id }                  = useParams();
  const navigate                = useNavigate();
  const [player, setPlayer]     = useState(null);
  const [stats, setStats]       = useState(null);
  const [loading, setLoading]   = useState(true);

  // Logic: Fetch Player and Stats concurrently preserved
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

        // Logic preserved: Strictly match by player_id
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
    <div style={loadingState}>
      <h2 className="glow-text">SYNCING ATHLETE DATA...</h2>
    </div>
  );

  if (!player) return (
    <div style={errorState}>
      <h2 style={{ color: "#e91052", fontSize: '32px' }}>ATHLETE NOT FOUND</h2>
      <p style={{ color: '#94a3b8', margin: '20px 0 30px' }}>Requested identifier does not exist in the tournament registry.</p>
      <button onClick={() => navigate("/players")} style={iccBackBtn}>RETURN TO ROSTER</button>
    </div>
  );

  return (
    <div className="page-fade-in" style={{ background: "#06083b", minHeight: "100vh" }}>
      {/* 1. ICC SPOTLIGHT HEADER */}
      <div style={iccHeroHeader}>
        <div style={iccHeroOverlay}>
          <div style={iccHeroContent}>
            <button onClick={() => navigate("/players")} style={iccBackBtn}>← ALL PLAYERS</button>
            <div style={iccProfileRow}>
              <div style={iccAvatarContainer}>
                {player.photo ? (
                  <img 
                    src={`http://127.0.0.1:5000${player.photo}`} 
                    alt={player.name}
                    style={iccProfileImage} 
                  />
                ) : (
                  <div style={iccProfileFallback}>{player.name?.[0]}</div>
                )}
              </div>
              <div style={iccIdentity}>
                <span style={iccTag}>OFFICIAL PLAYER PROFILE</span>
                <h1 style={iccName}>{player.name}</h1>
                <div style={iccBadgeRow}>
                   <span style={iccRoleBadge}>{player.role}</span>
                   <span style={iccIdBadge}>UID: {player.id}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 2. ANALYTICS DATA STRIP */}
      <div style={iccDataContainer}>
        <div style={iccStatsGrid}>
          {/* Batting Intelligence Panel[cite: 1] */}
          <div className="card" style={iccStatCard}>
            <h3 style={iccCardLabel}>🏏 BATTING INTELLIGENCE</h3>
            <div style={iccStatRow}>
              <Stat label="Total Runs" value={stats.runs ?? 0} accent="#38bdf8" />
              <Stat label="Deliveries" value={stats.balls ?? 0} />
              <Stat label="Strike Rate" value={stats.strike_rate ?? "0.00"} accent="#22c55e" />
            </div>
          </div>

          {/* Bowling Intelligence Panel[cite: 1] */}
          <div className="card" style={iccStatCard}>
            <h3 style={iccCardLabel}>🎯 BOWLING INTELLIGENCE</h3>
            <div style={iccStatRow}>
              <Stat label="Wickets" value={stats.wickets ?? 0} accent="#e91052" />
              <Stat label="Overs" value={stats.overs ?? "0.0"} />
              <Stat label="Economy" value={stats.economy ?? "0.00"} accent="#f59e0b" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ================= ICC HELPER COMPONENTS[cite: 1] ================= */
function Stat({ label, value, accent = "#f8fafc" }) {
  return (
    <div style={iccStatBox}>
      <p style={iccStatLabel}>{label}</p>
      <p style={{ ...iccStatValue, color: accent }}>{value}</p>
    </div>
  );
}

/* ================= ICC STYLES[cite: 1] ================= */
const loadingState = { height: '80vh', display: 'flex', justifyContent: 'center', alignItems: 'center' };
const errorState = { padding: "100px 5%", textAlign: "center" };

const iccHeroHeader = {
  height: "500px",
  background: "linear-gradient(rgba(0,0,0,0.3), #06083b), url('https://images.unsplash.com/photo-1540747913346-19e32dc3e97e?q=80&w=2000') center/cover",
  position: "relative"
};

const iccHeroOverlay = {
  width: "100%",
  height: "100%",
  display: "flex",
  alignItems: "flex-end",
  padding: "60px 5%"
};

const iccHeroContent = { width: "100%", maxWidth: "1200px", margin: "0 auto" };

const iccProfileRow = { display: "flex", alignItems: "center", gap: "40px", marginTop: "30px" };
const iccAvatarContainer = { width: "180px", height: "180px", border: "6px solid #e91052", overflow: "hidden" };
const iccProfileImage = { width: "100%", height: "100%", objectFit: "cover" };
const iccProfileFallback = { width: "100%", height: "100%", background: "#00195a", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "80px", fontWeight: "900", color: "#e91052" };

const iccIdentity = { flex: 1 };
const iccTag = { color: "#38bdf8", fontWeight: "900", fontSize: "12px", letterSpacing: "2px" };
const iccName = { fontSize: "64px", fontWeight: "900", color: "white", margin: "10px 0", lineHeight: "1" };
const iccBadgeRow = { display: "flex", gap: "10px" };
const iccRoleBadge = { background: "#e91052", color: "white", padding: "6px 15px", fontSize: "12px", fontWeight: "800", textTransform: "uppercase" };
const iccIdBadge = { background: "rgba(255,255,255,0.1)", color: "#cbd5e1", padding: "6px 15px", fontSize: "12px", fontWeight: "800" };

const iccDataContainer = { padding: "40px 5%", maxWidth: "1200px", margin: "0 auto" };
const iccStatsGrid = { display: "grid", gridTemplateColumns: "1fr", gap: "30px" };
const iccStatCard = { background: "#00195a", padding: "40px", borderRadius: "0", border: "none" };
const iccCardLabel = { fontSize: "14px", fontWeight: "900", letterSpacing: "2px", color: "#94a3b8", marginBottom: "30px", borderLeft: "4px solid #e91052", paddingLeft: "15px" };

const iccStatRow = { display: "flex", gap: "40px", flexWrap: "wrap" };
const iccStatBox = { flex: "1", minWidth: "150px" };
const iccStatLabel = { fontSize: "11px", color: "#94a3b8", fontWeight: "800", marginBottom: "10px", textTransform: "uppercase" };
const iccStatValue = { fontSize: "42px", fontWeight: "900", margin: 0, lineHeight: "1" };

const iccBackBtn = { background: "transparent", border: "1px solid rgba(255,255,255,0.3)", color: "white", padding: "8px 15px", fontSize: "12px", fontWeight: "700", cursor: "pointer" };

export default PlayerDetail;