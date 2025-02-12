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

  const handleLogin = () => {
    window.location.href = `${backendUrl}/api/spotify/login`;
  };

  const handleLogout = async () => {
    try {
      await fetch(`${backendUrl}/api/songs/clear`, { method: "DELETE" });
    } catch (error) {
      console.error("Error clearing history on logout:", error);
    }
    localStorage.removeItem("spotify_access_token");
    localStorage.removeItem("spotify_refresh_token");
    setIsLoggedIn(false);
    navigate("/");
  };

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  // New helper to delay navigation on mobile (letting the exit animation run)
  const handleMobileNavClick = (path, e) => {
    e.preventDefault();
    setIsMobileMenuOpen(false);
    setTimeout(() => {
      navigate(path);
    }, 250);
  };

  return (
    <nav className="navbar">
      <Link to="/" className="logo-container" onClick={() => setIsMobileMenuOpen(false)}>
        <img src="/IMG_0862.png" alt="LyricLingo Logo" className="logo-image" />
        <span className="logo-text">LyricLingo</span>
      </Link>

      {/* Desktop Menu: Always visible on larger screens */}
      <div className="desktop-menu">
        {isLoggedIn ? (
          <button className="auth-button logout-button" onClick={handleLogout}>
            Logout
          </button>
        ) : (
          <button className="auth-button login-button" onClick={handleLogin}>
            Login with Spotify
          </button>
        )}
        <Link to="/flashcards">Flashcards</Link>
        <Link to="/history">History</Link>
      </div>

      {/* Mobile Menu toggler */}
      <button className="mobile-menu-button" onClick={toggleMobileMenu}>
        <span className={`menu-icon ${isMobileMenuOpen ? 'menu-open' : ''}`}></span>
      </button>

      {/* Mobile Menu for small screens */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div 
            className={`menu ${isMobileMenuOpen ? 'menu-open' : ''}`}
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              position: "absolute",
              top: "100%",
              left: 0,
              width: "100%",
              backgroundColor: "rgba(0, 0, 0, 0.8)",
              padding: "10px 0"
            }}
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            {isLoggedIn ? (
              <motion.button 
                className="auth-button logout-button"
                onClick={() => {
                  setIsMobileMenuOpen(false);
                  handleLogout();
                }}
                style={{ "--item-index": 0 }}
              >
                Logout
              </motion.button>
            ) : (
              <motion.button 
                className="auth-button login-button"
                onClick={(e) => {
                  setIsMobileMenuOpen(false);
                  handleLogin();
                }}
                style={{ "--item-index": 0 }}
              >
                Login with Spotify
              </motion.button>
            )}
            <Link to="/flashcards" style={{ "--item-index": 1 }} onClick={(e) => handleMobileNavClick("/flashcards", e)}>
              Flashcards
            </Link>
            <Link to="/history" style={{ "--item-index": 2 }} onClick={(e) => handleMobileNavClick("/history", e)}>
              History
            </Link>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}

export default Navbar;
