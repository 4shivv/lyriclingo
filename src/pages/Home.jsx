import React from "react";
import { motion } from "framer-motion";
import "../styles/Home.css";

function Home() {
  // Read the backend URL from Vite's environment variables, falling back to localhost if not set.
  const backendUrl = import.meta.env.VITE_BACKEND_URL || "http://localhost:5001";

  // Variants for the icons container
  const iconVariants = {
    initial: { opacity: 0, scale: 0.8 },
    animate: { opacity: 1, scale: 1 }
  };

  return (
    <div className="home-container">
      <div className="home-overlay">
        <motion.div 
          className="home-content"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <motion.h1 
            className="home-title"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            Welcome to LyricLingo
          </motion.h1>
          <motion.h2 
            className="home-tagline"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            Discover a new rhythm for language learning
          </motion.h2>
          <motion.p 
            className="home-subtitle"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
          >
            Learn Spanish through your favorite songs
          </motion.p>
          <motion.p 
            className="home-description"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
          >
            Connect your Spotify account to discover, translate, and create flashcards from song lyrics.
          </motion.p>
          {/* Social Links Section */}
          <motion.div
            className="social-links"
            variants={iconVariants}
            initial="initial"
            animate="animate"
            transition={{ delay: 0.7, duration: 0.3 }}
          >
            <a href="https://github.com/yourusername" target="_blank" rel="noopener noreferrer">
              <img src="/github-logo.png" alt="GitHub" className="social-icon" />
            </a>
            <a href="https://linkedin.com/in/yourusername" target="_blank" rel="noopener noreferrer">
              <img src="/linkedin-logo.png" alt="LinkedIn" className="social-icon" />
            </a>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
}

export default Home;
