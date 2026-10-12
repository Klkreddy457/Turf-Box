import { useEffect } from "react";
import "./Toast.css";

function Toast({ message, type = "success", onClose, duration = 3000 }) {
  useEffect(() => {
    if (!message) return;
    const timer = setTimeout(() => {
      if (onClose) onClose();
    }, duration);
    return () => clearTimeout(timer);
  }, [message, duration, onClose]);

  if (!message) return null;

  return (
    <div className={`toast-notification ${type}`}>
      <span className="toast-icon">
        {type === "success" && "✅"}
        {type === "error" && "⚠️"}
        {type === "info" && "ℹ️"}
      </span>
      <span className="toast-text">{message}</span>
      <button className="toast-close-btn" onClick={onClose}>
        ✕
      </button>
    </div>
  );
}

export default Toast;
