import React, { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

function Toast({ message, type = "error", onClose, duration = 3000 }) {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, duration);

    return () => clearTimeout(timer); // Cleanup the timer on unmount
  }, [duration, onClose]);

  return (
    <AnimatePresence>
      {message && (
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 50 }}
          style={{
            position: "fixed",
            bottom: "20px",
            right: "20px",
            background: type === "error" ? "#e74c3c" : "#1DB954",
            color: "white",
            padding: "12px 24px",
            borderRadius: "8px",
            zIndex: 1000,
            display: "flex",
            alignItems: "center",
            gap: "8px"
          }}
        >
          <span>{message}</span>
          <button 
            onClick={onClose}
            style={{ 
              background: "none", 
              border: "none", 
              color: "white",
              cursor: "pointer",
              padding: "4px"
            }}
          >
            ✕
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export default Toast; 

/* final */