import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api";
import { useToast } from "../context/ToastContext";
import { CardSkeleton } from "../components/Skeleton";

const ROLES = ["Batters","Bowler","All Rounder","Wicket Keeper"];

export default function Players() {
  const [players, setPlayers]     = useState([]);
  const [loading, setLoading]     = useState(true);
  const [search, setSearch]       = useState("");
  const [filterRole, setFilterRole] = useState("");
  const [name, setName]           = useState("");
  const [role, setRole]           = useState("");
  const [editingId, setEditingId] = useState(null);
  const [editName, setEditName]   = useState("");
  const [editRole, setEditRole]   = useState("");
  const [uploading, setUploading] = useState({});
  const navigate                  = useNavigate();
  const { addToast }              = useToast();

  const fetchPlayers = async () => {
    setLoading(true);
    try {
      let url = "/players?";
      if (search) url += `search=${encodeURIComponent(search)}&`;
      if (filterRole) url += `role=${encodeURIComponent(filterRole)}`;
      const res = await api.get(url);
      setPlayers(res.data.data || []);
    } catch { addToast("Failed to load players", "error"); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchPlayers(); }, [search, filterRole]);

  const addPlayer = async () => {
    if (!name || !role) { addToast("Enter name and role", "error"); return; }
    try {
      const res = await api.post("/players", { name, role });
      setPlayers(prev => [...prev, res.data.data]);
      setName(""); setRole("");
      addToast(`${name} added!`);
    } catch { addToast("Failed to add player", "error"); }
  };

  const deletePlayer = async (id, playerName) => {
    if (!window.confirm(`Delete ${playerName}?`)) return;
    try {
      await api.delete(`/players/${id}`);
      setPlayers(prev => prev.filter(p => p.id !== id));
      addToast(`${playerName} deleted`);
    } catch { addToast("Failed to delete", "error"); }
  };

  const startEdit = p => { setEditingId(p.id); setEditName(p.name); setEditRole(p.role); };
  const cancelEdit = () => setEditingId(null);

  const saveEdit = async id => {
    try {
      const res = await api.put(`/players/${id}`, { name: editName, role: editRole });
      setPlayers(prev => prev.map(p => p.id === id ? res.data.data : p));
      setEditingId(null);
      addToast("Player updated!");
    } catch { addToast("Failed to update", "error"); }
  };

  const handlePhotoUpload = async (playerId, file) => {
    if (!file) return;
    const allowed = ["image/png","image/jpeg","image/jpg","image/webp","image/gif"];
    if (!allowed.includes(file.type)) { addToast("Only image files allowed", "error"); return; }
    setUploading(prev => ({ ...prev, [playerId]: true }));
    try {
      const form = new FormData();
      form.append("photo", file);
      const res = await api.post(`/players/${playerId}/photo`, form, {
        headers: { "Content-Type": "multipart/form-data" }
      });
      const photoUrl = res.data.data.photo;
      setPlayers(prev => prev.map(p => p.id === playerId ? { ...p, photo: photoUrl } : p));
      addToast("Photo uploaded!");
    } catch { addToast("Photo upload failed", "error"); }
    finally { setUploading(prev => ({ ...prev, [playerId]: false })); }
  };

  return (
    <div>
      <h1 style={titleStyle}>👤 Players</h1>

      {/* ADD FORM */}
      <div style={formRow}>
        <input placeholder="Player Name" value={name} onChange={e => setName(e.target.value)}
          style={inp} onKeyDown={e => e.key==="Enter" && addPlayer()} />
        <select value={role} onChange={e => setRole(e.target.value)} style={inp}>
          <option value="">Select Role</option>
          {ROLES.map(r => <option key={r}>{r}</option>)}
        </select>
        <button onClick={addPlayer} style={btnGreen}>+ Add Player</button>
      </div>

      {/* SEARCH + FILTER */}
      <div style={formRow}>
        <input placeholder="🔍 Search by name…" value={search} onChange={e => setSearch(e.target.value)} style={inp} />
        <select value={filterRole} onChange={e => setFilterRole(e.target.value)} style={inp}>
          <option value="">All Roles</option>
          {ROLES.map(r => <option key={r}>{r}</option>)}
        </select>
      </div>

      {/* CARDS */}
      {loading ? (
        <div style={grid}>{[1,2,3].map(i => <CardSkeleton key={i} />)}</div>
      ) : players.length === 0 ? (
        <p style={{ color:"#64748b" }}>No players found.</p>
      ) : (
        <div style={grid}>
          {players.map((p, idx) => (
            <div key={p.id||idx} style={card}>
              {/* PHOTO */}
              <div style={{ textAlign:"center", marginBottom:14 }}>
                <div style={avatarWrap}>
                  {p.photo ? (
                    <img src={`http://127.0.0.1:5000${p.photo}`} alt={p.name}
                      style={{ width:72, height:72, borderRadius:"50%", objectFit:"cover" }} />
                  ) : (
                    <div style={avatarFallback}>{p.name?.[0]?.toUpperCase() || "?"}</div>
                  )}
                </div>
                <label style={uploadLabel}>
                  {uploading[p.id] ? "Uploading…" : "📸 Upload Photo"}
                  <input type="file" accept="image/*" style={{ display:"none" }}
                    onChange={e => handlePhotoUpload(p.id, e.target.files[0])} />
                </label>
              </div>

              {editingId === p.id ? (
                <>
                  <input value={editName} onChange={e => setEditName(e.target.value)} style={{ ...inp, marginBottom:8 }} />
                  <select value={editRole} onChange={e => setEditRole(e.target.value)} style={{ ...inp, marginBottom:12 }}>
                    {ROLES.map(r => <option key={r}>{r}</option>)}
                  </select>
                  <div style={btnRow}>
                    <button onClick={() => saveEdit(p.id)} style={btnBlue}>Save</button>
                    <button onClick={cancelEdit} style={btnGray}>Cancel</button>
                  </div>
                </>
              ) : (
                <>
                  <h3 style={{ margin:"0 0 4px", color:"#38bdf8", cursor:"pointer" }}
                    onClick={() => navigate(`/players/${p.id}`)}>
                    {p.name}
                  </h3>
                  <p style={{ color:"#94a3b8", fontSize:13, margin:"0 0 14px" }}>{p.role}</p>
                  <div style={btnRow}>
                    <button onClick={() => startEdit(p)} style={btnBlue}>Edit</button>
                    <button onClick={() => deletePlayer(p.id, p.name)} style={btnRed}>Delete</button>
                    <button onClick={() => navigate(`/players/${p.id}`)} style={btnPurple}>Stats</button>
                  </div>
                </>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

const titleStyle = {
  marginBottom:"20px", background:"linear-gradient(90deg,#38bdf8,#22c55e)",
  WebkitBackgroundClip:"text", color:"transparent", fontWeight:"bold"
};
const formRow = { display:"flex", gap:10, marginBottom:16, flexWrap:"wrap" };
const grid    = { display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(240px,1fr))", gap:20 };
const card    = { background:"linear-gradient(145deg,#1e293b,#020617)", padding:20, borderRadius:16, boxShadow:"0 10px 25px rgba(0,0,0,0.5)" };
const inp     = { padding:"10px 12px", borderRadius:8, border:"1px solid #334155", background:"#0f172a", color:"white", minWidth:160 };
const btnRow  = { display:"flex", gap:8, flexWrap:"wrap" };
const avatarWrap    = { display:"flex", justifyContent:"center", marginBottom:8 };
const avatarFallback = { width:72, height:72, borderRadius:"50%", background:"linear-gradient(135deg,#334155,#1e293b)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:28, color:"white", fontWeight:"bold" };
const uploadLabel   = { fontSize:11, color:"#64748b", cursor:"pointer", display:"block" };
const btnGreen  = { background:"#22c55e", color:"white", border:"none", padding:"10px 14px", borderRadius:8, cursor:"pointer" };
const btnBlue   = { background:"#3b82f6", color:"white", border:"none", padding:"6px 12px", borderRadius:6, cursor:"pointer" };
const btnRed    = { background:"#ef4444", color:"white", border:"none", padding:"6px 12px", borderRadius:6, cursor:"pointer" };
const btnPurple = { background:"#a855f7", color:"white", border:"none", padding:"6px 12px", borderRadius:6, cursor:"pointer" };
const btnGray   = { background:"#64748b", color:"white", border:"none", padding:"6px 12px", borderRadius:6, cursor:"pointer" };