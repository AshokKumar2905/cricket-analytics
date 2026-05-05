import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api";
import { useToast } from "../context/ToastContext";
import { CardSkeleton } from "../components/Skeleton";

const ROLES = ["Batters", "Bowler", "All Rounder", "Wicket Keeper"];

export default function Players() {
  const [players, setPlayers]     = useState([]);
  const [loading, setLoading]     = useState(true);
  const [search, setSearch]       = useState("");
  const [filterRole, setFilterRole] = useState("");
  
  // Create/Edit States
  const [name, setName]           = useState("");
  const [role, setRole]           = useState("");
  const [editingId, setEditingId] = useState(null);
  const [editName, setEditName]   = useState("");
  const [editRole, setEditRole]   = useState("");
  
  const [uploading, setUploading] = useState({});
  const navigate                  = useNavigate();
  const { addToast }              = useToast();

  // Logic: Fetch players using synchronized query params
  const fetchPlayers = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.append("search", search);
      if (filterRole) params.append("role", filterRole);
      
      const res = await api.get(`/players?${params.toString()}`);
      setPlayers(res.data.data || []); // Accessing the data wrapper from app.py
    } catch { 
      addToast("Failed to load players", "error"); 
    } finally { 
      setLoading(false); 
    }
  }, [search, filterRole, addToast]);

  useEffect(() => { fetchPlayers(); }, [fetchPlayers]);

  // Action: Add Player synchronized with POST /players
  const addPlayer = async () => {
    if (!name || !role) { 
      addToast("Enter name and role", "error"); 
      return; 
    }
    try {
      const res = await api.post("/players", { name, role });
      setPlayers(prev => [...prev, res.data.data]);
      setName(""); setRole("");
      addToast(`${name} added!`);
    } catch { 
      addToast("Failed to add player", "error"); 
    }
  };

  // Action: Delete Player synchronized with DELETE /players/<id>
  const deletePlayer = async (id, playerName) => {
    if (!window.confirm(`Delete ${playerName}?`)) return;
    try {
      await api.delete(`/players/${id}`);
      setPlayers(prev => prev.filter(p => p.id !== id));
      addToast(`${playerName} deleted`);
    } catch { 
      addToast("Failed to delete", "error"); 
    }
  };

  const startEdit = p => { 
    setEditingId(p.id); 
    setEditName(p.name); 
    setEditRole(p.role); 
  };
  
  const cancelEdit = () => setEditingId(null);

  // Action: Update Player synchronized with PUT /players/<id>
  const saveEdit = async id => {
    try {
      const res = await api.put(`/players/${id}`, { name: editName, role: editRole });
      setPlayers(prev => prev.map(p => p.id === id ? res.data.data : p));
      setEditingId(null);
      addToast("Player updated!");
    } catch { 
      addToast("Failed to update", "error"); 
    }
  };

  // Action: Photo Upload synchronized with POST /players/<id>/photo
  const handlePhotoUpload = async (playerId, file) => {
    if (!file) return;
    const allowed = ["image/png", "image/jpeg", "image/jpg", "image/webp", "image/gif"];
    if (!allowed.includes(file.type)) { 
      addToast("Only image files allowed", "error"); 
      return; 
    }
    
    setUploading(prev => ({ ...prev, [playerId]: true }));
    try {
      const form = new FormData();
      form.append("photo", file); // Matches file key in app.py
      const res = await api.post(`/players/${playerId}/photo`, form, {
        headers: { "Content-Type": "multipart/form-data" }
      });
      const photoUrl = res.data.data.photo;
      setPlayers(prev => prev.map(p => p.id === playerId ? { ...p, photo: photoUrl } : p));
      addToast("Photo uploaded!");
    } catch { 
      addToast("Photo upload failed", "error"); 
    } finally { 
      setUploading(prev => ({ ...prev, [playerId]: false })); 
    }
  };

  return (
    <div className="page-fade-in">
      <h1 style={titleStyle}>👤 Player Roster</h1>

      <div className="card" style={adminPanel}>
        <h3 style={sectionHeader}>Register New Player</h3>
        <div style={formRow}>
          <input 
            placeholder="Player Full Name" 
            value={name} 
            onChange={e => setName(e.target.value)}
            style={inp} 
            onKeyDown={e => e.key === "Enter" && addPlayer()} 
          />
          <select value={role} onChange={e => setRole(e.target.value)} style={inp}>
            <option value="">Assign Role</option>
            {ROLES.map(r => <option key={r}>{r}</option>)}
          </select>
          <button onClick={addPlayer} style={btnGreen}>+ Add Player</button>
        </div>
      </div>

      <div style={filterRow}>
        <input 
          placeholder="🔍 Quick search..." 
          value={search} 
          onChange={e => setSearch(e.target.value)} 
          style={{ ...inp, flex: 1 }} 
        />
        <select value={filterRole} onChange={e => setFilterRole(e.target.value)} style={inp}>
          <option value="">All Positions</option>
          {ROLES.map(r => <option key={r}>{r}</option>)}
        </select>
      </div>

      {loading ? (
        <div style={grid}>{[1, 2, 3, 4].map(i => <CardSkeleton key={i} />)}</div>
      ) : players.length === 0 ? (
        <div style={emptyState}>No players match your current filters.</div>
      ) : (
        <div style={grid}>
          {players.map((p, idx) => (
            <div key={p.id || idx} style={card}>
              <div style={photoSection}>
                <div style={avatarWrap}>
                  {p.photo ? (
                    <img 
                      src={`http://127.0.0.1:5000${p.photo}`} // Correct backend prefix
                      alt={p.name}
                      style={avatarImage} 
                    />
                  ) : (
                    <div style={avatarFallback}>{p.name?.[0]?.toUpperCase() || "?"}</div>
                  )}
                </div>
                <label style={uploadLabel}>
                  {uploading[p.id] ? "Saving..." : "📸 Update Photo"}
                  <input type="file" accept="image/*" style={{ display: "none" }}
                    onChange={e => handlePhotoUpload(p.id, e.target.files[0])} />
                </label>
              </div>

              {editingId === p.id ? (
                <div style={editForm}>
                  <input value={editName} onChange={e => setEditName(e.target.value)} style={editInp} />
                  <select value={editRole} onChange={e => setEditRole(e.target.value)} style={editInp}>
                    {ROLES.map(r => <option key={r}>{r}</option>)}
                  </select>
                  <div style={btnRow}>
                    <button onClick={() => saveEdit(p.id)} style={btnBlue}>Save</button>
                    <button onClick={cancelEdit} style={btnGray}>Cancel</button>
                  </div>
                </div>
              ) : (
                <div style={infoSection}>
                  <h3 style={playerName} onClick={() => navigate(`/players/${p.id}`)}>
                    {p.name}
                  </h3>
                  <p style={playerRole}>{p.role}</p>
                  <div style={btnRow}>
                    <button onClick={() => startEdit(p)} style={btnBlue}>Edit</button>
                    <button onClick={() => deletePlayer(p.id, p.name)} style={btnRed}>Delete</button>
                    <button onClick={() => navigate(`/players/${p.id}`)} style={btnPurple}>Stats</button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ================= STYLES ================= */
const titleStyle = { fontSize: "28px", marginBottom: "20px", background: "linear-gradient(90deg,#38bdf8,#22c55e)", WebkitBackgroundClip: "text", color: "transparent", fontWeight: "bold" };
const adminPanel = { marginBottom: "30px", background: "#0f172a", border: "1px solid #1e293b", padding: "20px" };
const sectionHeader = { fontSize: "14px", color: "#64748b", textTransform: "uppercase", marginBottom: "15px", letterSpacing: "0.05em" };
const formRow = { display: "flex", gap: 10, marginBottom: 16, flexWrap: "wrap" };
const filterRow = { display: "flex", gap: 10, marginBottom: 25, flexWrap: "wrap" };
const grid = { display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(260px,1fr))", gap: 20 };
const card = { background: "#0f172a", padding: "24px", borderRadius: 16, border: "1px solid #1e293b", boxShadow: "0 10px 25px rgba(0,0,0,0.4)" };
const inp = { padding: "10px 12px", borderRadius: 8, border: "1px solid #1e293b", background: "#020617", color: "white", minWidth: 160 };
const photoSection = { textAlign: "center", marginBottom: "16px" };
const avatarWrap = { display: "flex", justifyContent: "center", marginBottom: 12 };
const avatarImage = { width: 80, height: 80, borderRadius: "50%", objectFit: "cover", border: "2px solid #38bdf8" };
const avatarFallback = { width: 80, height: 80, borderRadius: "50%", background: "#1e293b", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 32, color: "white", border: "2px solid #334155" };
const uploadLabel = { fontSize: "11px", color: "#38bdf8", cursor: "pointer", fontWeight: "600" };
const infoSection = { textAlign: "center" };
const playerName = { margin: "0 0 4px", color: "#f8fafc", cursor: "pointer", fontSize: "18px" };
const playerRole = { color: "#94a3b8", fontSize: "13px", margin: "0 0 16px", textTransform: "uppercase" };
const editForm = { display: "flex", flexDirection: "column", gap: "8px" };
const editInp = { ...inp, minWidth: "100%" };
const btnRow = { display: "flex", gap: 8, justifyContent: "center", flexWrap: "wrap" };
const emptyState = { padding: "40px", textAlign: "center", color: "#64748b", background: "#0f172a", borderRadius: "12px", border: "1px dashed #1e293b" };
const btnGreen = { background: "#22c55e", color: "white", border: "none", padding: "10px 18px", borderRadius: 8, fontWeight: "bold", cursor: "pointer" };
const btnBlue = { background: "#3b82f6", color: "white", border: "none", padding: "8px 14px", borderRadius: 6, cursor: "pointer" };
const btnRed = { background: "rgba(239, 68, 68, 0.1)", color: "#ef4444", border: "1px solid #ef4444", padding: "8px 14px", borderRadius: 6, cursor: "pointer" };
const btnPurple = { background: "#a855f7", color: "white", border: "none", padding: "8px 14px", borderRadius: 6, cursor: "pointer" };
const btnGray = { background: "#1e293b", color: "#94a3b8", border: "1px solid #334155", padding: "8px 14px", borderRadius: 6, cursor: "pointer" };