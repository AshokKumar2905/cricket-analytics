import { BrowserRouter as Router, Routes, Route, NavLink } from "react-router-dom";

import Players from "./pages/Players";
import Matches from "./pages/Matches";
import Performance from "./pages/Performance";
import Dashboard from "./pages/Dashboard";
import Bowling from "./pages/Bowling";
import PlayerDetail from "./pages/PlayerDetail";
import Login from "./pages/Login";

function App() {
  return (
    <Router>
      <div style={appShell}>
        
        {/* 1. HEADER */}
        <header style={headerStyle}>
          <div style={logoSection}>
            <h2 style={logoText}>🏏 Cricket Pro</h2>
          </div>
          <div style={searchSection}>
            <input type="text" placeholder="Search analytics..." style={searchInput} />
          </div>
          <div style={headerActions}>
            <div style={iconBadge}>🛒 <span style={badgeStyle}>0</span></div>
            <div style={userIcon}>👤</div>
          </div>
        </header>

        <div style={contentWrapper}>
          {/* 2. SIDEBAR */}
          <aside style={sidebar}>
            <nav style={nav}>
              <NavItem to="/dashboard"   label="📊 Dashboard" />
              <NavItem to="/players"     label="👤 Players" />
              <NavItem to="/matches"     label="🏟 Matches" />
              <NavItem to="/performance" label="📈 Performance" />
              <NavItem to="/bowling"     label="🎯 Bowling" />
              <NavItem to="/login"       label="🔐 Login" />
            </nav>
          </aside>

          {/* 3. MAIN CONTENT */}
          <main style={main}>
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/players" element={<Players />} />
              <Route path="/players/:id" element={<PlayerDetail />} />
              <Route path="/matches" element={<Matches />} />
              <Route path="/performance" element={<Performance />} />
              <Route path="/bowling" element={<Bowling />} />
              <Route path="/login" element={<Login />} />
            </Routes>
          </main>
        </div>

        {/* 4. FOOTER */}
        <footer style={footerStyle}>
          <p>© 2026 Cricket Pro Analytics. All Rights Reserved.</p>
        </footer >

      </div>
    </Router>
  );
}

/* ================= COMPONENTS ================= */
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

// Layout Shell
const appShell = {
  display: "flex",
  flexDirection: "column",
  height: "100vh",
  width: "100%",
  background: "#020617",
  overflow: "hidden"
};

const contentWrapper = {
  display: "flex",
  flex: 1, // Takes up space between Header and Footer
  overflow: "hidden"
};

// Header Styles
const headerStyle = {
  height: "70px",
  background: "#0f172a",
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  padding: "0 30px",
  borderBottom: "1px solid #1e293b",
  zIndex: 10
};

const logoSection = { width: "230px" };
const logoText = { color: "white", margin: 0, fontSize: "20px" };

const searchSection = { flex: 1, display: "flex", justifyContent: "center" };
const searchInput = {
  width: "60%",
  padding: "8px 15px",
  borderRadius: "20px",
  border: "1px solid #334155",
  background: "#1e293b",
  color: "white",
  outline: "none"
};

const headerActions = { display: "flex", gap: "20px", color: "white", fontSize: "1.2rem", alignItems: "center" };
const iconBadge = { position: "relative", cursor: "pointer" };
const badgeStyle = {
  position: "absolute",
  top: "-5px",
  right: "-10px",
  background: "#ef4444",
  fontSize: "10px",
  padding: "2px 6px",
  borderRadius: "50%"
};
const userIcon = { cursor: "pointer" };

// Sidebar & Main
const sidebar = {
  width: "230px",
  background: "#0f172a",
  padding: "20px",
  borderRight: "1px solid #1e293b",
};

const nav = {
  display: "flex",
  flexDirection: "column",
  gap: "10px"
};

const main = {
  flex: 1,
  padding: "30px",
  color: "white",
  overflowY: "auto", // Allows only the content area to scroll
  background: "#020617"
};

// Footer Styles
const footerStyle = {
  height: "50px",
  background: "#0f172a",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  color: "#64748b",
  fontSize: "13px",
  borderTop: "1px solid #1e293b"
};

export default App;