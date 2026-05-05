import { useEffect, useState } from "react";
import api from "../api";

function Performance() {
  const [players, setPlayers] = useState([]);
  const [matches, setMatches] = useState([]);

  const [form, setForm] = useState({
    player_id:     "",
    match_id:      "",
    team:          "",
    runs:          "",
    balls:         "",
    wickets:       "",
    runs_conceded: "",
    balls_bowled:  ""
  });

  useEffect(() => {
    api.get("/players").then(res => setPlayers(res.data.data || []));
    api.get("/matches").then(res => setMatches(res.data.data || []));
  }, []);

  const add = () => {
    if (!form.player_id || !form.match_id) {
      alert("Select player and match");
      return;
    }

    api.post("/performance", form).then(() => {
      alert("Performance Added ✅");
      setForm({
        player_id:     "",
        match_id:      "",
        team:          "",
        runs:          "",
        balls:         "",
        wickets:       "",
        runs_conceded: "",
        balls_bowled:  ""
      });
    }).catch(err => {
      console.error("Add performance error:", err);
      alert("Failed to add performance ❌");
    });
  };

  const set = (key, val) => setForm(prev => ({ ...prev, [key]: val }));

  return (
    <div>
      <h1 style={title}>📈 Performance Entry</h1>

      <div style={container}>

        {/* PLAYER */}
        <Field label="Player">
          <select value={form.player_id} onChange={e => set("player_id", e.target.value)} style={input}>
            <option value="">Select Player</option>
            {players.map((p, i) => (
              <option key={p.id || i} value={p.id}>{p.name}</option>
            ))}
          </select>
        </Field>

        {/* MATCH */}
        <Field label="Match">
          <select value={form.match_id} onChange={e => set("match_id", e.target.value)} style={input}>
            <option value="">Select Match</option>
            {matches.map((m, i) => (
              <option key={m.id || i} value={m.id}>{m.team1} vs {m.team2}</option>
            ))}
          </select>
        </Field>

        {/* TEAM */}
        <Field label="Team (batting side)">
          <input
            placeholder="e.g. India"
            value={form.team}
            onChange={e => set("team", e.target.value)}
            style={input}
          />
        </Field>

        {/* BATTING */}
        <Field label="Runs Scored">
          <input type="number" min="0" placeholder="0" value={form.runs}
            onChange={e => set("runs", e.target.value)} style={input} />
        </Field>

        <Field label="Balls Faced">
          <input type="number" min="0" placeholder="0" value={form.balls}
            onChange={e => set("balls", e.target.value)} style={input} />
        </Field>

        {/* BOWLING */}
        <Field label="Wickets Taken">
          <input type="number" min="0" placeholder="0" value={form.wickets}
            onChange={e => set("wickets", e.target.value)} style={input} />
        </Field>

        <Field label="Runs Conceded">
          <input type="number" min="0" placeholder="0" value={form.runs_conceded}
            onChange={e => set("runs_conceded", e.target.value)} style={input} />
        </Field>

        <Field label="Balls Bowled">
          <input type="number" min="0" placeholder="0" value={form.balls_bowled}
            onChange={e => set("balls_bowled", e.target.value)} style={input} />
        </Field>

        <button onClick={add} style={btnAdd}>➕ Add Performance</button>

      </div>
    </div>
  );
}

function Field({ label, children }) {
  return (
    <div style={field}>
      <label style={labelStyle}>{label}</label>
      {children}
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

const container = {
  display:             "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
  gap:                 "20px",
  background:          "linear-gradient(145deg, #1e293b, #020617)",
  padding:             "20px",
  borderRadius:        "16px",
  boxShadow:           "0 10px 25px rgba(0,0,0,0.6)"
};

const field = {
  display:       "flex",
  flexDirection: "column",
  gap:           "6px"
};

const labelStyle = {
  fontSize: "14px",
  color:    "#94a3b8"
};

const input = {
  padding:      "10px",
  borderRadius: "8px",
  border:       "1px solid #334155",
  background:   "#0f172a",
  color:        "white"
};

const btnAdd = {
  gridColumn:   "span 2",
  background:   "#22c55e",
  color:        "white",
  border:       "none",
  padding:      "12px",
  borderRadius: "10px",
  fontWeight:   "bold",
  cursor:       "pointer"
};

export default Performance;