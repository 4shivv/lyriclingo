import React, { useState, useEffect, useCallback } from "react";
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
import { isAuthenticated, getUserId, storeSpotifyTokens, clearSongStates } from "./utils/auth";
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
  const [currentUserId, setCurrentUserId] = useState(null);
  const navigate = useNavigate();
  const location = useLocation();

  // Reset application state (safe to call multiple times)
  const resetAppState = useCallback(() => {
    console.log("Resetting application state");
    setSelectedSong(null);
    clearSongStates();
  }, []);

  // Function to handle logout (includes state reset)
  const handleLogout = useCallback(() => {
    setIsLoggedIn(false);
    setCurrentUserId(null);
    resetAppState();
  }, [resetAppState]);

  // Listen for auth events dispatched from auth.js
  useEffect(() => {
    const handleLogin = (event) => {
      console.log("User login detected, resetting state");
      resetAppState();
      setIsLoggedIn(true);
      setCurrentUserId(getUserId());
    };

    const handleLogout = () => {
      console.log("User logout detected, clearing state");
      handleLogout();
    };

    // Add event listeners
    window.addEventListener('user:login', handleLogin);
    window.addEventListener('user:logout', handleLogout);

    // Cleanup
    return () => {
      window.removeEventListener('user:login', handleLogin);
      window.removeEventListener('user:logout', handleLogout);
    };
  }, [handleLogout, resetAppState]);

  // Check authentication status and handle Spotify callbacks
  useEffect(() => {
    // Check auth status
    const authenticated = isAuthenticated();
    const userId = getUserId();
    
    // If auth status changed
    if (authenticated !== isLoggedIn) {
      setIsLoggedIn(authenticated);
      
      // If logged in, set current user ID
      if (authenticated) {
        setCurrentUserId(userId);
      } else {
        setCurrentUserId(null);
        resetAppState();
      }
    }
    
    // If user ID changed (different user logged in)
    if (authenticated && userId !== currentUserId && currentUserId !== null) {
      console.log("User account changed, resetting state");
      resetAppState();
      setCurrentUserId(userId);
    }
    
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
  }, [navigate, isLoggedIn, currentUserId, resetAppState]);

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
      <Navbar 
        isLoggedIn={isLoggedIn} 
        setIsLoggedIn={setIsLoggedIn} 
        onLogout={handleLogout} 
      />
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
                  currentUserId={currentUserId}
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
                <History 
                  setSelectedSong={setSelectedSong} 
                  currentUserId={currentUserId}
                />
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