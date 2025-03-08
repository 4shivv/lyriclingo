import React, { useState, useEffect } from "react";
import { BrowserRouter as Router, Routes, Route, useNavigate, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from 'framer-motion';
import Navbar from "./components/Navbar";
import Flashcards from "./pages/Flashcards";
import History from "./pages/History";
import Home from "./pages/Home";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import "./styles/Global.css";

function App() {
  return (
    <Router>
      <AppContent />
    </Router>
  );
}

function AppContent() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [selectedSong, setSelectedSong] = useState(null);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    // Check for Spotify tokens in URL parameters
    const urlParams = new URLSearchParams(window.location.search);
    const accessToken = urlParams.get("access_token");
    const refreshToken = urlParams.get("refresh_token");

    if (accessToken && refreshToken) {
      // Store Spotify tokens but DON'T change app login state
      localStorage.setItem("spotify_access_token", accessToken);
      localStorage.setItem("spotify_refresh_token", refreshToken);
      
      // Remove tokens from URL
      window.history.replaceState({}, document.title, "/flashcards");

      // Redirect user to Flashcards page
      navigate("/flashcards", { replace: true });
    } 
    
    // Check app authentication using JWT token presence
    const token = localStorage.getItem("token") || sessionStorage.getItem("auth_token");
    const isAppLoggedOut = sessionStorage.getItem("app_logged_out") === "true";
    
    if (token && !isAppLoggedOut) {
      // Store token in both locations for consistency
      localStorage.setItem("token", token);
      sessionStorage.setItem("auth_token", token);
      
      setIsLoggedIn(true);
      sessionStorage.setItem("app_logged_in", "true");
      sessionStorage.removeItem("app_logged_out");
    } else {
      setIsLoggedIn(false);
      sessionStorage.removeItem("app_logged_in");
    }
  }, [navigate]);

  useEffect(() => {
    const routeTitleMap = {
      "/": "LyricLingo",
      "/flashcards": "Flashcards - LyricLingo",
      "/history": "History - LyricLingo",
    };
    document.title = routeTitleMap[location.pathname] || "LyricLingo";
  }, [location]);

  // Add protected route component to restrict access to authenticated routes
  function ProtectedRoute({ isLoggedIn, children }) {
    const navigate = useNavigate();
    
    useEffect(() => {
      // Check both flags and token existence
      const token = localStorage.getItem("token") || sessionStorage.getItem("auth_token");
      const isLoggedOut = sessionStorage.getItem("app_logged_out") === "true";
      
      if (!token || isLoggedOut) {
        navigate("/login");
      }
    }, [navigate]);
    
    return isLoggedIn ? children : null;
  }

  const pageVariants = {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -20 }
  };

  return (
    <>
      <Navbar isLoggedIn={isLoggedIn} setIsLoggedIn={setIsLoggedIn} />
      <AnimatePresence mode="wait">
        <Routes location={location} key={location.pathname}>
          <Route path="/" element={
            <motion.div
              variants={pageVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              transition={{ duration: 0.3 }}
            >
              <Home />
            </motion.div>
          } />
          <Route path="/flashcards" element={
            <ProtectedRoute isLoggedIn={isLoggedIn}>
              <motion.div
                variants={pageVariants}
                initial="initial"
                animate="animate"
                exit="exit"
                transition={{ duration: 0.3 }}
              >
                <Flashcards 
                  isLoggedIn={isLoggedIn} 
                  setIsLoggedIn={setIsLoggedIn} 
                  selectedSong={selectedSong} 
                  setSelectedSong={setSelectedSong} 
                />
              </motion.div>
            </ProtectedRoute>
          } />
          <Route path="/history" element={
            <ProtectedRoute isLoggedIn={isLoggedIn}>
              <motion.div
                variants={pageVariants}
                initial="initial"
                animate="animate"
                exit="exit"
                transition={{ duration: 0.3 }}
              >
                <History setSelectedSong={setSelectedSong} />
              </motion.div>
            </ProtectedRoute>
          } />
          <Route path="/login" element={
            <motion.div
              variants={pageVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              transition={{ duration: 0.3 }}
            >
              <Login setIsLoggedIn={setIsLoggedIn} />
            </motion.div>
          } />
          <Route path="/signup" element={
            <motion.div
              variants={pageVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              transition={{ duration: 0.3 }}
            >
              <Signup setIsLoggedIn={setIsLoggedIn} />
            </motion.div>
          } />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password/:token" element={<ResetPassword />} />
        </Routes>
      </AnimatePresence>
    </>
  );
}

export default App;