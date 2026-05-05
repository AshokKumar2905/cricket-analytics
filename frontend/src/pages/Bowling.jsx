import { useEffect, useState } from "react";
import api from "../api";
import { CardSkeleton } from "../components/Skeleton"; // Using your existing skeleton component

function Bowling() {
  const [data, setData]       = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // API endpoint remains as defined in your logic
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
    <div style={{ padding: "20px" }}>
      <h1 style={title}>🎯 Bowling Analytics</h1>
      <CardSkeleton /> 
    </div>
  );

  return (
    <div className="page-fade-in">
      <div style={headerSection}>
        <h1 style={title}>🎯 Bowling Analytics</h1>
        <p style={subtitle}>Detailed bowler impact and economy metrics</p>
      </div>

      {data.length === 0 ? (
        <div style={emptyState}>
          <p>No bowling data available. Add match performances to see insights.</p>
        </div>
      ) : (
        <div className="card" style={tableContainer}>
          <table style={table}>
            <thead>
              <tr style={theadRow}>
                <th style={th}>RANK</th>
                <th style={th}>PLAYER</th>
                <th style={th}>WICKETS</th>
                <th style={th}>OVERS</th>
                <th style={th}>RUNS</th>
                <th style={th}>ECONOMY</th>
              </tr>
            </thead>
            <tbody>
              {data.map((p, index) => (
                <tr key={p.name || index} style={row} className="table-row-hover">
                  <td style={td}>{index + 1}</td>
                  <td style={td}><strong>{p.name}</strong></td>
                  <td style={{ ...td, ...highlightWicket }}>{p.wickets}</td>
                  <td style={td}>{p.overs}</td>
                  <td style={td}>{p.runs_conceded}</td>
                  <td style={{ ...td, ...highlightEco }}>{p.economy}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

/* ================= STYLES ================= */

const headerSection = {
  marginBottom: "30px"
};

const title = {
  margin: 0,
  background: "linear-gradient(90deg, #38bdf8, #22c55e)",
  WebkitBackgroundClip: "text",
  color: "transparent",
  fontWeight: "bold",
  fontSize: "28px"
};

const subtitle = {
  color: "#94a3b8",
  marginTop: "8px",
  fontSize: "14px"
};

const emptyState = {
  padding: "40px",
  textAlign: "center",
  color: "#64748b",
  background: "#0f172a",
  borderRadius: "12px",
  border: "1px dashed #1e293b"
};

const tableContainer = {
  background: "#0f172a",
  padding: "24px",
  borderRadius: "16px",
  border: "1px solid #1e293b",
  boxShadow: "0 4px 20px rgba(0,0,0,0.4)"
};

const table = {
  width: "100%",
  borderCollapse: "collapse",
  color: "white"
};

const theadRow = {
  borderBottom: "1px solid #1e293b",
  textAlign: "left"
};

const th = {
  padding: "12px 16px",
  color: "#64748b",
  fontSize: "12px",
  fontWeight: "700",
  letterSpacing: "0.1em",
  textTransform: "uppercase"
};

const row = {
  borderBottom: "1px solid #1e293b",
  transition: "all 0.2s"
};

const td = {
  padding: "16px"
};

const highlightWicket = {
  color: "#22c55e", // Green for positive performance (wickets)
  fontWeight: "bold"
};

const highlightEco = {
  color: "#38bdf8", // Blue for economy metrics[cite: 1]
  fontWeight: "bold"
};

export default Bowling;