import axios from "axios";

/**
 * Core API Configuration
 * Base URL synchronized with Flask backend (app.py)
 */
const api = axios.create({
  baseURL: "http://127.0.0.1:5000",
  headers: { "Content-Type": "application/json" },
  timeout: 10000
});

// Interceptor: Automatically attach Bearer token to all outgoing requests
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("cricket_token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Interceptor: Global Error Handling and Token Cleanup on 401
api.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error("System API Error:", error?.response?.data || error.message);
    if (error.response?.status === 401) {
      localStorage.removeItem("cricket_token");
      // Optional: window.location.href = "/login";
    }
    return Promise.reject(error);
  }
);

/* ================= API HELPER FUNCTIONS[cite: 1] ================= */

// --- Athlete Management ---
export const getPlayers = (params) => api.get("/players", { params });
export const addPlayer = (data) => api.post("/players", data);
export const updatePlayer = (id, data) => api.put(`/players/${id}`, data);
export const deletePlayer = (id) => api.delete(`/players/${id}`);
export const uploadPlayerPhoto = (id, formData) => 
  api.post(`/players/${id}/photo`, formData, {
    headers: { "Content-Type": "multipart/form-data" }
  });

// --- Match Operations ---
export const getMatches = (params) => api.get("/matches", { params });
export const addMatch = (data) => api.post("/matches", data);
export const updateMatch = (id, data) => api.put(`/matches/${id}`, data);
export const deleteMatch = (id) => api.delete(`/matches/${id}`);
export const getMatchResult = (id) => api.get(`/match-result/${id}`);

// --- Tournament Analytics ---
export const getPointsTable = () => api.get("/points-table");
export const getLeaderboard = () => api.get("/leaderboard");
export const getBowlingStats = () => api.get("/bowling-stats");
export const getPlayerStats = () => api.get("/player-stats");

// --- Performance Logging ---
export const getPerformances = () => api.get("/performance");
export const addPerformance = (data) => api.post("/performance", data);

// --- System Maintenance ---
export const resetAllData = () => api.delete("/reset-all");

// Required default export to prevent module parse errors[cite: 1]
export default api;