import { useEffect, useState } from "react";
import api from "../api";
import {
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer
} from "recharts";

function Matches() {
  const [search, setSearch] = useState("");
  const [filterFormat, setFilterFormat] = useState("");
  const [matches, setMatches]   = useState([]);
  const [results, setResults]   = useState({});
  const [team1, setTeam1]       = useState("");
  const [team2, setTeam2]       = useState("");
  const [format, setFormat]     = useState("");
  const [venue, setVenue]       = useState("");

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
    const overs      = 10;
    const runsPerOver = Math.ceil(teamRuns / overs);
    return Array.from({ length: overs }, (_, i) => ({
      over: i + 1,
      runs: runsPerOver * (i + 1)
    }));
  };

  // =========================
  // FETCH MATCHES
  // =========================
const fetchMatches = async () => {
  try {
    let url = "/matches?";
    if (search) url += `search=${search}&`;
    if (filterFormat) url += `format=${filterFormat}`;

    const res = await api.get(url);
    setMatches(res.data.data || []);
  } catch (err) {
    console.error("Fetch error:", err);
  }
};


useEffect(() => {
  fetchMatches();
}, [search, filterFormat]);

  // =========================
  // FETCH RESULTS FOR ALL MATCHES
  // =========================
  useEffect(() => {
    if (matches.length === 0) return;

    const fetchResults = async () => {
      const entries = await Promise.allSettled(
        matches.map(m =>
          api.get(`/match-result/${m.id}`)
            .then(res => [m.id, res.data.data])
        )
      );

      const data = {};
      for (const entry of entries) {
        if (entry.status === "fulfilled") {
          const [id, result] = entry.value;
          data[id] = result;
        }
      }
      setResults(data);
    };

    fetchResults();
  }, [matches]);

  // =========================
  // ADD MATCH
  // =========================
  const addMatch = async () => {
    if (!team1 || !team2 || !format || !venue) return;
    try {
      const res = await api.post("/matches", { team1, team2, format, venue });
      setMatches(prev => [...prev, res.data.data]);
      setTeam1(""); setTeam2(""); setFormat(""); setVenue("");
    } catch (err) {
      console.error("Add error:", err);
    }
  };

  // =========================
  // DELETE MATCH
  // =========================
  const deleteMatch = async (id) => {
    try {
      await api.delete(`/matches/${id}`);
      setMatches(prev => prev.filter(m => m.id !== id));
      setResults(prev => { const next = { ...prev }; delete next[id]; return next; });
    } catch (err) {
      console.error("Delete error:", err);
    }
  };

  return (
    <div>
      <h1 style={title}>🏟 Live Matches</h1>

      {/* ADD MATCH FORM */}
      <div style={form}>
        <input placeholder="Team 1" value={team1} onChange={e => setTeam1(e.target.value)} />
        <input placeholder="Team 2" value={team2} onChange={e => setTeam2(e.target.value)} />
        <input placeholder="Format" value={format} onChange={e => setFormat(e.target.value)} />
        <input placeholder="Venue"  value={venue}  onChange={e => setVenue(e.target.value)}  />
        <button onClick={addMatch}>+ Add</button>
      </div>

      {/* SEARCH + FILTER */}
<div style={{ display: "flex", gap: "10px", marginBottom: "20px", flexWrap: "wrap" }}>
  <input
    placeholder="🔍 Search team..."
    value={search}
    onChange={(e) => setSearch(e.target.value)}
  />

  <select
    value={filterFormat}
    onChange={(e) => setFilterFormat(e.target.value)}
  >
    <option value="">All Formats</option>
    <option>T20</option>
    <option>ODI</option>
    <option>Test</option>
  </select>
</div>

      {/* MATCH LIST */}
      {matches.map((m) => {
        const id     = m.id;
        const result = results[id];

        return (
          <div key={id} className="match-card">

            {/* HEADER */}
            <div className="match-header">
              <h3>{m.team1} vs {m.team2}</h3>
              <span className="live-badge">LIVE</span>
            </div>

            <p style={meta}>{m.format} • {m.venue}</p>

            {result && (
              <>
                {/* SCORES */}
                <div className="score">
                  <p>{result.match.team1}: <strong>{result.match.team1_runs}</strong></p>
                  <p>{result.match.team2}: <strong>{result.match.team2_runs}</strong></p>
                </div>

                {/* WIN PROBABILITY */}
                <div style={{ marginTop: "10px" }}>
                  <p style={{ fontSize: "13px" }}>Win Probability</p>
                  <div style={probBar}>
                    <div
                      style={{
                        ...probFill,
                        width: `${getWinProbability(result.match.team1_runs, result.match.team2_runs)}%`
                      }}
                    />
                  </div>
                  <p style={{ fontSize: "12px", marginTop: "4px" }}>
                    {getWinProbability(result.match.team1_runs, result.match.team2_runs)}% {result.match.team1}
                  </p>
                </div>

                {/* RUN GRAPH */}
                <div style={{ marginTop: "15px" }}>
                  <ResponsiveContainer width="100%" height={200}>
                    <LineChart data={buildRunData(result.match.team1_runs)}>
                      <XAxis dataKey="over" stroke="#94a3b8" />
                      <YAxis stroke="#94a3b8" />
                      <Tooltip />
                      <Line type="monotone" dataKey="runs" stroke="#38bdf8" strokeWidth={3} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>

                {/* RESULT BADGES */}
                <div className="result">
                  <span className="badge badge-win">🏆 {result.match.winner}</span>
                  <span className="badge badge-player">⭐ {result.player_of_match?.name || "N/A"}</span>
                </div>
              </>
            )}

            <button style={btnDanger} onClick={() => deleteMatch(id)}>Delete</button>
          </div>
        );
      })}
    </div>
  );
}

/* ================= STYLES ================= */
const title = {
  marginBottom:         "20px",
  background:           "linear-gradient(90deg, #38bdf8, #22c55e)",
  WebkitBackgroundClip: "text",
  WebkitTextFillColor:  "transparent",
  fontWeight:           "bold"
};

const form = {
  display:      "flex",
  gap:          "10px",
  marginBottom: "20px",
  flexWrap:     "wrap"
};

const meta = {
  color:    "#94a3b8",
  fontSize: "14px"
};

const btnDanger = {
  marginTop:    "10px",
  background:   "#ef4444",
  color:        "white",
  border:       "none",
  padding:      "6px 12px",
  borderRadius: "8px",
  cursor:       "pointer"
};

const probBar = {
  height:       "10px",
  background:   "#1e293b",
  borderRadius: "10px",
  overflow:     "hidden"
};

const probFill = {
  height:     "100%",
  background: "linear-gradient(90deg, #22c55e, #16a34a)"
};

export default Matches;