import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";

const toastVariants = {
  initial: { opacity: 0, y: 20, scale: 0.95 },
  animate: { opacity: 1, y: 0, scale: 1 },
  exit: { opacity: 0, y: 20, scale: 0.95 }
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
      }, 300); // Match exit animation duration
      
      return () => clearTimeout(timer);
    }
  }, [isVisible, message, onClose]);

  if (!message) return null;

  // Determine styles based on type
  const getTypeStyles = () => {
    switch(type) {
      case "success":
        return {
          background: "rgba(29, 185, 84, 0.85)",
          border: "1px solid rgba(29, 185, 84, 0.5)",
          icon: "✓"
        };
      case "warning":
        return {
          background: "rgba(255, 165, 0, 0.85)",
          border: "1px solid rgba(255, 165, 0, 0.5)",
          icon: "⚠"
        };
      case "info":
        return {
          background: "rgba(64, 95, 255, 0.85)",
          border: "1px solid rgba(64, 95, 255, 0.5)",
          icon: "ℹ"
        };
      case "error":
      default:
        return {
          background: "rgba(231, 76, 60, 0.85)",
          border: "1px solid rgba(231, 76, 60, 0.5)",
          icon: "✕"
        };
    }
  };

  const typeStyles = getTypeStyles();

  return createPortal(
    <AnimatePresence>
      {isVisible && (
        <motion.div
          variants={toastVariants}
          initial="initial"
          animate="animate"
          exit="exit"
          transition={{ duration: 0.3, ease: "easeOut" }}
          style={{
            position: "fixed",
            bottom: "30px",
            right: "30px",
            background: typeStyles.background,
            backdropFilter: "blur(10px)",
            WebkitBackdropFilter: "blur(10px)",
            color: "white",
            padding: "0",
            borderRadius: "12px",
            zIndex: 10000,
            boxShadow: "0 10px 25px rgba(0, 0, 0, 0.3)",
            border: typeStyles.border,
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
            maxWidth: "360px",
            width: "auto"
          }}
        >
          <div style={{
            display: "flex",
            alignItems: "center",
            padding: "12px 16px",
            gap: "12px"
          }}>
            <div style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: "24px",
              height: "24px",
              borderRadius: "50%",
              background: "rgba(255, 255, 255, 0.25)",
              flexShrink: 0
            }}>
              {typeStyles.icon}
            </div>
            
            <span style={{ 
              fontSize: "0.95rem", 
              fontWeight: "500", 
              flexGrow: 1,
              letterSpacing: "0.3px",
              lineHeight: "1.3"
            }}>
              {message}
            </span>
            
            <button
              onClick={() => setIsVisible(false)}
              style={{
                background: "transparent",
                border: "none",
                color: "white",
                fontSize: "1.1rem",
                cursor: "pointer",
                padding: "0 4px",
                lineHeight: "1",
                opacity: "0.8",
                transition: "all 0.2s ease",
                marginLeft: "8px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center"
              }}
              aria-label="Close"
              onMouseOver={(e) => e.currentTarget.style.opacity = "1"}
              onMouseOut={(e) => e.currentTarget.style.opacity = "0.8"}
            >
              ✕
            </button>
          </div>
          
          {/* Optional progress bar animation */}
          <motion.div
            initial={{ width: "100%" }}
            animate={{ width: "0%" }}
            transition={{ duration: duration / 1000, ease: "linear" }}
            style={{
              height: "3px",
              background: "rgba(255, 255, 255, 0.5)",
              alignSelf: "flex-start"
            }}
          />
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  );
}

export default Toast;
