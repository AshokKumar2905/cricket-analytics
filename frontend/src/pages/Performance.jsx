import { useEffect, useState, useMemo } from "react";
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

  // Logic: Initial Fetch preserved
  useEffect(() => {
    api.get("/players").then(res => setPlayers(res.data.data || []));
    api.get("/matches").then(res => setMatches(res.data.data || []));
  }, []);

  // Logic: Real-time Analytics Preview
  const statsPreview = useMemo(() => {
    const sr = form.balls > 0 ? ((form.runs / form.balls) * 100).toFixed(2) : "0.00";
    const econ = form.balls_bowled > 0 ? ((form.runs_conceded / (form.balls_bowled / 6))).toFixed(2) : "0.00";
    return { sr, econ };
  }, [form]);

  // Logic: Update team options preserved
  const handleMatchChange = (mid) => {
    const match = matches.find(m => m.id === mid);
    set("match_id", mid);
    if (match) {
      setSelectedMatchTeams([match.team1, match.team2]);
      set("team", ""); 
    } else {
      setSelectedMatchTeams([]);
    }
  };

  // Action: Synchronized save preserved
  const add = async () => {
    if (!form.player_id || !form.match_id || !form.team) {
      addToast("Player, Match, and Team are required", "error");
      return;
    }

    try {
      const payload = {
        ...form,
        runs: parseInt(form.runs || 0),
        balls: parseInt(form.balls || 0),
        wickets: parseInt(form.wickets || 0),
        runs_conceded: parseInt(form.runs_conceded || 0),
        balls_bowled: parseInt(form.balls_bowled || 0)
      };

      await api.post("/performance", payload);
      addToast("Performance record committed to database! ✅");
      
      setForm({
        player_id: "", match_id: "", team: "",
        runs: 0, balls: 0, wickets: 0, runs_conceded: 0, balls_bowled: 0
      });
      setSelectedMatchTeams([]);
    } catch (err) {
      addToast("Data synchronization failed ❌", "error");
    }
  };

  const set = (key, val) => setForm(prev => ({ ...prev, [key]: val }));

  return (
    <div className="page-fade-in" style={iccPageContainer}>
      {/* 1. ICC-STYLE INTELLIGENCE HEADER[cite: 1] */}
      <div style={iccHeaderSection}>
        <div style={iccHeaderContent}>
          <span style={iccTag}>OFFICIAL DATA ENTRY</span>
          <h1 style={iccTitle}>Performance Intelligence</h1>
          <p style={iccSubtitle}>Log high-fidelity match data to generate real-time tournament standings and rankings.</p>
        </div>
        <div style={previewPanel}>
            <div style={previewBox}>
                <span style={previewLabel}>LIVE SR PREVIEW</span>
                <span style={previewValue}>{statsPreview.sr}</span>
            </div>
            <div style={previewBox}>
                <span style={previewLabel}>LIVE ECON PREVIEW</span>
                <span style={previewValue}>{statsPreview.econ}</span>
            </div>
        </div>
      </div>

      <div style={contentWrapper}>
        <div className="card" style={iccMainCard}>
            {/* 2. ASSIGNMENT STRIP[cite: 1] */}
            <div style={formSection}>
            <h3 style={sectionLabel}>Athletic Assignment</h3>
            <div style={fieldGrid}>
                <Field label="TARGET ATHLETE">
                <select value={form.player_id} onChange={e => set("player_id", e.target.value)} style={iccInp}>
                    <option value="">-- SELECT PLAYER --</option>
                    {players.map(p => <option key={p.id} value={p.id}>{p.name} ({p.role})</option>)}
                </select>
                </Field>

                <Field label="TOURNAMENT MATCH">
                <select value={form.match_id} onChange={e => handleMatchChange(e.target.value)} style={iccInp}>
                    <option value="">-- SELECT MATCH --</option>
                    {matches.map(m => (
                    <option key={m.id} value={m.id}>{m.team1} vs {m.team2} — {m.date}</option>
                    ))}
                </select>
                </Field>

                <Field label="REPRESENTING SIDE">
                <select value={form.team} onChange={e => set("team", e.target.value)} style={iccInp} disabled={!form.match_id}>
                    <option value="">-- SELECT TEAM --</option>
                    {selectedMatchTeams.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
                </Field>
            </div>
            </div>

            {/* 3. METRICS PANELS[cite: 1] */}
            <div style={metricsSplitGrid}>
                <div style={metricPanel}>
                    <h3 style={sectionLabel}>🏏 Batting Metrics</h3>
                    <div style={verticalStack}>
                        <Field label="RUNS SCORED">
                            <input type="number" value={form.runs} onChange={e => set("runs", e.target.value)} style={iccInp} />
                        </Field>
                        <Field label="BALLS FACED">
                            <input type="number" value={form.balls} onChange={e => set("balls", e.target.value)} style={iccInp} />
                        </Field>
                    </div>
                </div>

                <div style={metricPanel}>
                    <h3 style={sectionLabel}>🎯 Bowling Metrics</h3>
                    <div style={verticalStack}>
                        <Field label="WICKETS TAKEN">
                            <input type="number" value={form.wickets} onChange={e => set("wickets", e.target.value)} style={iccInp} />
                        </Field>
                        <Field label="RUNS CONCEDED">
                            <input type="number" value={form.runs_conceded} onChange={e => set("runs_conceded", e.target.value)} style={iccInp} />
                        </Field>
                        <Field label="BALLS BOWLED">
                            <input type="number" value={form.balls_bowled} onChange={e => set("balls_bowled", e.target.value)} style={iccInp} />
                        </Field>
                    </div>
                </div>
            </div>

            <div style={actionRow}>
                <button onClick={add} style={iccSubmitBtn} className="hover-lift">
                    COMMIT TO TOURNAMENT ENGINE
                </button>
            </div>
        </div>
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

/* ================= ICC STYLES[cite: 1] ================= */
const iccPageContainer = { background: "#06083b", minHeight: "100vh" };

const iccHeaderSection = { 
    background: "linear-gradient(rgba(0,0,0,0.5), #06083b), url('https://images.unsplash.com/photo-1540747913346-19e32dc3e97e?q=80&w=2000') center/cover", 
    padding: "100px 5% 60px",
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-end'
};

const iccHeaderContent = { maxWidth: "700px" };
const iccTag = { color: "#e91052", fontWeight: "900", letterSpacing: "2px", fontSize: "12px" };
const iccTitle = { color: "white", fontSize: "48px", fontWeight: "900", margin: "10px 0" };
const iccSubtitle = { color: "#94a3b8", fontSize: "16px", margin: 0 };

const previewPanel = { display: 'flex', gap: '20px' };
const previewBox = { background: '#00195a', padding: '15px 25px', borderRadius: '4px', borderTop: '4px solid #e91052', textAlign: 'center' };
const previewLabel = { color: '#94a3b8', fontSize: '10px', fontWeight: '800', letterSpacing: '1px', display: 'block', marginBottom: '5px' };
const previewValue = { color: '#38bdf8', fontSize: '24px', fontWeight: '900', fontFamily: 'monospace' };

const contentWrapper = { padding: "40px 5%", maxWidth: "1400px", margin: "0 auto" };
const iccMainCard = { background: "#00195a", padding: "40px", borderRadius: "0", border: "none" };

const formSection = { marginBottom: "40px" };
const sectionLabel = { fontSize: "11px", color: "#38bdf8", textTransform: "uppercase", letterSpacing: "0.2em", marginBottom: "25px", fontWeight: "900" };
const metricsSplitGrid = { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "60px" };
const metricPanel = { background: 'rgba(0,0,0,0.1)', padding: '25px', borderRadius: '4px' };
const verticalStack = { display: "flex", flexDirection: "column", gap: "20px" };
const fieldGrid = { display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "25px" };

const fieldStyle = { display: "flex", flexDirection: "column", gap: "10px" };
const labelStyle = { fontSize: "10px", color: "#64748b", fontWeight: "800", letterSpacing: '0.5px' };
const iccInp = { 
    padding: "14px", 
    borderRadius: "4px", 
    border: "1px solid #1e293b", 
    background: "#06083b", 
    color: "white", 
    outline: "none", 
    fontSize: '13px',
    fontWeight: '600'
};

const actionRow = { marginTop: '40px', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '40px' };
const iccSubmitBtn = { 
    width: "100%", 
    background: "#e91052", 
    color: "white", 
    border: "none", 
    padding: "20px", 
    borderRadius: "4px", 
    fontWeight: "900", 
    fontSize: "14px", 
    letterSpacing: '1px'
};

export default Performance;