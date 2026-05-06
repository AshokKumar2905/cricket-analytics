import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import { useNavigate } from "react-router-dom";

export default function Login() {
  const { login } = useAuth(); // Logic preserved
  const { addToast } = useToast(); // Logic preserved
  const navigate = useNavigate(); // Logic preserved

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!username || !password) { 
      addToast("Enter username and password", "error"); 
      return; 
    }

    setLoading(true);

    try {
      // Logic maintained from provided source
      await login(username, password);
      addToast("Authentication Successful. Welcome back!");
      navigate("/dashboard"); 

    } catch {
      addToast("Invalid credentials provided", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={iccLoginPage}>
      <div style={iccLoginBox} className="page-fade-in login-box-shadow">
        <div style={{ textAlign: "center", marginBottom: 40 }}>
          <div style={iccBrandLogo}>🏏</div>
          <h1 style={iccLoginTitle}>CRIC PRO</h1>
          <p style={iccLoginSubtitle}>Official Intelligence Gateway</p>
        </div>

        <div style={fieldWrap}>
          <label style={iccLabel}>OPERATOR IDENTITY</label>
          <input
            style={iccInput}
            placeholder="Username"
            value={username}
            onChange={e => setUsername(e.target.value)}
            onKeyDown={e => e.key === "Enter" && handleLogin()}
          />
        </div>

        <div style={fieldWrap}>
          <label style={iccLabel}>ACCESS KEY</label>
          <input
            style={iccInput}
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
          style={{ ...iccBtn, opacity: loading ? 0.7 : 1 }}
        >
          {loading ? "AUTHENTICATING..." : "ESTABLISH CONNECTION →"}
        </button>

        <div style={iccLoginFooter}>
          <p style={iccHintText}>
            RESTRICTED ACCESS: SECURE ENVIRONMENT
          </p>
          <p style={{ ...iccHintText, color: "#38bdf8", marginTop: "6px" }}>
            Default: admin / cricket123
          </p>
        </div>
      </div>
    </div>
  );
}

/* ================= ICC LOGIN STYLES ================= */
const iccLoginPage = {
  minHeight: "100vh", 
  display: "flex", 
  alignItems: "center",
  justifyContent: "center",
  background: "#06083b", // ICC Navy
  width: "100%"
};

const iccLoginBox = {
  background: "#00195a", // ICC Secondary Blue
  border: "1px solid rgba(255, 255, 255, 0.1)",
  borderRadius: "4px", // Sharp ICC corners
  padding: "60px 45px",
  width: "100%",
  maxWidth: 420,
  boxShadow: "0 30px 60px rgba(0, 0, 0, 0.6)",
  textAlign: "center"
};

const iccBrandLogo = {
  fontSize: 64,
  marginBottom: 15,
};

const iccLoginTitle = {
  color: "#ffffff",
  fontWeight: 900,
  fontSize: "32px",
  margin: "0 0 5px",
  letterSpacing: "2px"
};

const iccLoginSubtitle = { 
  color: "#94a3b8", 
  margin: 0, 
  fontSize: "12px", 
  fontWeight: "800",
  letterSpacing: "1px",
  textTransform: "uppercase"
};

const fieldWrap = { marginBottom: 25, textAlign: "left" };

const iccLabel = {
  color: "#94a3b8",
  fontSize: "10px",
  fontWeight: "900",
  display: "block",
  marginBottom: 10,
  letterSpacing: "1.5px"
};

const iccInput = {
  width: "100%",
  padding: "16px",
  borderRadius: "4px",
  border: "1px solid #1e293b",
  background: "#06083b",
  color: "#ffffff",
  fontSize: "14px",
  boxSizing: "border-box",
  outline: "none",
  fontWeight: "600"
};

const iccBtn = {
  width: "100%",
  padding: "18px",
  borderRadius: "4px",
  background: "#e91052", // ICC Magenta
  color: "#ffffff",
  fontWeight: "900",
  fontSize: "14px",
  border: "none",
  cursor: "pointer",
  marginTop: 10,
  letterSpacing: "1px",
  transition: "filter 0.2s"
};

const iccLoginFooter = {
  marginTop: 35,
};

const iccHintText = {
  color: "#64748b", 
  fontSize: "10px", 
  margin: 0,
  textTransform: "uppercase",
  fontWeight: "800",
  letterSpacing: "1px"
};