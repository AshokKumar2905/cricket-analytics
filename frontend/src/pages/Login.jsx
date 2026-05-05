import { useState } from "react";
import { useAuth } from "../context/AuthContext"; //
import { useToast } from "../context/ToastContext"; //
import { useNavigate } from "react-router-dom"; //

export default function Login() {
  const { login } = useAuth(); //[cite: 1]
  const { addToast } = useToast(); //[cite: 1]
  const navigate = useNavigate(); //[cite: 1]

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading]   = useState(false);

  const handleLogin = async () => {
    if (!username || !password) { 
      addToast("Enter username and password", "error"); 
      return; 
    }

    setLoading(true);

    try {
      // Logic maintained from your provided source[cite: 1]
      await login(username, password);
      addToast("Welcome back! 🏏");
      navigate("/dashboard"); 

    } catch {
      addToast("Invalid credentials", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={page}>
      <div style={box} className="login-box-shadow">
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <div style={{ fontSize: 56 }}>🏏</div>
          <h1 style={titleStyle}>Cricket Pro</h1>
          <p style={{ color: "#94a3b8", margin: 0, fontSize: "14px" }}>Analytics Dashboard</p>
        </div>

        <div style={fieldWrap}>
          <label style={label}>Username</label>
          <input
            style={input}
            placeholder="admin"
            value={username}
            onChange={e => setUsername(e.target.value)}
            onKeyDown={e => e.key === "Enter" && handleLogin()}
          />
        </div>

        <div style={fieldWrap}>
          <label style={label}>Password</label>
          <input
            style={input}
            type="password"
            placeholder="••••••••"
            value={password}
            onChange={e => setPassword(e.target.value)}
            onKeyDown={e => e.key === "Enter" && handleLogin()}
          />
        </div>

        <button 
          onClick={handleLogin} 
          disabled={loading} 
          style={{ ...btn, opacity: loading ? 0.7 : 1 }}
          className="btn-login-hover"
        >
          {loading ? "Signing in…" : "Sign In →"}
        </button>

        <p style={hintText}>
          Default Access: <span style={{ color: "#38bdf8" }}>admin / cricket123</span>
        </p>
      </div>
    </div>
  );
}

/* ================= STYLES =================[cite: 1] */
const page = {
  minHeight: "100vh", 
  display: "flex", 
  alignItems: "center",
  justifyContent: "center",
  background: "#020617" // Matches global dark theme[cite: 1]
};

const box = {
  background: "#0f172a", // Matches sidebar/header background[cite: 1]
  border: "1px solid #1e293b",
  borderRadius: 20,
  padding: "40px 36px",
  width: 360,
  boxShadow: "0 24px 60px rgba(0,0,0,0.8)"
};

const titleStyle = {
  background: "linear-gradient(90deg, #38bdf8, #22c55e)", // CricViz Accent colors[cite: 1]
  WebkitBackgroundClip: "text",
  color: "transparent",
  fontWeight: 800,
  fontSize: 32,
  margin: "8px 0 4px",
  letterSpacing: "-0.02em"
};

const fieldWrap = { marginBottom: 20 };

const label = {
  color: "#64748b",
  fontSize: 12,
  fontWeight: "600",
  display: "block",
  marginBottom: 8,
  textTransform: "uppercase",
  letterSpacing: "0.05em"
};

const input = {
  width: "100%",
  padding: "12px 14px",
  borderRadius: 10,
  border: "1px solid #1e293b",
  background: "#020617",
  color: "white",
  fontSize: 15,
  boxSizing: "border-box",
  outline: "none",
  transition: "border-color 0.2s"
};

const btn = {
  width: "100%",
  padding: "14px",
  borderRadius: 10,
  background: "linear-gradient(90deg, #22c55e, #38bdf8)",
  color: "white",
  fontWeight: 700,
  fontSize: 16,
  border: "none",
  cursor: "pointer",
  marginTop: 10,
  transition: "transform 0.1s"
};

const hintText = {
  color: "#475569", 
  fontSize: 12, 
  textAlign: "center", 
  marginTop: 24,
  fontFamily: "monospace"
};