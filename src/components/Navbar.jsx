import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import "../styles/Navbar.css";

function Navbar({ isLoggedIn, setIsLoggedIn }) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  
  // Use Vite's environment variable for the backend URL.
  // Make sure you have VITE_BACKEND_URL defined in your Vercel (or local) environment.
  const backendUrl = import.meta.env.VITE_BACKEND_URL || "http://localhost:5001";
  
  const navigate = useNavigate();

  // Define Framer Motion variants for smoother mobile menu animations
  const menuVariants = {
    hidden: { opacity: 0, y: -20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.3,
        ease: "easeOut",
        staggerChildren: 0.1,
      },
    },
    exit: { opacity: 0, y: -20, transition: { duration: 0.3, ease: "easeIn" } },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: -10 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.3 } },
  };

  const handleLogin = () => {
    window.location.href = `${backendUrl}/api/spotify/login`;
  };

  const handleLogout = () => {
    localStorage.removeItem("spotify_access_token");
    localStorage.removeItem("spotify_refresh_token");
    setIsLoggedIn(false);
    navigate("/");
  };

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  return (
    <nav className="navbar">
      <Link to="/" className="logo-container">
        <img src="/IMG_0862.png" alt="LyricLingo Logo" className="logo-image" />
        <span className="logo-text">LyricLingo</span>
      </Link>

      <button className="mobile-menu-button" onClick={toggleMobileMenu}>
        <span className={`menu-icon ${isMobileMenuOpen ? 'menu-open' : ''}`}></span>
      </button>

      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            className="menu"
            variants={menuVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
          >
            {isLoggedIn ? (
              <motion.button
                className="auth-button logout-button"
                onClick={handleLogout}
                variants={itemVariants}
              >
                Logout
              </motion.button>
            ) : (
              <motion.button
                className="auth-button login-button"
                onClick={handleLogin}
                variants={itemVariants}
              >
                Login with Spotify
              </motion.button>
            )}
            <motion.div variants={itemVariants}>
              <Link to="/flashcards" onClick={() => setIsMobileMenuOpen(false)}>
                Flashcards
              </Link>
            </motion.div>
            <motion.div variants={itemVariants}>
              <Link to="/history" onClick={() => setIsMobileMenuOpen(false)}>
                History
              </Link>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}

export default Navbar;
