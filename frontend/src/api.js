import axios from "axios";

const api = axios.create({
  baseURL: "http://127.0.0.1:5000",
  headers: {
    "Content-Type": "application/json"
  },
  timeout: 10000 // ⏱ prevent hanging requests
});

/* =========================
   REQUEST INTERCEPTOR
========================= */
api.interceptors.request.use(
  (config) => {
    // You can add auth token here later
    // config.headers.Authorization = "Bearer token";
    return config;
  },
  (error) => Promise.reject(error)
);

/* =========================
   RESPONSE INTERCEPTOR
========================= */
api.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error("API Error:", error?.response || error.message);

    // Optional: show alert
    if (error.response?.status === 500) {
      alert("Server Error ❌");
    }

    if (error.code === "ECONNABORTED") {
      alert("Request Timeout ⏱");
    }

    return Promise.reject(error);
  }
);

export default api;