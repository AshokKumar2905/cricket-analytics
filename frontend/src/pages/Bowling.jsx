import { useEffect, useState } from "react";
import axios from "axios";

const API = "http://127.0.0.1:5000";

function Bowling() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  // =========================
  // FETCH BOWLING STATS
  // =========================
  useEffect(() => {
    axios.get(`${API}/bowling-stats`)
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
      {/* HEADER */}
      <h1 style={title}>🎯 Bowling Analytics</h1>

      {data.length === 0 ? (
        <p>No bowling data available</p>
      ) : (
        <div style={tableContainer}>

          <table style={table}>
            <thead>
              <tr style={theadRow}>
                <th>#</th>
                <th>Player</th>
                <th>Wickets</th>
                <th>Overs</th>
                <th>Runs</th>
                <th>Economy</th>
              </tr>
            </thead>

            <tbody>
              {data.map((p, index) => (
                <tr key={p.name || index} style={row}>
                  <td>{index + 1}</td>
                  <td>{p.name}</td>
                  <td style={highlightWicket}>{p.wickets}</td>
                  <td>{p.overs}</td>
                  <td>{p.runs_conceded}</td>
                  <td style={highlightEco}>{p.economy}</td>
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
  marginBottom: "20px",
  background: "linear-gradient(90deg, #38bdf8, #22c55e)",
  WebkitBackgroundClip: "text",
  color: "transparent",
  fontWeight: "bold"
};

const tableContainer = {
  background: "linear-gradient(145deg, #1e293b, #020617)",
  padding: "20px",
  borderRadius: "16px",
  boxShadow: "0 10px 25px rgba(0,0,0,0.6)"
};

const table = {
  width: "100%",
  borderCollapse: "collapse",
  color: "white"
};

const theadRow = {
  borderBottom: "2px solid #475569",
  textAlign: "left"
};

const row = {
  borderBottom: "1px solid #334155",
  transition: "0.2s"
};

const highlightWicket = {
  color: "#22c55e", // green (good performance)
  fontWeight: "bold"
};

const highlightEco = {
  color: "#38bdf8", // blue highlight
  fontWeight: "bold"
};

export default Bowling;