import { useEffect, useState } from "react";
import axios from "axios";
import {
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer
} from "recharts";

const API = "http://127.0.0.1:5000";

function Matches() {
  const [matches, setMatches] = useState([]);
  const [results, setResults] = useState({});

  const [team1, setTeam1] = useState("");
  const [team2, setTeam2] = useState("");
  const [format, setFormat] = useState("");
  const [venue, setVenue] = useState("");

  // =========================
  // WIN PROBABILITY
  // =========================
  const getWinProbability = (t1, t2) => {
    const total = t1 + t2;
    if (total === 0) return 50;
    return Math.round((t1 / total) * 100);
  };

  // =========================
  // BUILD RUN GRAPH DATA
  // =========================
  const buildRunData = (teamRuns) => {
    if (!teamRuns) return [];

    let overs = 10;
    let runsPerOver = Math.ceil(teamRuns / overs);

    let data = [];

    for (let i = 1; i <= overs; i++) {
      data.push({
        over: i,
        runs: runsPerOver * i
      });
    }

    return data;
  };

  // =========================
  // FETCH MATCHES
  // =========================
  const fetchMatches = async () => {
    try {
      const res = await axios.get(`${API}/matches`);
      setMatches(res.data.data || []);
    } catch (err) {
      console.error("Fetch error:", err);
    }
  };

  useEffect(() => {
    fetchMatches();
  }, []);

  // =========================
  // FETCH RESULTS
  // =========================
  useEffect(() => {
    const fetchResults = async () => {
      let data = {};

      for (let m of matches) {
        const id = m.id;
        if (!id) continue;

        try {
          const res = await axios.get(`${API}/match-result/${id}`);
          data[id] = res.data.data;
        } catch (err) {
          console.error("Result error:", err);
        }
      }

      setResults(data);
    };

    if (matches.length > 0) fetchResults();
  }, [matches]);

  // =========================
  // ADD MATCH
  // =========================
  const addMatch = async () => {
    if (!team1 || !team2 || !format || !venue) return;

    try {
      const res = await axios.post(`${API}/matches`, {
        team1,
        team2,
        format,
        venue,
      });

      setMatches((prev) => [...prev, res.data.data]);

      setTeam1("");
      setTeam2("");
      setFormat("");
      setVenue("");
    } catch (err) {
      console.error("Add error:", err);
    }
  };

  // =========================
  // DELETE MATCH
  // =========================
  const deleteMatch = async (id) => {
    try {
      await axios.delete(`${API}/matches/${id}`);
      setMatches((prev) => prev.filter((m) => m.id !== id));
    } catch (err) {
      console.error("Delete error:", err);
    }
  };

  return (
    <div>
      {/* HEADER */}
      <h1 style={title}>🏟 Live Matches</h1>

      {/* ADD MATCH */}
      <div style={form}>
        <input placeholder="Team 1" value={team1} onChange={(e) => setTeam1(e.target.value)} />
        <input placeholder="Team 2" value={team2} onChange={(e) => setTeam2(e.target.value)} />
        <input placeholder="Format" value={format} onChange={(e) => setFormat(e.target.value)} />
        <input placeholder="Venue" value={venue} onChange={(e) => setVenue(e.target.value)} />
        <button onClick={addMatch}>+ Add</button>
      </div>

      {/* MATCH LIST */}
      {matches.map((m) => {
        const id = m.id;
        const result = results[id];

        return (
          <div key={id} className="match-card">

            {/* HEADER */}
            <div className="match-header">
              <h3>{m.team1} vs {m.team2}</h3>
              <span className="live-badge">LIVE</span>
            </div>

            {/* META */}
            <p style={meta}>{m.format} • {m.venue}</p>

            {/* SCORE + RESULT */}
            {result && (
              <>
                <div className="score">
                  <p>{result.match.team1}: {result.match.team1_runs}</p>
                  <p>{result.match.team2}: {result.match.team2_runs}</p>
                </div>

                {/* WIN PROBABILITY */}
                <div style={{ marginTop: "10px" }}>
                  <p style={{ fontSize: "13px" }}>Win Probability</p>

                  <div style={probBar}>
                    <div
                      style={{
                        ...probFill,
                        width: `${getWinProbability(
                          result.match.team1_runs,
                          result.match.team2_runs
                        )}%`
                      }}
                    />
                  </div>

                  <p style={{ fontSize: "12px", marginTop: "4px" }}>
                    {getWinProbability(
                      result.match.team1_runs,
                      result.match.team2_runs
                    )}% {result.match.team1}
                  </p>
                </div>

                {/* RUN GRAPH */}
                <div style={{ marginTop: "15px" }}>
                  <ResponsiveContainer width="100%" height={200}>
                    <LineChart data={buildRunData(result.match.team1_runs)}>
                      <XAxis dataKey="over" stroke="#94a3b8" />
                      <YAxis stroke="#94a3b8" />
                      <Tooltip />
                      <Line
                        type="monotone"
                        dataKey="runs"
                        stroke="#38bdf8"
                        strokeWidth={3}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>

                {/* RESULT BADGES */}
                <div className="result">
                  <span className="badge badge-win">
                    🏆 {result.match.winner}
                  </span>

                  <span className="badge badge-player">
                    ⭐ {result.player_of_match?.name || "N/A"}
                  </span>
                </div>
              </>
            )}

            {/* DELETE */}
            <button style={btnDanger} onClick={() => deleteMatch(id)}>
              Delete
            </button>

          </div>
        );
      })}
    </div>
  );
}

/* ================= STYLES ================= */

const title = {
  marginBottom: "20px",
  background: "linear-gradient(90deg, #38bdf8, #22c55e)",
  WebkitBackgroundClip: "text",
  WebkitTextFillColor: "transparent",
  fontWeight: "bold"
};

const form = {
  display: "flex",
  gap: "10px",
  marginBottom: "20px",
  flexWrap: "wrap"
};

const meta = {
  color: "#94a3b8",
  fontSize: "14px"
};

const btnDanger = {
  marginTop: "10px",
  background: "#ef4444",
  color: "white",
  border: "none",
  padding: "6px 12px",
  borderRadius: "8px",
  cursor: "pointer"
};

const probBar = {
  height: "10px",
  background: "#1e293b",
  borderRadius: "10px",
  overflow: "hidden"
};

const probFill = {
  height: "100%",
  background: "linear-gradient(90deg, #22c55e, #16a34a)"
};

export default Matches;