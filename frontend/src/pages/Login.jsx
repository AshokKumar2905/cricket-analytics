import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import { useNavigate } from "react-router-dom"; // ✅ ADDED

export default function Login() {
  const { login } = useAuth();
  const { addToast } = useToast();
  const navigate = useNavigate(); // ✅ ADDED

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
      await login(username, password);
      addToast("Welcome back! 🏏");

      navigate("/dashboard"); // ✅ FIX (redirect after login)

    } catch {
      addToast("Invalid credentials", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={page}>
      <div style={box}>
        <div style={{ textAlign:"center", marginBottom:32 }}>
          <div style={{ fontSize:56 }}>🏏</div>
          <h1 style={titleStyle}>Cricket Pro</h1>
          <p style={{ color:"#64748b", margin:0 }}>Analytics Dashboard</p>
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

        <button onClick={handleLogin} disabled={loading} style={btn}>
          {loading ? "Signing in…" : "Sign In →"}
        </button>

        <p style={{ color:"#475569", fontSize:12, textAlign:"center", marginTop:20 }}>
          Default: admin / cricket123
        </p>
      </div>
    </div>
  );
}

const page = {
  minHeight:"100vh", display:"flex", alignItems:"center",
  justifyContent:"center",
  background:"linear-gradient(135deg,#020617 0%,#0f172a 60%,#1e293b 100%)"
};

const box = {
  background:"linear-gradient(145deg,#1e293b,#0f172a)",
  border:"1px solid #334155",
  borderRadius:20,
  padding:"40px 36px",
  width:360,
  boxShadow:"0 24px 60px rgba(0,0,0,0.6)"
};

const titleStyle = {
  background:"linear-gradient(90deg,#38bdf8,#22c55e)",
  WebkitBackgroundClip:"text",
  color:"transparent",
  fontWeight:800,
  fontSize:28,
  margin:"8px 0 4px"
};

const fieldWrap = { marginBottom:18 };

const label = {
  color:"#94a3b8",
  fontSize:13,
  display:"block",
  marginBottom:6
};

const input = {
  width:"100%",
  padding:"11px 14px",
  borderRadius:10,
  border:"1px solid #334155",
  background:"#0f172a",
  color:"white",
  fontSize:15,
  boxSizing:"border-box",
  outline:"none"
};

const btn = {
  width:"100%",
  padding:"13px",
  borderRadius:10,
  background:"linear-gradient(90deg,#22c55e,#38bdf8)",
  color:"white",
  fontWeight:700,
  fontSize:16,
  border:"none",
  cursor:"pointer",
  marginTop:8
};