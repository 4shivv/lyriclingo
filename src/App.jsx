import React, { useState, useEffect } from "react";
import { BrowserRouter as Router, Routes, Route, useNavigate, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from 'framer-motion';
import Navbar from "./components/Navbar";
import Flashcards from "./pages/Flashcards";
import History from "./pages/History";
import Home from "./pages/Home";
import Login from "./pages/Login";
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
      
      // ✅ Remove tokens from URL
      window.history.replaceState({}, document.title, "/flashcards");

      // ✅ Redirect user to Flashcards page
      navigate("/flashcards", { replace: true });
    } 
    
    // Check app authentication separately using a different storage mechanism
    // This ensures the app auth state is independent of Spotify connection
    const isAppLoggedIn = sessionStorage.getItem("app_logged_in") === "true";
    const isAppLoggedOut = sessionStorage.getItem("app_logged_out") === "true";
    
    if (isAppLoggedIn && !isAppLoggedOut) {
      setIsLoggedIn(true);
    } else {
      setIsLoggedIn(false);
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
          } />
          <Route path="/history" element={
            <motion.div
              variants={pageVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              transition={{ duration: 0.3 }}
            >
              <History setSelectedSong={setSelectedSong} />
            </motion.div>
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
        </Routes>
      </AnimatePresence>
    </>
  );
}

export default App;