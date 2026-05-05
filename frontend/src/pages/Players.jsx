import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api";

function Players() {
  const [search, setSearch] = useState("");
  const [filterRole, setFilterRole] = useState("");
  const [players, setPlayers]   = useState([]);
  const [name, setName]         = useState("");
  const [role, setRole]         = useState("");
  const [editingId, setEditingId] = useState(null);
  const [editName, setEditName] = useState("");
  const [editRole, setEditRole] = useState("");
  const navigate                = useNavigate();

  // =========================
  // LOAD PLAYERS
  // =========================
  const fetchPlayers = async () => {
  try {
    let url = "/players?";
    if (search) url += `search=${search}&`;
    if (filterRole) url += `role=${filterRole}`;

    const res = await api.get(url);
    setPlayers(res.data.data || []);
  } catch (err) {
    console.error("Fetch error:", err);
  }
};

  useEffect(() => {
  fetchPlayers();
}, [search, filterRole]);

  // =========================
  // ADD PLAYER
  // =========================
  const addPlayer = async () => {
    if (!name || !role) { alert("Enter name and role"); return; }
    try {
      const res = await api.post("/players", { name, role });
      setPlayers(prev => [...prev, res.data.data]);
      setName("");
      setRole("");
    } catch (err) {
      console.error("Add error:", err);
    }
  };

  // =========================
  // DELETE PLAYER
  // =========================
  const deletePlayer = async (id) => {
    try {
      await api.delete(`/players/${id}`);
      setPlayers(prev => prev.filter(p => p.id !== id));
    } catch (err) {
      console.error("Delete error:", err);
    }
  };

  // =========================
  // EDIT
  // =========================
  const startEdit = (p) => {
    setEditingId(p.id);
    setEditName(p.name);
    setEditRole(p.role);
  };

  const saveEdit = async (id) => {
    try {
      const res = await api.put(`/players/${id}`, { name: editName, role: editRole });
      setPlayers(prev => prev.map(p => (p.id === id ? res.data.data : p)));
      setEditingId(null);
    } catch (err) {
      console.error("Update error:", err);
    }
  };

  return (
    <div>
      <h1 style={title}>👤 Players</h1>

      {/* ADD FORM */}
      <div style={form}>
        <input
          placeholder="Player Name"
          value={name}
          onChange={e => setName(e.target.value)}
          style={inputStyle}
        />
        <select value={role} onChange={e => setRole(e.target.value)} style={inputStyle}>
          <option value="">Select Role</option>
          <option>Batters</option>
          <option>Bowler</option>
          <option>All Rounder</option>
          <option>Wicket Keeper</option>
        </select>
        <button onClick={addPlayer} style={btnAdd}>+ Add</button>
      </div>

      {/* SEARCH + FILTER */}
<div style={{ display: "flex", gap: "10px", marginBottom: "20px", flexWrap: "wrap" }}>
  <input
    placeholder="🔍 Search player..."
    value={search}
    onChange={(e) => setSearch(e.target.value)}
    style={inputStyle}
  />

  <select
    value={filterRole}
    onChange={(e) => setFilterRole(e.target.value)}
    style={inputStyle}
  >
    <option value="">All Roles</option>
    <option>Batters</option>
    <option>Bowler</option>
    <option>All Rounder</option>
    <option>Wicket Keeper</option>
  </select>
</div>

      {/* PLAYER CARDS */}
      <div style={grid}>
        {players.map((p, index) => (
          <div key={p.id || index} style={card}>
            {editingId === p.id ? (
              <>
                <input
                  value={editName}
                  onChange={e => setEditName(e.target.value)}
                  style={inputStyle}
                />
                <select
                  value={editRole}
                  onChange={e => setEditRole(e.target.value)}
                  style={{ ...inputStyle, marginTop: 8 }}
                >
                  <option>Batters</option>
                  <option>Bowler</option>
                  <option>All Rounder</option>
                  <option>Wicket Keeper</option>
                </select>
                <div style={btnGroup}>
                  <button onClick={() => saveEdit(p.id)} style={btnPrimary}>Save</button>
                  <button onClick={() => setEditingId(null)} style={btnSecondary}>Cancel</button>
                </div>
              </>
            ) : (
              <>
                {/* Clicking name navigates to detail page */}
                <h3
                  style={{ marginBottom: "8px", cursor: "pointer", color: "#38bdf8" }}
                  onClick={() => navigate(`/players/${p.id}`)}
                >
                  {p.name}
                </h3>
                <p style={roleStyle}>{p.role}</p>
                <div style={btnGroup}>
                  <button onClick={() => startEdit(p)} style={btnPrimary}>Edit</button>
                  <button onClick={() => deletePlayer(p.id)} style={btnDanger}>Delete</button>
                  <button onClick={() => navigate(`/players/${p.id}`)} style={btnView}>View Stats</button>
                </div>
              </>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

/* ================= STYLES ================= */
const title = {
  marginBottom:        "20px",
  background:          "linear-gradient(90deg, #38bdf8, #22c55e)",
  WebkitBackgroundClip:"text",
  color:               "transparent",
  fontWeight:          "bold"
};

const form = {
  display:      "flex",
  gap:          "10px",
  marginBottom: "20px",
  flexWrap:     "wrap"
};

const grid = {
  display:             "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
  gap:                 "20px"
};

const card = {
  background:   "linear-gradient(145deg, #1e293b, #020617)",
  padding:      "20px",
  borderRadius: "16px",
  boxShadow:    "0 10px 25px rgba(0,0,0,0.5)"
};

const inputStyle = {
  padding:      "10px",
  borderRadius: "8px",
  border:       "1px solid #334155",
  background:   "#0f172a",
  color:        "white",
  width:        "100%"
};

const roleStyle = {
  color:        "#94a3b8",
  marginBottom: "10px"
};

const btnGroup = {
  display:   "flex",
  gap:       "8px",
  marginTop: "10px",
  flexWrap:  "wrap"
};

const btnAdd = {
  background:   "#22c55e",
  color:        "white",
  border:       "none",
  padding:      "10px 14px",
  borderRadius: "8px",
  cursor:       "pointer"
};

const btnPrimary = {
  background:   "#3b82f6",
  color:        "white",
  border:       "none",
  padding:      "6px 12px",
  borderRadius: "6px",
  cursor:       "pointer"
};

const btnDanger = {
  background:   "#ef4444",
  color:        "white",
  border:       "none",
  padding:      "6px 12px",
  borderRadius: "6px",
  cursor:       "pointer"
};

const btnSecondary = {
  background:   "#64748b",
  color:        "white",
  border:       "none",
  padding:      "6px 12px",
  borderRadius: "6px",
  cursor:       "pointer"
};

const btnView = {
  background:   "#a855f7",
  color:        "white",
  border:       "none",
  padding:      "6px 12px",
  borderRadius: "6px",
  cursor:       "pointer"
};

export default Players;