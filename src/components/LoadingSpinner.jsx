import React from "react";
import { motion } from "framer-motion";

function LoadingSpinner() {
  return (
    <motion.div
      style={{
        width: "40px",
        height: "40px",
        border: "4px solid #1DB954",
        borderTop: "4px solid transparent",
        borderRadius: "50%",
        margin: "20px auto"
      }}
      animate={{ rotate: 360 }}
      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
    />
  );
}

export default LoadingSpinner; 