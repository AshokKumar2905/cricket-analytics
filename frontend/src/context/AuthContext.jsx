import { createContext, useContext, useState, useEffect } from "react";
import api from "../api";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser]       = useState(null);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("cricket_token");
    if (!token) { setChecking(false); return; }
    api.defaults.headers.common["Authorization"] = `Bearer ${token}`;
    api.get("/verify-token")
      .then(res => setUser(res.data.data.username))
      .catch(() => { localStorage.removeItem("cricket_token"); })
      .finally(() => setChecking(false));
  }, []);

  const login = async (username, password) => {
    const res = await api.post("/login", { username, password });
    const { token, username: uname } = res.data.data;
    localStorage.setItem("cricket_token", token);
    api.defaults.headers.common["Authorization"] = `Bearer ${token}`;
    setUser(uname);
    return uname;
  };

  const logout = async () => {
    await api.post("/logout").catch(() => {});
    localStorage.removeItem("cricket_token");
    delete api.defaults.headers.common["Authorization"];
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, checking }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}