import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api";
import { useToast } from "../context/ToastContext";
import { CardSkeleton } from "../components/Skeleton";

const ROLES = ["Batters", "Bowler", "All Rounder", "Wicket Keeper"];

export default function Players() {
  const [players, setPlayers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterRole, setFilterRole] = useState("");

  // States preserved from logic[cite: 1]
  const [name, setName] = useState("");
  const [role, setRole] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [editName, setEditName] = useState("");
  const [editRole, setEditRole] = useState("");
  const [uploading, setUploading] = useState({});

  const navigate = useNavigate();
  const { addToast } = useToast();

  // Logic: Fetching and Actions preserved exactly as provided[cite: 1]
  const fetchPlayers = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.append("search", search);
      if (filterRole) params.append("role", filterRole);
      const res = await api.get(`/players?${params.toString()}`);
      setPlayers(res.data.data || []);
    } catch {
      addToast("Failed to load players", "error");
    } finally {
      setLoading(false);
    }
  }, [search, filterRole, addToast]);

  useEffect(() => { fetchPlayers(); }, [fetchPlayers]);

  const addPlayer = async () => {
    if (!name || !role) { addToast("Enter name and role", "error"); return; }
    try {
      const res = await api.post("/players", { name, role });
      setPlayers((prev) => [...prev, res.data.data]);
      setName(""); setRole("");
      addToast(`${name} registered!`);
    } catch { addToast("Failed to register player", "error"); }
  };

  const deletePlayer = async (id, playerName) => {
    if (!window.confirm(`Permanently remove ${playerName}?`)) return;
    try {
      await api.delete(`/players/${id}`);
      setPlayers((prev) => prev.filter((p) => p.id !== id));
      addToast(`${playerName} removed`);
    } catch { addToast("De-registration failed", "error"); }
  };

  const saveEdit = async (id) => {
    try {
      const res = await api.put(`/players/${id}`, { name: editName, role: editRole });
      setPlayers((prev) => prev.map((p) => (p.id === id ? res.data.data : p)));
      setEditingId(null);
      addToast("Profile updated!");
    } catch { addToast("Update failed", "error"); }
  };

  const handlePhotoUpload = async (playerId, file) => {
    if (!file) return;
    setUploading((prev) => ({ ...prev, [playerId]: true }));
    try {
      const form = new FormData();
      form.append("photo", file);
      const res = await api.post(`/players/${playerId}/photo`, form, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setPlayers((prev) => prev.map((p) => (p.id === playerId ? { ...p, photo: res.data.data.photo } : p)));
      addToast("Photo synced!");
    } catch { addToast("Upload failed", "error"); } finally {
      setUploading((prev) => ({ ...prev, [playerId]: false }));
    }
  };

  return (
    <div className="page-fade-in" style={iccPage}>
      {/* 1. ICC STYLE HEADER[cite: 1] */}
      <div style={iccHeaderSection}>
        <div style={iccHeaderContent}>
          <span style={iccTag}>OFFICIAL ROSTER</span>
          <h1 style={iccTitle}>Player Profiles</h1>
          <p style={iccSubtitle}>Comprehensive intelligence on tournament athletes and field specializations.</p>
        </div>
      </div>

      {/* 2. ADMIN DRAWER (Collapsible-style registration)[cite: 1] */}
      <div style={adminDrawer}>
        <h3 style={drawerTitle}>Athletics Registration</h3>
        <div style={formRow}>
          <input placeholder="PLAYER NAME" value={name} onChange={e => setName(e.target.value)} style={iccInp} />
          <select value={role} onChange={e => setRole(e.target.value)} style={iccInp}>
            <option value="">SELECT ROLE</option>
            {ROLES.map(r => <option key={r}>{r}</option>)}
          </select>
          <button onClick={addPlayer} style={iccActionBtn}>REGISTER +</button>
        </div>
      </div>

      {/* 3. SEARCH & FILTERS[cite: 1] */}
      <div style={filterStrip}>
        <div style={searchWrap}>
          <input placeholder="SEARCH PLAYERS..." value={search} onChange={e => setSearch(e.target.value)} style={iccSearchInp} />
        </div>
        <select value={filterRole} onChange={e => setFilterRole(e.target.value)} style={iccFilterInp}>
          <option value="">ALL POSITIONS</option>
          {ROLES.map(r => <option key={r}>{r}</option>)}
        </select>
      </div>

      {/* 4. PLAYER GRID (ICC Style Cards)[cite: 1] */}
      <div style={iccGrid}>
        {loading ? (
          [1, 2, 3, 4].map(i => <CardSkeleton key={i} />)
        ) : (
          players.map((p) => (
            <div key={p.id} style={iccCard} className="card">
              <div style={imageContainer}>
                {p.photo ? (
                  <img src={`http://127.0.0.1:5000${p.photo}`} alt={p.name} style={iccImage} />
                ) : (
                  <div style={iccFallback}>{p.name?.[0]}</div>
                )}
                <div style={imageOverlay}>
                   <label style={uploadIcon}>
                     {uploading[p.id] ? "..." : "📸"}
                     <input type="file" style={{display: 'none'}} onChange={e => handlePhotoUpload(p.id, e.target.files[0])} />
                   </label>
                </div>
              </div>

              <div style={cardContent}>
                <span style={roleLabel}>{p.role}</span>
                {editingId === p.id ? (
                  <div style={editStack}>
                    <input value={editName} onChange={e => setEditName(e.target.value)} style={miniInp} />
                    <button onClick={() => saveEdit(p.id)} style={miniBtn}>SAVE</button>
                    <button onClick={() => setEditingId(null)} style={miniBtnCancel}>X</button>
                  </div>
                ) : (
                  <h3 style={playerNameText} onClick={() => navigate(`/players/${p.id}`)}>{p.name}</h3>
                )}
                
                <div style={iccBtnGroup}>
                  <button onClick={() => navigate(`/players/${p.id}`)} style={viewBtn}>VIEW PROFILE</button>
                  <button onClick={() => {setEditingId(p.id); setEditName(p.name); setEditRole(p.role)}} style={utilBtn}>EDIT</button>
                  <button onClick={() => deletePlayer(p.id, p.name)} style={utilBtnRed}>REMOVE</button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

/* ================= ICC STYLES[cite: 1] ================= */
const iccPage = { background: "#06083b", minHeight: "100vh", paddingBottom: "100px" };
const iccHeaderSection = { background: "linear-gradient(rgba(0,0,0,0.3), #06083b), url('https://images.unsplash.com/photo-1540747913346-19e32dc3e97e?q=80&w=2000') center/cover", padding: "100px 5% 60px" };
const iccHeaderContent = { maxWidth: "1200px", margin: "0 auto" };
const iccTag = { color: "#e91052", fontWeight: "900", letterSpacing: "2px", fontSize: "12px" };
const iccTitle = { color: "white", fontSize: "48px", fontWeight: "900", margin: "10px 0" };
const iccSubtitle = { color: "#94a3b8", fontSize: "16px", maxWidth: "600px" };

const adminDrawer = { background: "#00195a", padding: "30px 5%", borderBottom: "1px solid rgba(255,255,255,0.1)" };
const drawerTitle = { color: "white", fontSize: "14px", fontWeight: "800", marginBottom: "20px", textTransform: "uppercase" };
const formRow = { display: "flex", gap: "15px" };
const iccInp = { background: "#06083b", border: "1px solid #1e293b", color: "white", padding: "12px", borderRadius: "4px", fontSize: "12px", fontWeight: "700" };
const iccActionBtn = { background: "#e91052", padding: "0 25px" };

const filterStrip = { display: "flex", justifyContent: "space-between", padding: "20px 5%", background: "#00195a", position: "sticky", top: "70px", zIndex: 100 };
const searchWrap = { flex: 1, marginRight: "20px" };
const iccSearchInp = { width: "100%", background: "transparent", border: "none", borderBottom: "2px solid #1e293b", color: "white", fontSize: "18px", fontWeight: "300", outline: "none" };
const iccFilterInp = { background: "#06083b", border: "1px solid #1e293b", color: "white", padding: "10px", borderRadius: "4px" };

const iccGrid = { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "30px", padding: "40px 5%", maxWidth: "1400px", margin: "0 auto" };
const iccCard = { background: "#00195a", borderRadius: "0", border: "none", transition: "0.3s", cursor: "default" };
const imageContainer = { position: "relative", height: "320px", overflow: "hidden", background: "#06083b" };
const iccImage = { width: "100%", height: "100%", objectFit: "cover", transition: "0.5s" };
const iccFallback = { width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "80px", fontWeight: "900", color: "rgba(255,255,255,0.05)" };
const imageOverlay = { position: "absolute", top: "15px", right: "15px" };
const uploadIcon = { background: "rgba(0,0,0,0.5)", padding: "8px", borderRadius: "50%", cursor: "pointer", color: "white" };

const cardContent = { padding: "20px", borderTop: "4px solid #e91052" };
const roleLabel = { color: "#38bdf8", fontSize: "10px", fontWeight: "900", letterSpacing: "1px" };
const playerNameText = { color: "white", fontSize: "20px", fontWeight: "800", margin: "5px 0 20px", cursor: "pointer" };

const iccBtnGroup = { display: "flex", gap: "10px", flexWrap: "wrap" };
const viewBtn = { width: "100%", background: "white", color: "#06083b", fontSize: "11px", fontWeight: "900" };
const utilBtn = { background: "rgba(255,255,255,0.1)", fontSize: "10px", padding: "8px 12px" };
const utilBtnRed = { background: "rgba(233, 16, 82, 0.1)", color: "#e91052", fontSize: "10px", padding: "8px 12px" };

const editStack = { display: "flex", gap: "5px", marginBottom: "15px" };
const miniInp = { background: "#06083b", border: "1px solid #e91052", color: "white", padding: "5px", width: "120px" };
const miniBtn = { padding: "5px 10px", fontSize: "10px" };
const miniBtnCancel = { background: "#1e293b", padding: "5px 10px" };