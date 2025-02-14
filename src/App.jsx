import React, { useState, useEffect } from "react";
import { BrowserRouter as Router, Routes, Route, useNavigate, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from 'framer-motion';
import Navbar from "./components/Navbar";
import Flashcards from "./pages/Flashcards";
import History from "./pages/History";
import Home from "./pages/Home";
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
    const urlParams = new URLSearchParams(window.location.search);
    const accessToken = urlParams.get("access_token");
    const refreshToken = urlParams.get("refresh_token");

    if (accessToken && refreshToken) {
      localStorage.setItem("spotify_access_token", accessToken);
      localStorage.setItem("spotify_refresh_token", refreshToken);
      setIsLoggedIn(true);

      // ✅ Remove tokens from URL
      window.history.replaceState({}, document.title, "/flashcards");

      // ✅ Redirect user to Flashcards page
      navigate("/flashcards", { replace: true });
    } else {
      const storedToken = localStorage.getItem("spotify_access_token");
      if (storedToken) {
        setIsLoggedIn(true);
      }
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
              <Flashcards isLoggedIn={isLoggedIn} selectedSong={selectedSong} setSelectedSong={setSelectedSong} />
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
        </Routes>
      </AnimatePresence>
    </>
  );
}

export default App;
