import { useEffect, useState, useCallback } from "react";
import api from "../api";
import { useToast } from "../context/ToastContext";

function Performance() {
  const [players, setPlayers] = useState([]);
  const [matches, setMatches] = useState([]);
  const [selectedMatchTeams, setSelectedMatchTeams] = useState([]);
  const { addToast } = useToast();

  const [form, setForm] = useState({
    player_id:     "",
    match_id:      "",
    team:          "",
    runs:          0,
    balls:         0,
    wickets:       0,
    runs_conceded: 0,
    balls_bowled:  0
  });

  // Logic: Fetch initial data from app.py endpoints
  useEffect(() => {
    api.get("/players").then(res => setPlayers(res.data.data || []));
    api.get("/matches").then(res => setMatches(res.data.data || []));
  }, []);

  // Logic: Update team options when a match is selected
  const handleMatchChange = (mid) => {
    const match = matches.find(m => m.id === mid);
    set("match_id", mid);
    if (match) {
      setSelectedMatchTeams([match.team1, match.team2]);
      set("team", ""); // Reset team if match changes
    } else {
      setSelectedMatchTeams([]);
    }
  };

  // Action: Synchronized save with Backend Integer parsing
  const add = async () => {
    if (!form.player_id || !form.match_id || !form.team) {
      addToast("Player, Match, and Team are required", "error");
      return;
    }

    try {
      // Backend (app.py) expects integers for metrics
      const payload = {
        ...form,
        runs: parseInt(form.runs || 0),
        balls: parseInt(form.balls || 0),
        wickets: parseInt(form.wickets || 0),
        runs_conceded: parseInt(form.runs_conceded || 0),
        balls_bowled: parseInt(form.balls_bowled || 0)
      };

      await api.post("/performance", payload);
      
      addToast("Performance Record Saved ✅");
      
      // Reset form to default values
      setForm({
        player_id: "", match_id: "", team: "",
        runs: 0, balls: 0, wickets: 0, runs_conceded: 0, balls_bowled: 0
      });
      setSelectedMatchTeams([]);
    } catch (err) {
      console.error("Save error:", err);
      addToast("Failed to save record ❌", "error");
    }
  };

  const set = (key, val) => setForm(prev => ({ ...prev, [key]: val }));

  return (
    <div className="page-fade-in">
      <h1 style={title}>📈 Performance Analytics Entry</h1>
      <p style={subtitle}>Log individual contributions to update tournament leaderboards</p>

      <div style={container}>
        <div style={formSection}>
          <h3 style={sectionLabel}>Assignment Details</h3>
          <div style={fieldGrid}>
            <Field label="Target Player">
              <select value={form.player_id} onChange={e => set("player_id", e.target.value)} style={input}>
                <option value="">Select Player</option>
                {players.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            </Field>

            <Field label="Active Match">
              <select value={form.match_id} onChange={e => handleMatchChange(e.target.value)} style={input}>
                <option value="">Select Match</option>
                {matches.map(m => (
                  <option key={m.id} value={m.id}>{m.team1} vs {m.team2} ({m.date})</option>
                ))}
              </select>
            </Field>

            <Field label="Representing Team">
              <select value={form.team} onChange={e => set("team", e.target.value)} style={input} disabled={!form.match_id}>
                <option value="">Select Team</option>
                {selectedMatchTeams.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </Field>
          </div>
        </div>

        <div style={formSection}>
          <h3 style={sectionLabel}>Statistical Metrics</h3>
          <div style={fieldGrid}>
            <Field label="Runs Scored">
              <input type="number" value={form.runs} onChange={e => set("runs", e.target.value)} style={input} />
            </Field>
            <Field label="Balls Faced">
              <input type="number" value={form.balls} onChange={e => set("balls", e.target.value)} style={input} />
            </Field>
            <Field label="Wickets Taken">
              <input type="number" value={form.wickets} onChange={e => set("wickets", e.target.value)} style={input} />
            </Field>
            <Field label="Runs Conceded">
              <input type="number" value={form.runs_conceded} onChange={e => set("runs_conceded", e.target.value)} style={input} />
            </Field>
            <Field label="Balls Bowled">
              <input type="number" value={form.balls_bowled} onChange={e => set("balls_bowled", e.target.value)} style={input} />
            </Field>
          </div>
        </div>

        <button onClick={add} style={btnAdd}>➕ Commit to Database</button>
      </div>
    </div>
  );
}

function Field({ label, children }) {
  return (
    <div style={fieldStyle}>
      <label style={labelStyle}>{label}</label>
      {children}
    </div>
  );
}

/* ================= STYLES ================= */
const title = { margin: "0 0 8px 0", background: "linear-gradient(90deg, #38bdf8, #22c55e)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", fontWeight: "bold", fontSize: "28px" };
const subtitle = { color: "#94a3b8", marginBottom: "30px", fontSize: "14px" };
const container = { background: "#0f172a", padding: "30px", borderRadius: "16px", border: "1px solid #1e293b", boxShadow: "0 10px 25px rgba(0,0,0,0.4)" };
const formSection = { marginBottom: "30px" };
const sectionLabel = { fontSize: "12px", color: "#64748b", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "15px", borderBottom: "1px solid #1e293b", paddingBottom: "8px" };
const fieldGrid = { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "20px" };
const fieldStyle = { display: "flex", flexDirection: "column", gap: "8px" };
const labelStyle = { fontSize: "13px", color: "#94a3b8", fontWeight: "500" };
const input = { padding: "12px", borderRadius: "8px", border: "1px solid #334155", background: "#020617", color: "white", outline: "none" };
const btnAdd = { width: "100%", background: "linear-gradient(90deg, #22c55e, #16a34a)", color: "white", border: "none", padding: "16px", borderRadius: "10px", fontWeight: "bold", fontSize: "16px", cursor: "pointer", transition: "opacity 0.2s" };

export default Performance;