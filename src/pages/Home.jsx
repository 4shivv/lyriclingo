import React from "react";
import { motion } from "framer-motion";
import "../styles/Home.css";

function Home() {
  const handleLogin = () => {
    window.location.href = "http://localhost:5001/api/spotify/login"; // Redirect to Spotify login
  };

  return (
    <div className="home-container">
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
        <motion.p 
          className="home-subtitle"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
        >
          Learn Spanish through your favorite songs.
        </motion.p>
        <motion.p 
          className="home-description"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
        >
          Connect your Spotify account to discover, translate, and create flashcards from song lyrics.
        </motion.p>
        
        {/* ✅ Connect Button Works Like Navbar Login */}
        <motion.button 
          className="spotify-connect-button"
          onClick={handleLogin}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
        >
          Connect to Spotify
        </motion.button>
      </motion.div>
    </div>
  );
}

export default Home;
