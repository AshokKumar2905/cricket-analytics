import { createContext, useContext, useState, useCallback } from "react";

const ToastContext = createContext(null);

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback((message, type = "success") => {
    const id = Date.now() + Math.random();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 3500);
  }, []);

  const removeToast = useCallback((id) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ addToast }}>
      {children}
      <div style={container}>
        {toasts.map(t => (
          <div
            key={t.id}
            style={{ ...toast, ...(t.type === "error" ? toastError : t.type === "info" ? toastInfo : toastSuccess) }}
            onClick={() => removeToast(t.id)}
          >
            <span style={{ marginRight: 8 }}>
              {t.type === "error" ? "❌" : t.type === "info" ? "ℹ️" : "✅"}
            </span>
            {t.message}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within ToastProvider");
  return ctx;
}

const container = {
  position:      "fixed",
  bottom:        24,
  right:         24,
  display:       "flex",
  flexDirection: "column",
  gap:           10,
  zIndex:        9999,
  pointerEvents: "none"
};

const toast = {
  padding:      "12px 18px",
  borderRadius: 10,
  color:        "white",
  fontWeight:   "500",
  fontSize:     14,
  boxShadow:    "0 8px 24px rgba(0,0,0,0.4)",
  cursor:       "pointer",
  pointerEvents:"all",
  animation:    "slideIn 0.3s ease",
  display:      "flex",
  alignItems:   "center",
  minWidth:     220,
  maxWidth:     340,
};

const toastSuccess = { background: "linear-gradient(135deg,#16a34a,#15803d)" };
const toastError   = { background: "linear-gradient(135deg,#dc2626,#b91c1c)" };
const toastInfo    = { background: "linear-gradient(135deg,#2563eb,#1d4ed8)" };