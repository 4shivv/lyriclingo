import React, { useState, useEffect } from "react";
import { BrowserRouter as Router, Routes, Route, useNavigate, useLocation, Navigate } from "react-router-dom";
import { motion, AnimatePresence } from 'framer-motion';
import Navbar from "./components/Navbar";
import Flashcards from "./pages/Flashcards";
import History from "./pages/History";
import Home from "./pages/Home";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import { isAuthenticated, getUserId, storeSpotifyTokens } from "./utils/auth";
import "./styles/Global.css";

function App() {
  return (
    <Router>
      <AppContent />
    </Router>
  );
}

// Protected route component to enforce authentication
const ProtectedRoute = ({ children }) => {
  const authenticated = isAuthenticated();
  const location = useLocation();
  
  if (!authenticated) {
    // Save the location for redirecting after login
    sessionStorage.setItem('redirectAfterLogin', location.pathname);
    return <Navigate to="/login" replace />;
  }
  
  return children;
};

function AppContent() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [selectedSong, setSelectedSong] = useState(null);
  const navigate = useNavigate();
  const location = useLocation();

  // Check authentication status and handle Spotify callbacks
  useEffect(() => {
    // Check auth status
    const authenticated = isAuthenticated();
    setIsLoggedIn(authenticated);
    
    // Check for Spotify tokens in URL parameters
    const urlParams = new URLSearchParams(window.location.search);
    const accessToken = urlParams.get("access_token");
    const refreshToken = urlParams.get("refresh_token");

    if (accessToken && refreshToken) {
      // Store Spotify tokens with user ID association
      storeSpotifyTokens(accessToken, refreshToken);
      
      // Remove tokens from URL
      window.history.replaceState({}, document.title, "/flashcards");

      // Redirect user to Flashcards page
      navigate("/flashcards", { replace: true });
    }
  }, [navigate]);

  // Update page title based on route
  useEffect(() => {
    const routeTitleMap = {
      "/": "LyricLingo",
      "/flashcards": "Flashcards - LyricLingo",
      "/history": "History - LyricLingo",
      "/login": "Login - LyricLingo",
      "/signup": "Sign Up - LyricLingo",
    };
    document.title = routeTitleMap[location.pathname] || "LyricLingo";
  }, [location]);

  // Animation variants for page transitions
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
          
          {/* Protected routes */}
          <Route path="/flashcards" element={
            <ProtectedRoute>
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
            <ProtectedRoute>
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
          
          {/* Public routes */}
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