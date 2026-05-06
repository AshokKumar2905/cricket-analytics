import { BrowserRouter as Router, Routes, Route, NavLink, Link } from "react-router-dom";

// Standardizing imports for all analytic and management pages
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
      <div style={iccShell}>
        
        {/* 1. ICC-STYLE TOP NAVIGATION */}
        <header style={iccHeader}>
          <div style={navContainer}>
            
            {/* LOGO WITH REDIRECT: Clicking logo returns user to the main Dashboard */}
            <Link to="/dashboard" style={{ textDecoration: 'none' }}>
              <div style={logoGroup}>
                <h2 style={iccLogo}>🏏 CRIC PRO</h2>
              </div>
            </Link>
            
            <nav style={topLinks}>
              {/* TopNavItem component handles active states with ICC Magenta highlights */}
              <TopNavItem to="/dashboard" label="DASHBOARD" />
              <TopNavItem to="/matches" label="MATCHES" />
              <TopNavItem to="/players" label="PLAYERS" />
              <TopNavItem to="/performance" label="RANKINGS" />
              <TopNavItem to="/bowling" label="STATS" />
            </nav>

            <div style={rightActions}>
              {/* Premium Search Integration */}
              <div style={searchWrap}>
                <span style={searchIcon}>🔍</span>
                <input 
                  type="text" 
                  placeholder="SEARCH" 
                  style={iccSearchInput} 
                />
              </div>
              
              {/* Account Access Button */}
              <NavLink to="/login" style={signInBtn}>SIGN IN 👤</NavLink>
            </div>
          </div>
        </header>

        {/* 2. FULL WIDTH DYNAMIC BODY: Content expands to fill screen minus header/footer */}
        <main style={iccMain}>
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

        {/* 3. ICC-STYLE FOOTER: Professional corporate layout */}
        <footer style={iccFooter}>
          <div style={footerContent}>
            <p>© 2026 Cricket Pro Analytics. Official Data Provider.</p>
            <div style={footerLinks}>
              <span style={footerLink}>Privacy Policy</span>
              <span style={footerLink}>Terms of Service</span>
            </div>
          </div>
        </footer>

      </div>
    </Router>
  );
}

/* ================= NAVIGATION COMPONENT ================= */
/**
 * TopNavItem: Custom NavLink wrapper for ICC-style underline effects
 */
function TopNavItem({ to, label }) {
  return (
    <NavLink
      to={to}
      style={({ isActive }) => ({
        color: isActive ? "#ffffff" : "#cbd5e1",
        textDecoration: "none",
        fontSize: "13px",
        fontWeight: "700",
        padding: "25px 15px",
        height: "100%",
        display: "flex",
        alignItems: "center",
        // Active indicator uses ICC Brand Magenta
        borderBottom: isActive ? "4px solid #e91052" : "4px solid transparent",
        transition: "all 0.2s ease"
      })}
    >
      {label}
    </NavLink>
  );
}

/* ================= ICC PREMIUM STYLES ================= */

const iccShell = {
  display: "flex",
  flexDirection: "column",
  minHeight: "100vh",
  background: "#06083b" // ICC Deep Navy
};

const iccHeader = {
  background: "#00195a", // ICC Secondary Blue
  height: "70px",
  display: "flex",
  alignItems: "center",
  borderBottom: "1px solid rgba(255,255,255,0.1)",
  position: "sticky",
  top: 0,
  zIndex: 1000,
  boxShadow: "0 4px 20px rgba(0,0,0,0.3)"
};

const navContainer = {
  width: "100%",
  maxWidth: "1400px",
  margin: "0 auto",
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  padding: "0 20px",
  height: "100%"
};

const logoGroup = { 
  display: "flex", 
  alignItems: "center",
  cursor: "pointer"
};

const iccLogo = { 
  color: "white", 
  fontSize: "20px", 
  fontWeight: "900", 
  letterSpacing: "1px",
  margin: 0 
};

const topLinks = { 
  display: "flex", 
  height: "100%", 
  alignItems: "center",
  marginLeft: "40px"
};

const rightActions = { 
  display: "flex", 
  alignItems: "center", 
  gap: "25px" 
};

const searchWrap = {
  position: "relative",
  display: "flex",
  alignItems: "center"
};

const searchIcon = {
  position: "absolute",
  right: "10px",
  color: "white",
  fontSize: "14px",
  pointerEvents: "none"
};

const iccSearchInput = {
  background: "rgba(255,255,255,0.1)",
  border: "none",
  borderRadius: "4px",
  padding: "8px 35px 8px 12px",
  color: "white",
  fontSize: "12px",
  fontWeight: "700",
  outline: "none",
  width: "150px",
  transition: "width 0.3s ease"
};

const signInBtn = { 
  background: "white", 
  color: "#00195a", 
  padding: "8px 20px", 
  borderRadius: "4px", 
  fontSize: "12px", 
  fontWeight: "800",
  textDecoration: "none",
  transition: "opacity 0.2s"
};

const iccMain = { 
  width: "100%", 
  flex: 1,
  background: "#06083b" 
};

const iccFooter = {
  background: "#06083b",
  padding: "60px 20px",
  textAlign: "center",
  color: "#64748b",
  borderTop: "1px solid rgba(255,255,255,0.1)"
};

const footerContent = {
  maxWidth: "1200px",
  margin: "0 auto",
  display: "flex",
  flexDirection: "column",
  gap: "20px"
};

const footerLinks = {
  display: "flex",
  justifyContent: "center",
  gap: "30px",
  fontSize: "12px",
  fontWeight: "600"
};

const footerLink = {
  cursor: "pointer",
  color: "#94a3b8",
  transition: "color 0.2s"
};

export default App;