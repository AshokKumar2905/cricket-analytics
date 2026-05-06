import { useEffect, useState } from "react";
import api from "../api";
import { CardSkeleton } from "../components/Skeleton";

function Bowling() {
  const [data, setData]       = useState([]);
  const [loading, setLoading] = useState(true);

  // Logic: Fetch bowling data preserved
  useEffect(() => {
    api.get("/bowling-stats")
      .then(res => {
        setData(res.data.data || []);
        setLoading(false);
      })
      .catch(err => {
        console.error("Bowling fetch error:", err);
        setLoading(false);
      });
  }, []);

  if (loading) return (
    <div style={loadingState}>
      <h2 className="glow-text">SYNCING BOWLING INTELLIGENCE...</h2>
      <CardSkeleton count={5} /> 
    </div>
  );

  return (
    <div className="page-fade-in" style={iccPage}>
      {/* 1. ICC SPOTLIGHT HEADER */}
      <div style={iccHeaderSection}>
        <div style={iccHeaderContent}>
          <span style={iccTag}>OFFICIAL RANKINGS</span>
          <h1 style={iccTitle}>Bowling Analytics</h1>
          <p style={iccSubtitle}>
            Strategic insights into athlete impact, delivery control, and tournament economy metrics.
          </p>
        </div>
      </div>

      {/* 2. ANALYTICS TABLE CONTAINER */}
      <div style={contentPadding}>
        {data.length === 0 ? (
          <div style={emptyState}>
            <span style={{fontSize: '64px', display: 'block', marginBottom: '20px'}}>🏏</span>
            <p>No analytical data available for current session.</p>
          </div>
        ) : (
          <div className="icc-table-container">
            <table>
              <thead>
                <tr>
                  <th style={thCenter}>RANK</th>
                  <th>ATHLETE</th>
                  <th style={thCenter}>WICKETS</th>
                  <th style={thCenter}>OVERS</th>
                  <th style={thCenter}>RUNS</th>
                  <th style={thCenter}>ECONOMY</th>
                </tr>
              </thead>
              <tbody>
                {data.map((p, index) => (
                  <tr key={p.name || index}>
                    <td style={tdCenter}>
                      <div style={index === 0 ? goldBadge : index === 1 ? silverBadge : index === 2 ? bronzeBadge : rankBadge}>
                        {index + 1}
                      </div>
                    </td>
                    <td>
                      <div style={playerName}>{p.name}</div>
                    </td>
                    <td style={tdWicket}>{p.wickets}</td>
                    <td style={tdCenter}>{p.overs}</td>
                    <td style={tdCenter}>{p.runs_conceded}</td>
                    <td style={tdEconomy}>{p.economy}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

/* ================= ICC STYLES ================= */
const iccPage = { background: "#06083b", minHeight: "100vh" };
const loadingState = { padding: "100px 5%", textAlign: "center" };

const iccHeaderSection = { 
  background: "linear-gradient(rgba(0,0,0,0.5), #06083b), url('https://images.unsplash.com/photo-1531415074968-036ba1b575da?q=80&w=2067') center/cover", 
  padding: "100px 5% 60px" 
};

const iccHeaderContent = { maxWidth: "1200px", margin: "0 auto" };
const iccTag = { color: "#e91052", fontWeight: "900", letterSpacing: "2px", fontSize: "12px" };
const iccTitle = { color: "white", fontSize: "48px", fontWeight: "900", margin: "10px 0" };
const iccSubtitle = { color: "#94a3b8", fontSize: "16px", maxWidth: "600px" };

const contentPadding = { maxWidth: "1400px", margin: "0 auto" };

const thCenter = { textAlign: 'center' };
const tdCenter = { textAlign: 'center', color: "#cbd5e1" };

const playerName = { fontWeight: "800", color: "white", fontSize: "15px", letterSpacing: '0.5px' };
const tdWicket = { textAlign: 'center', color: "#22c55e", fontWeight: "900", fontSize: "18px" };
const tdEconomy = { textAlign: 'center', color: "#38bdf8", fontWeight: "900", fontSize: "18px" };

const badgeBase = { 
  width: "32px", height: "32px", borderRadius: "4px", 
  display: "flex", alignItems: "center", justifyContent: "center", 
  fontSize: "12px", fontWeight: "900", margin: "0 auto" 
};
const rankBadge = { ...badgeBase, background: "rgba(255,255,255,0.05)", color: "#94a3b8" };
const goldBadge = { ...badgeBase, background: "#e91052", color: "white" }; // Primary Magenta for Rank 1
const silverBadge = { ...badgeBase, background: "#00195a", color: "white", border: "1px solid #38bdf8" };
const bronzeBadge = { ...badgeBase, background: "#00195a", color: "#38bdf8", border: "1px solid rgba(56, 189, 248, 0.3)" };

const emptyState = { padding: "100px 5%", textAlign: "center", color: "#64748b" };

export default Bowling;