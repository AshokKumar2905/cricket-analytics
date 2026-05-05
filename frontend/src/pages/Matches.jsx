import { useEffect, useState, useCallback } from "react";
import api from "../api";
import { useToast } from "../context/ToastContext"; // Recommended for feedback

function Matches() {
  const [matches, setMatches] = useState([]);
  const [team1, setTeam1] = useState("");
  const [team2, setTeam2] = useState("");
  const [format, setFormat] = useState("T20");
  const [date, setDate] = useState("");
  const [venue, setVenue] = useState("");
  const { addToast } = useToast();

  // Logic: Fetch matches from MongoDB via Flask
  const fetchMatches = useCallback(async () => {
    try {
      const res = await api.get("/matches");
      setMatches(res.data.data || []);
    } catch (err) {
      console.error("Fetch error:", err);
    }
  }, []);

  useEffect(() => {
    fetchMatches();
  }, [fetchMatches]);

  // Action: Add new match record
  const addMatch = async () => {
    if (!team1 || !team2 || !date) {
      addToast("Please fill in teams and date", "error");
      return;
    }
    try {
      // Schema matches add_match() in app.py
      await api.post("/matches", { 
        team1, 
        team2, 
        format, 
        venue, 
        date,
        status: "scheduled" 
      });
      
      addToast("Match scheduled successfully ✅");
      fetchMatches();
      setTeam1(""); setTeam2(""); setDate(""); setVenue("");
    } catch (err) {
      addToast("Failed to schedule match", "error");
    }
  };

  // Action: Remove match record
  const deleteMatch = async (id) => {
    if (!window.confirm("Are you sure you want to delete this match?")) return;
    try {
      await api.delete(`/matches/${id}`);
      addToast("Match deleted");
      fetchMatches();
    } catch (err) {
      addToast("Delete failed", "error");
    }
  };

  return (
    <div className="page-fade-in">
      <h1 className="glow-text">🏟 Match Scheduling</h1>
      
      {/* SCHEDULING FORM */}
      <div className="card" style={formContainer}>
        <div style={inputGroup}>
          <input style={inputStyle} placeholder="Team 1" value={team1} onChange={e => setTeam1(e.target.value)} />
          <input style={inputStyle} placeholder="Team 2" value={team2} onChange={e => setTeam2(e.target.value)} />
          <select style={inputStyle} value={format} onChange={e => setFormat(e.target.value)}>
            <option>T20</option>
            <option>ODI</option>
            <option>Test</option>
          </select>
          <input style={inputStyle} type="date" value={date} onChange={e => setDate(e.target.value)} />
          <input style={inputStyle} placeholder="Venue" value={venue} onChange={e => setVenue(e.target.value)} />
          <button style={btnAction} onClick={addMatch}>+ Schedule</button>
        </div>
      </div>

      {/* MATCH DISPLAY GRID */}
      <div style={matchGrid}>
        {matches.map(m => (
          <div key={m.id} className="card match-card-premium" style={matchCard}>
            <div style={cardHeader}>
              <h3 style={{ margin: 0 }}>{m.team1} <span style={{ color: '#64748b' }}>vs</span> {m.team2}</h3>
              <span className="live-badge" style={{ 
                background: m.status === 'live' ? '#ef4444' : '#1e293b',
                boxShadow: m.status === 'live' ? '0 0 10px rgba(239, 68, 68, 0.5)' : 'none'
              }}>
                {(m.status || 'scheduled').toUpperCase()}
              </span>
            </div>
            
            <div style={cardBody}>
              <p style={metaText}>📅 {m.date || 'TBD'}</p>
              <p style={metaText}>📍 {m.venue || 'No Venue Set'}</p>
              <p style={{ color: '#38bdf8', fontSize: '14px', fontWeight: 'bold' }}>{m.format}</p>
            </div>

            <button style={btnDelete} onClick={() => deleteMatch(m.id)}>Delete</button>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ================= STYLES ================= */
const formContainer = { marginBottom: '30px', background: '#0f172a', border: '1px solid #1e293b' };
const inputGroup = { display: 'flex', gap: '12px', flexWrap: 'wrap' };
const inputStyle = { flex: 1, minWidth: '150px', background: '#020617', border: '1px solid #1e293b', color: 'white', padding: '10px', borderRadius: '8px' };
const btnAction = { background: 'linear-gradient(90deg, #22c55e, #38bdf8)', padding: '10px 20px', border: 'none', borderRadius: '8px', color: 'white', fontWeight: 'bold', cursor: 'pointer' };

const matchGrid = { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px' };
const matchCard = { background: '#0f172a', border: '1px solid #1e293b', padding: '20px', borderRadius: '16px', position: 'relative' };
const cardHeader = { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' };
const cardBody = { marginBottom: '15px' };
const metaText = { margin: '5px 0', fontSize: '13px', color: '#94a3b8' };

const btnDelete = { background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', border: '1px solid #ef4444', padding: '6px 12px', borderRadius: '6px', cursor: 'pointer', fontSize: '12px', width: '100%' };

export default Matches;