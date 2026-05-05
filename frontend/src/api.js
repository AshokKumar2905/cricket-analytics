import axios from "axios";

const api = axios.create({
  baseURL: "http://127.0.0.1:5000",
  headers: { "Content-Type": "application/json" },
  timeout: 10000
});

api.interceptors.request.use(
  config => config,
  error => Promise.reject(error)
);

api.interceptors.response.use(
  response => response,
  error => {
    console.error("API Error:", error?.response || error.message);
    if (error.code === "ECONNABORTED") console.error("Request timeout");
    return Promise.reject(error);
  }
);

export default api;