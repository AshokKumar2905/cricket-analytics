import { useEffect, useState } from "react";
import api from "../api";

function Bowling() {
  const [data, setData]       = useState([]);
  const [loading, setLoading] = useState(true);

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

  if (loading) return <h2>Loading Bowling Stats...</h2>;

  return (
    <div>
      <h1 style={title}>🎯 Bowling Analytics</h1>

      {data.length === 0 ? (
        <p style={{ color: "#94a3b8" }}>No bowling data available. Add performances first.</p>
      ) : (
        <div style={tableContainer}>
          <table style={table}>
            <thead>
              <tr style={theadRow}>
                <th style={th}>#</th>
                <th style={th}>Player</th>
                <th style={th}>Wickets</th>
                <th style={th}>Overs</th>
                <th style={th}>Runs</th>
                <th style={th}>Economy</th>
              </tr>
            </thead>
            <tbody>
              {data.map((p, index) => (
                <tr key={p.name || index} style={row}>
                  <td style={td}>{index + 1}</td>
                  <td style={td}>{p.name}</td>
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
const title = {
  marginBottom:         "20px",
  background:           "linear-gradient(90deg, #38bdf8, #22c55e)",
  WebkitBackgroundClip: "text",
  color:                "transparent",
  fontWeight:           "bold"
};

const tableContainer = {
  background:   "linear-gradient(145deg, #1e293b, #020617)",
  padding:      "20px",
  borderRadius: "16px",
  boxShadow:    "0 10px 25px rgba(0,0,0,0.6)"
};

const table = {
  width:           "100%",
  borderCollapse:  "collapse",
  color:           "white"
};

const theadRow = {
  borderBottom: "2px solid #475569",
  textAlign:    "left"
};

const th = {
  padding:      "10px 14px",
  color:        "#94a3b8",
  fontSize:     "13px",
  fontWeight:   "600",
  letterSpacing:"0.05em"
};

const row = {
  borderBottom: "1px solid #334155",
  transition:   "background 0.2s"
};

const td = {
  padding: "12px 14px"
};

const highlightWicket = {
  color:      "#22c55e",
  fontWeight: "bold"
};

const highlightEco = {
  color:      "#38bdf8",
  fontWeight: "bold"
};

export default Bowling;