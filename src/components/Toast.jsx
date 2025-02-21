import React, { useEffect } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";

const toastVariants = {
  initial: { opacity: 0, y: 50 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: 50 },
};

function Toast({ message, type = "error", onClose, duration = 3000 }) {
  useEffect(() => {
    if (!message) return;
    const timer = setTimeout(() => {
      onClose();
    }, duration);
    return () => clearTimeout(timer);
  }, [message, duration, onClose]);

  if (!message) return null;

  // Use background color based on toast type
  const backgroundColor = type === "error" ? "#e74c3c" : "#1DB954";

  return createPortal(
    <AnimatePresence>
      <motion.div
        variants={toastVariants}
        initial="initial"
        animate="animate"
        exit="exit"
        transition={{ duration: 0.3 }}
        style={{
          position: "fixed",
          bottom: "20px",
          right: "20px",
          background: backgroundColor,
          color: "white",
          padding: "16px 24px",
          borderRadius: "12px",
          zIndex: 10000,
          display: "flex",
          alignItems: "center",
          gap: "12px",
          boxShadow: "0 4px 12px rgba(0, 0, 0, 0.3)",
        }}
      >
        <span style={{ fontSize: "1rem" }}>{message}</span>
        <button
          onClick={onClose}
          style={{
            background: "transparent",
            border: "none",
            color: "white",
            fontSize: "1.2rem",
            cursor: "pointer",
          }}
        >
          &times;
        </button>
      </motion.div>
    </AnimatePresence>,
    document.body
  );
}

export default Toast;
