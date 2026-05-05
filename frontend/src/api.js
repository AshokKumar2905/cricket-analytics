import axios from "axios";

const api = axios.create({
  baseURL: "http://127.0.0.1:5000",
  headers: { "Content-Type": "application/json" },
  timeout: 10000
});

// Interceptor to attach the auth token
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

api.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error("API Error:", error?.response?.data || error.message);
    if (error.response?.status === 401) {
      localStorage.removeItem("cricket_token");
    }
    return Promise.reject(error);
  }
);

// Helper Functions
export const getPlayers = (params) => api.get("/players", { params });
export const uploadPlayerPhoto = (id, formData) => 
  api.post(`/players/${id}/photo`, formData, {
    headers: { "Content-Type": "multipart/form-data" }
  });

export const getMatches = (params) => api.get("/matches", { params });
export const getMatchResult = (id) => api.get(`/match-result/${id}`);
export const getPointsTable = () => api.get("/points-table");
export const getLeaderboard = () => api.get("/leaderboard");
export const getBowlingStats = () => api.get("/bowling-stats");
export const getPlayerStats = () => api.get("/player-stats");

// THIS LINE IS REQUIRED TO FIX THE ERROR
export default api;