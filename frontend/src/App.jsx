import { BrowserRouter as Router, Routes, Route, NavLink } from "react-router-dom";
import Players from "./pages/Players";
import Matches from "./pages/Matches";
import Performance from "./pages/Performance";
import Dashboard from "./pages/Dashboard";
import Bowling from "./pages/Bowling";
import PlayerDetail from "./pages/PlayerDetail";

function App() {
  return (
    <Router>
      <div style={{ display: "flex", width: "100%" }}>

        {/* SIDEBAR */}
        <div style={sidebar}>
          <h2 style={logo}>🏏 Cricket Pro</h2>

          <nav style={nav}>
            <NavItem to="/dashboard"   label="📊 Dashboard"   />
            <NavItem to="/players"     label="👤 Players"     />
            <NavItem to="/matches"     label="🏟 Matches"     />
            <NavItem to="/performance" label="📈 Performance" />
            <NavItem to="/bowling"     label="🎯 Bowling"     />
          </nav>
        </div>

        {/* MAIN CONTENT */}
        <div style={main}>
          <Routes>
            <Route path="/"            element={<Dashboard />}   />
            <Route path="/dashboard"   element={<Dashboard />}   />
            <Route path="/players"     element={<Players />}     />
            <Route path="/players/:id" element={<PlayerDetail />} />
            <Route path="/matches"     element={<Matches />}     />
            <Route path="/performance" element={<Performance />} />
            <Route path="/bowling"     element={<Bowling />}     />
          </Routes>
        </div>

      </div>
    </Router>
  );
}

/* ================= NAV ITEM ================= */
function NavItem({ to, label }) {
  return (
    <NavLink
      to={to}
      style={({ isActive }) => ({
        color:          isActive ? "#38bdf8" : "#cbd5f5",
        background:     isActive ? "#1e293b" : "transparent",
        padding:        "12px",
        borderRadius:   "8px",
        display:        "block",
        textDecoration: "none",
        fontWeight:     isActive ? "600" : "400",
        transition:     "0.2s"
      })}
    >
      {label}
    </NavLink>
  );
}

/* ================= STYLES ================= */
const sidebar = {
  width:       "230px",
  background:  "linear-gradient(180deg, #020617, #0f172a)",
  padding:     "20px",
  borderRight: "1px solid #1e293b",
  boxShadow:   "4px 0 10px rgba(0,0,0,0.5)"
};

const logo = {
  color:        "white",
  marginBottom: "30px",
  fontWeight:   "bold",
  fontSize:     "20px"
};

const nav = {
  display:       "flex",
  flexDirection: "column",
  gap:           "10px"
};

const main = {
  flex:      1,
  padding:   "30px",
  color:     "white",
  overflowY: "auto"
};

export default App;