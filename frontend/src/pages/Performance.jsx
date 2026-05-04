import { useEffect, useState } from "react";
import api from "../api";

function Performance() {
  const [players, setPlayers] = useState([]);
  const [matches, setMatches] = useState([]);

  const [form, setForm] = useState({
    player_id: "",
    match_id: "",
    team: "",
    runs: "",
    balls: "",
    wickets: "",
    runs_conceded: "",
    balls_bowled: ""
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
        player_id: "",
        match_id: "",
        team: "",
        runs: "",
        balls: "",
        wickets: "",
        runs_conceded: "",
        balls_bowled: ""
      });
    });
  };

  return (
    <div>
      {/* HEADER */}
      <h1 style={title}>📈 Performance Entry</h1>

      {/* FORM */}
      <div style={container}>

        {/* PLAYER */}
        <Field label="Player">
          <select
            value={form.player_id}
            onChange={e => setForm({ ...form, player_id: e.target.value })}
            style={input}
          >
            <option value="">Select Player</option>
            {players.map((p, i) => (
              <option key={p.id || i} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </Field>

        {/* MATCH */}
        <Field label="Match">
          <select
            value={form.match_id}
            onChange={e => setForm({ ...form, match_id: e.target.value })}
            style={input}
          >
            <option value="">Select Match</option>
            {matches.map((m, i) => (
              <option key={m.id || i} value={m.id}>
                {m.team1} vs {m.team2}
              </option>
            ))}
          </select>
        </Field>

        {/* TEAM */}
        <Field label="Team">
          <input
            placeholder="Team"
            value={form.team}
            onChange={e => setForm({ ...form, team: e.target.value })}
            style={input}
          />
        </Field>

        {/* RUNS */}
        <Field label="Runs">
          <input
            placeholder="Runs"
            value={form.runs}
            onChange={e => setForm({ ...form, runs: e.target.value })}
            style={input}
          />
        </Field>

        {/* BALLS */}
        <Field label="Balls">
          <input
            placeholder="Balls"
            value={form.balls}
            onChange={e => setForm({ ...form, balls: e.target.value })}
            style={input}
          />
        </Field>

        {/* WICKETS */}
        <Field label="Wickets">
          <input
            placeholder="Wickets"
            value={form.wickets}
            onChange={e => setForm({ ...form, wickets: e.target.value })}
            style={input}
          />
        </Field>

        {/* RUNS CONCEDED */}
        <Field label="Runs Conceded">
          <input
            placeholder="Runs Conceded"
            value={form.runs_conceded}
            onChange={e => setForm({ ...form, runs_conceded: e.target.value })}
            style={input}
          />
        </Field>

        {/* BALLS BOWLED */}
        <Field label="Balls Bowled">
          <input
            placeholder="Balls Bowled"
            value={form.balls_bowled}
            onChange={e => setForm({ ...form, balls_bowled: e.target.value })}
            style={input}
          />
        </Field>

        {/* BUTTON */}
        <button onClick={add} style={btnAdd}>
          ➕ Add Performance
        </button>

      </div>
    </div>
  );
}

/* ================= REUSABLE FIELD ================= */

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
  marginBottom: "20px",
  background: "linear-gradient(90deg, #38bdf8, #22c55e)",
  WebkitBackgroundClip: "text",
  color: "transparent",
  fontWeight: "bold"
};

const container = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
  gap: "20px",
  background: "linear-gradient(145deg, #1e293b, #020617)",
  padding: "20px",
  borderRadius: "16px",
  boxShadow: "0 10px 25px rgba(0,0,0,0.6)"
};

const field = {
  display: "flex",
  flexDirection: "column",
  gap: "6px"
};

const labelStyle = {
  fontSize: "14px",
  color: "#94a3b8"
};

const input = {
  padding: "10px",
  borderRadius: "8px",
  border: "1px solid #334155",
  background: "#0f172a",
  color: "white"
};

const btnAdd = {
  gridColumn: "span 2",
  background: "#22c55e",
  color: "white",
  border: "none",
  padding: "12px",
  borderRadius: "10px",
  fontWeight: "bold",
  cursor: "pointer"
};

export default Performance;