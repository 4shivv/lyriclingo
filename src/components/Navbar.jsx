import React, { useState, useEffect } from "react";
import { NavLink, Link, useNavigate, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import "../styles/Navbar.css";

function Navbar({ isLoggedIn, setIsLoggedIn, setSpotifyConnected }) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  
  const backendUrl = import.meta.env.VITE_BACKEND_URL || "http://localhost:5001";

  // Handle body scroll lock when mobile menu is open
  useEffect(() => {
    if (isMobileMenuOpen) {
      document.body.style.overflow = 'hidden';
      // Add class to body when menu is open
      document.body.classList.add('mobile-menu-open');
    } else {
      document.body.style.overflow = 'unset';
      // Remove class when menu is closed
      document.body.classList.remove('mobile-menu-open');
    }
    
    return () => {
      document.body.style.overflow = 'unset';
      document.body.classList.remove('mobile-menu-open');
    };
  }, [isMobileMenuOpen]);

  // Navigate to login page instead of direct auth
  const handleLogin = () => {
    navigate("/login");
  };

  // Simple frontend logout - just UI state change
  const handleLogout = () => {
    // Clear all auth tokens - both app and Spotify
    localStorage.removeItem("token");
    sessionStorage.removeItem("auth_token");
    
    // Clear Spotify tokens as well
    localStorage.removeItem("spotify_access_token");
    localStorage.removeItem("spotify_refresh_token");
    
    // Update application state
    setIsLoggedIn(false);
    setSpotifyConnected(false);
    
    // Set logged out flag
    sessionStorage.setItem("app_logged_out", "true");
    sessionStorage.removeItem("app_logged_in");
    
    navigate("/");
  };

  const toggleMobileMenu = () => {
    // Toggle menu state
    setIsMobileMenuOpen(prev => !prev);
    
    // Toggle body class for additional styling hooks
    if (!isMobileMenuOpen) {
      document.body.classList.add('mobile-menu-open');
    } else {
      document.body.classList.remove('mobile-menu-open');
    }
  };

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false);
  };

  // Framer Motion variants
  const menuVariants = {
    closed: {
      opacity: 0,
      y: -10,
      transition: {
        staggerChildren: 0.03,
        staggerDirection: -1,
        when: "afterChildren",
        ease: "easeInOut",
        duration: 0.2
      }
    },
    open: {
      opacity: 1,
      y: 0,
      transition: {
        staggerChildren: 0.05,
        staggerDirection: 1,
        delayChildren: 0.05,
        when: "beforeChildren",
        ease: "easeOut",
        duration: 0.2
      }
    }
  };

  const itemVariants = {
    closed: { opacity: 0, y: -10 },
    open: { 
      opacity: 1, 
      y: 0,
      transition: { duration: 0.2, ease: "easeOut" }
    }
  };

  return (
    <nav className="navbar">
      <Link to="/" className="logo-container" onClick={closeMobileMenu}>
        <img src="/Subject.png" alt="LyricLingo Logo" className="logo-image" />
        <span className="logo-text"></span>
      </Link>

      {/* Desktop Menu - Updated with generic login button (no Spotify branding) */}
      <div className="desktop-menu">
        {isLoggedIn ? (
          <button className="auth-button logout-button" onClick={handleLogout}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M9 21H5C4.46957 21 3.96086 20.7893 3.58579 20.4142C3.21071 20.0391 3 19.5304 3 19V5C3 4.46957 3.21071 3.96086 3.58579 3.58579C3.96086 3.21071 4.46957 3 5 3H9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M16 17L21 12L16 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M21 12H9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            Logout
          </button>
        ) : (
          <button className="auth-button login-button" onClick={handleLogin}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M15 3H19C19.5304 3 20.0391 3.21071 20.4142 3.58579C20.7893 3.96086 21 4.46957 21 5V19C21 19.5304 20.7893 20.0391 20.4142 20.4142C20.0391 20.7893 19.5304 21 19 21H15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M10 17L15 12L10 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M15 12H3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            Login
          </button>
        )}
        <NavLink to="/flashcards" className={({ isActive }) => (isActive ? "active" : "")}>
          Flashcards
        </NavLink>
        <NavLink to="/history" className={({ isActive }) => (isActive ? "active" : "")}>
          History
        </NavLink>
      </div>

      {/* Mobile Menu Button */}
      <button 
        className={`mobile-menu-button ${isMobileMenuOpen ? "active" : ""}`} 
        onClick={toggleMobileMenu} 
        aria-label="Toggle menu"
        aria-expanded={isMobileMenuOpen}
      >
        <div className="hamburger-icon">
          <span className="hamburger-line"></span>
          <span className="hamburger-line"></span>
          <span className="hamburger-line"></span>
        </div>
      </button>

      {/* Mobile Menu Overlay */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div 
            className="mobile-menu-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
          >
            <motion.div 
              className="mobile-menu-container"
              variants={menuVariants}
              initial="closed"
              animate="open"
              exit="closed"
            >
              <motion.div 
                className="mobile-menu-header"
                variants={itemVariants}
              >
                <Link to="/" onClick={closeMobileMenu} className="mobile-logo-link">
                  <img src="/Subject.png" alt="LyricLingo Logo" className="mobile-logo" />
                </Link>
              </motion.div>

              <div className="mobile-menu-content">
                <motion.div 
                  className="mobile-menu-links"
                  variants={itemVariants}
                >
                  <NavLink 
                    to="/flashcards" 
                    className={({ isActive }) => isActive ? "mobile-link active" : "mobile-link"}
                    onClick={closeMobileMenu}
                  >
                    <motion.div 
                      className="mobile-link-container"
                      whileTap={{ scale: 0.95 }}
                    >
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M4 6C4 5.46957 4.21071 4.96086 4.58579 4.58579C4.96086 4.21071 5.46957 4 6 4H18C18.5304 4 19.0391 4.21071 19.4142 4.58579C19.7893 4.96086 20 5.46957 20 6V18C20 18.5304 19.7893 19.0391 19.4142 19.4142C19.0391 19.7893 18.5304 20 18 20H6C5.46957 20 4.96086 19.7893 4.58579 19.4142C4.21071 19.0391 4 18.5304 4 18V6Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        <path d="M12 4V20" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                      <span>Flashcards</span>
                    </motion.div>
                  </NavLink>
                  
                  <NavLink 
                    to="/history" 
                    className={({ isActive }) => isActive ? "mobile-link active" : "mobile-link"}
                    onClick={closeMobileMenu}
                  >
                    <motion.div 
                      className="mobile-link-container"
                      whileTap={{ scale: 0.95 }}
                    >
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M12 8V12L15 15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        <path d="M3.05078 11.0002C3.27871 8.18023 4.51526 5.54779 6.51878 3.63615C8.5223 1.72451 11.1679 0.672931 13.9978 0.669922H14.0008C19.5238 0.669922 24.0008 5.14692 24.0008 10.6699V10.6729C23.9985 12.4649 23.5513 14.2289 22.6954 15.8097C21.8394 17.3906 20.6013 18.7394 19.0998 19.7299L12.0008 24.6699" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        <path d="M12 24.6699L4.90078 19.7299C3.39818 18.7407 2.15913 17.3925 1.30237 15.8117C0.445606 14.2309 -0.00228993 12.4666 0.000781407 10.6739V10.6699C0.000781407 9.10392 0.350781 7.61392 0.950781 6.25592" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                      <span>History</span>
                    </motion.div>
                  </NavLink>
                  
                  {!isLoggedIn && (
                    <NavLink 
                      to="/signup" 
                      className={({ isActive }) => isActive ? "mobile-link active" : "mobile-link"}
                      onClick={closeMobileMenu}
                    >
                      <motion.div 
                        className="mobile-link-container"
                        whileTap={{ scale: 0.95 }}
                      >
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path d="M16 21V19C16 17.9391 15.5786 16.9217 14.8284 16.1716C14.0783 15.4214 13.0609 15 12 15H5C3.93913 15 2.92172 15.4214 2.17157 16.1716C1.42143 16.9217 1 17.9391 1 19V21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                          <path d="M8.5 11C10.7091 11 12.5 9.20914 12.5 7C12.5 4.79086 10.7091 3 8.5 3C6.29086 3 4.5 4.79086 4.5 7C4.5 9.20914 6.29086 11 8.5 11Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                          <path d="M20 8V14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                          <path d="M23 11H17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                        <span>Sign Up</span>
                      </motion.div>
                    </NavLink>
                  )}
                </motion.div>

                {/* Updated mobile menu auth buttons (no Spotify branding) */}
                <motion.div 
                  className="mobile-menu-auth"
                  variants={itemVariants}
                >
                  {isLoggedIn ? (
                    <motion.button 
                      className="mobile-auth-button logout"
                      onClick={() => {
                        handleLogout();
                        closeMobileMenu();
                      }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M9 21H5C4.46957 21 3.96086 20.7893 3.58579 20.4142C3.21071 20.0391 3 19.5304 3 19V5C3 4.46957 3.21071 3.96086 3.58579 3.58579C3.96086 3.21071 4.46957 3 5 3H9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        <path d="M16 17L21 12L16 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        <path d="M21 12H9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                      <span>Logout</span>
                    </motion.button>
                  ) : (
                    <motion.button 
                      className="mobile-auth-button login"
                      onClick={() => {
                        handleLogin();
                        closeMobileMenu();
                      }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M15 3H19C19.5304 3 20.0391 3.21071 20.4142 3.58579C20.7893 3.96086 21 4.46957 21 5V19C21 19.5304 20.7893 20.0391 20.4142 20.4142C20.0391 20.7893 19.5304 21 19 21H15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        <path d="M10 17L15 12L10 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        <path d="M15 12H3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                      <span>Login</span>
                    </motion.button>
                  )}
                </motion.div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}

export default Navbar;