import React, { useState, useEffect } from "react";
import { BrowserRouter as Router, Routes, Route, useNavigate } from "react-router-dom";
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


  return (
    <>
      <Navbar isLoggedIn={isLoggedIn} />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/flashcards" element={<Flashcards isLoggedIn={isLoggedIn} selectedSong={selectedSong} />} />
        <Route path="/history" element={<History setSelectedSong={setSelectedSong} />} />
      </Routes>
    </>
  );
}

export default App;
