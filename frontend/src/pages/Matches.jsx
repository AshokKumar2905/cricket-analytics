import { useEffect, useState, useCallback } from "react";
import api from "../api";
import { useToast } from "../context/ToastContext";
import { CardSkeleton } from "../components/Skeleton";

export default function Matches() {
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Scheduling States
  const [team1, setTeam1] = useState("");
  const [team2, setTeam2] = useState("");
  const [format, setFormat] = useState("T20");
  const [date, setDate] = useState("");
  const [venue, setVenue] = useState("");
  
  // Edit States
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({});

  const { addToast } = useToast();

  // Logic: Fetch matches from API
  const fetchMatches = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get("/matches");
      setMatches(res.data.data || []);
    } catch (err) {
      addToast("Failed to sync match data", "error");
    } finally {
      setLoading(false);
    }
  }, [addToast]);

  useEffect(() => {
    fetchMatches();
  }, [fetchMatches]);

  // Action: Add new match
  const addMatch = async () => {
    if (!team1 || !team2 || !date || !venue) {
      addToast("Please fill all fields, including Venue", "error");
      return;
    }
    try {
      await api.post("/matches", { 
        team1, team2, format, venue, date,
        status: "scheduled" 
      });
      addToast("Match Scheduled ✅");
      fetchMatches();
      setTeam1(""); setTeam2(""); setDate(""); setVenue("");
    } catch (err) {
      addToast("Scheduling failed", "error");
    }
  };

  const startEdit = (m) => {
    setEditingId(m.id);
    setEditForm({ ...m });
  };

  // Action: Update existing match
  const saveEdit = async (id) => {
    try {
      await api.put(`/matches/${id}`, editForm);
      addToast("Match record updated!");
      setEditingId(null);
      fetchMatches();
    } catch (err) {
      addToast("Update failed", "error");
    }
  };

  // Action: Remove match
  const deleteMatch = async (id) => {
    if (!window.confirm("Permanently delete this match fixture?")) return;
    try {
      await api.delete(`/matches/${id}`);
      addToast("Match Removed");
      fetchMatches();
    } catch (err) {
      addToast("Delete failed", "error");
    }
  };

  return (
    <div className="page-fade-in" style={iccPage}>
      {/* 1. SPOTLIGHT HEADER */}
      <div style={iccHeaderSection}>
        <div style={iccHeaderContent}>
          <span style={iccTag}>OFFICIAL FIXTURES</span>
          <h1 style={iccTitle}>Match Center</h1>
          <p style={iccSubtitle}>Real-time scheduling and tournament venue intelligence.</p>
        </div>
      </div>

      {/* 2. ADMIN DRAWER (Scheduling Panel) */}
      <div style={adminDrawer}>
        <h3 style={drawerTitle}>Schedule New Matchup</h3>
        <div style={formRow}>
          <input placeholder="HOME TEAM" value={team1} onChange={e => setTeam1(e.target.value)} style={iccInp} />
          <input placeholder="AWAY TEAM" value={team2} onChange={e => setTeam2(e.target.value)} style={iccInp} />
          <select value={format} onChange={e => setFormat(e.target.value)} style={iccInp}>
            <option>T20</option><option>ODI</option><option>TEST</option>
          </select>
          <input type="date" value={date} onChange={e => setDate(e.target.value)} style={iccInp} />
          <input placeholder="STADIUM VENUE" value={venue} onChange={e => setVenue(e.target.value)} style={iccInp} />
          <button onClick={addMatch} style={iccActionBtn}>SCHEDULE +</button>
        </div>
      </div>

      {/* 3. MATCH GRID */}
      <div style={contentPadding}>
        <div style={matchGrid}>
          {loading ? (
            [1, 2, 3].map(i => <CardSkeleton key={i} />)
          ) : matches.length === 0 ? (
            <div style={emptyState}>No matches currently scheduled in the system.</div>
          ) : (
            matches.map((m) => (
              <div key={m.id} className="card" style={matchCardStyle}>
                {editingId === m.id ? (
                  /* EDIT MODE UI */
                  <div style={editWrapper}>
                    <label style={editLabel}>EDIT DETAILS</label>
                    <input style={iccInp} value={editForm.team1} onChange={e => setEditForm({...editForm, team1: e.target.value})} />
                    <input style={iccInp} value={editForm.team2} onChange={e => setEditForm({...editForm, team2: e.target.value})} />
                    <input style={iccInp} value={editForm.venue} onChange={e => setEditForm({...editForm, venue: e.target.value})} />
                    <select style={iccInp} value={editForm.status} onChange={e => setEditForm({...editForm, status: e.target.value})}>
                      <option value="scheduled">SCHEDULED</option>
                      <option value="live">LIVE</option>
                      <option value="completed">COMPLETED</option>
                    </select>
                    <div style={btnRow}>
                      <button style={btnSave} onClick={() => saveEdit(m.id)}>SAVE</button>
                      <button style={btnCancel} onClick={() => setEditingId(null)}>CANCEL</button>
                    </div>
                  </div>
                ) : (
                  /* VIEW MODE UI */
                  <>
                    <div style={matchHeader}>
                      <span style={formatBadge}>{m.format}</span>
                      <span style={m.status === 'live' ? liveText : statusText}>
                        {m.status === 'live' && <span className="live-indicator-dot"></span>}
                        {m.status.toUpperCase()}
                      </span>
                    </div>
                    <div style={teamsDisplay}>
                      <div style={teamRow}><span>{m.team1}</span><span>{m.team1_runs || 0}</span></div>
                      <div style={teamRow}><span>{m.team2}</span><span>{m.team2_runs || 0}</span></div>
                    </div>
                    <div style={matchFooter}>
                      <div style={metaGroup}>
                        <p style={metaItem}>📍 {m.venue || 'TBD'}</p>
                        <p style={metaItem}>📅 {m.date}</p>
                      </div>
                      <div style={btnRow}>
                        <button style={utilBtn} onClick={() => startEdit(m)}>EDIT</button>
                        <button style={utilBtnRed} onClick={() => deleteMatch(m.id)}>REMOVE</button>
                      </div>
                    </div>
                  </>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

/* ================= STYLES ================= */
const iccPage = { background: "#06083b", minHeight: "100vh" };
const iccHeaderSection = { 
  background: "linear-gradient(rgba(0,0,0,0.6), #06083b), url('https://images.unsplash.com/photo-1540747913346-19e32dc3e97e?q=80&w=2000') center/cover", 
  padding: "100px 5% 60px" 
};
const iccHeaderContent = { maxWidth: "1200px", margin: "0 auto" };
const iccTag = { color: "#e91052", fontWeight: "900", letterSpacing: "2px", fontSize: "12px" };
const iccTitle = { color: "white", fontSize: "48px", fontWeight: "900", margin: "10px 0" };
const iccSubtitle = { color: "#94a3b8", fontSize: "16px" };

const adminDrawer = { background: "#00195a", padding: "30px 5%", borderBottom: "1px solid rgba(255,255,255,0.1)" };
const drawerTitle = { color: "white", fontSize: "12px", fontWeight: "900", marginBottom: "15px", textTransform: "uppercase" };
const formRow = { display: "flex", gap: "10px", flexWrap: "wrap" };
const iccInp = { background: "#06083b", border: "1px solid #1e293b", color: "white", padding: "12px", borderRadius: "4px", fontSize: "12px", fontWeight: "700", outline: "none" };
const iccActionBtn = { background: "#e91052", color: "white", border: "none", padding: "0 25px", fontWeight: "900", borderRadius: "4px", cursor: "pointer" };

const contentPadding = { padding: "40px 5%", maxWidth: "1400px", margin: "0 auto" };
const matchGrid = { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(380px, 1fr))", gap: "30px" };
const matchCardStyle = { background: "#00195a", border: "none", padding: "30px", borderLeft: "6px solid #e91052" };

const matchHeader = { display: "flex", justifyContent: "space-between", marginBottom: "25px", alignItems: "center" };
const formatBadge = { color: "#38bdf8", fontWeight: "900", fontSize: "11px", letterSpacing: "1px" };
const statusText = { color: "#94a3b8", fontSize: "11px", fontWeight: "800" };
const liveText = { color: "#ff0000", fontSize: "11px", fontWeight: "900", display: "flex", alignItems: "center", gap: "6px" };

const teamsDisplay = { display: "flex", flexDirection: "column", gap: "15px", marginBottom: "30px" };
const teamRow = { display: "flex", justifyContent: "space-between", color: "white", fontSize: "20px", fontWeight: "800" };

const matchFooter = { display: "flex", justifyContent: "space-between", alignItems: "flex-end", borderTop: "1px solid rgba(255,255,255,0.05)", paddingTop: "20px" };
const metaGroup = { display: "flex", flexDirection: "column", gap: "4px" };
const metaItem = { color: "#64748b", fontSize: "12px", fontWeight: "600", margin: 0 };
const btnRow = { display: "flex", gap: "8px" };
const utilBtn = { background: "rgba(255,255,255,0.05)", color: "#94a3b8", border: "none", padding: "8px 12px", fontSize: "10px", fontWeight: "900", cursor: "pointer" };
const utilBtnRed = { background: "rgba(233, 16, 82, 0.1)", color: "#e91052", border: "none", padding: "8px 12px", fontSize: "10px", fontWeight: "900", cursor: "pointer" };

const editWrapper = { display: "flex", flexDirection: "column", gap: "12px" };
const editLabel = { fontSize: "10px", color: "#38bdf8", fontWeight: "900" };
const btnSave = { background: "#22c55e", color: "white", border: "none", padding: "10px", fontWeight: "900", borderRadius: "4px", cursor: "pointer" };
const btnCancel = { background: "#1e293b", color: "#94a3b8", border: "none", padding: "10px", fontWeight: "900", borderRadius: "4px", cursor: "pointer" };
const emptyState = { gridColumn: "1 / -1", padding: "100px", textAlign: "center", color: "#64748b", fontSize: "14px", fontWeight: "600", letterSpacing: "1px" };