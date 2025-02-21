import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";

const toastVariants = {
  initial: { opacity: 0, y: 40 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: 40 },
};

function Toast({ message, type = "error", onClose, duration = 3000 }) {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    setIsVisible(true);
    if (!message) return;
    const timer = setTimeout(() => {
      setIsVisible(false);
    }, duration);
    return () => clearTimeout(timer);
  }, [message, duration]);

  useEffect(() => {
    if (!isVisible && message) {
      const timer = setTimeout(() => {
        onClose();
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [isVisible, message, onClose]);

  if (!message) return null;

  const backgroundColor = type === "error" ? "#e74c3c" : "#1DB954";

  return createPortal(
    <AnimatePresence>
      {isVisible && (
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
            padding: "12px 16px",
            borderRadius: "8px",
            border: "1px solid rgba(255,255,255,0.2)",
            zIndex: 10000,
            display: "flex",
            alignItems: "center",
            gap: "8px",
            boxShadow: "0 2px 6px rgba(0, 0, 0, 0.25)",
          }}
        >
          <span style={{ fontSize: "0.9rem" }}>{message}</span>
          <button
            onClick={() => setIsVisible(false)}
            style={{
              background: "transparent",
              border: "none",
              color: "white",
              fontSize: "1.2rem",
              cursor: "pointer",
              padding: "0 4px",
              lineHeight: "1",
            }}
            aria-label="Close"
          >
            &#10005;
          </button>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  );
}

export default Toast;
