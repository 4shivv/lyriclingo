import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import "../styles/Navbar.css";

function Navbar() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const accessToken = localStorage.getItem("spotify_access_token");
    setIsAuthenticated(!!accessToken); // Check if token exists
  }, []);

  const handleLogin = () => {
    window.location.href = "http://localhost:5001/api/spotify/login"; // Redirects to Spotify's login page
  };   

  const handleLogout = async () => {
    try {
      // ✅ Call the backend to clear history
      await fetch("http://localhost:5001/api/songs/logout", { method: "POST" });
  
      console.log("✅ Cleared history on logout");
  
      // ✅ Remove stored authentication tokens
      localStorage.removeItem("spotify_access_token");
      localStorage.removeItem("spotify_refresh_token");
  
      // ✅ Redirect to home page
      window.location.href = "/";
    } catch (error) {
      console.error("❌ Error during logout:", error);
    }
  }; 

  return (
    <nav className="navbar">
      <Link to="/" className="logo-container">
        <img src="/IMG_0862.png" alt="LyricLingo Logo" className="logo-image" />
        <span className="logo-text">LyricLingo</span>
      </Link>
      <div className="menu">
        {isAuthenticated ? (
          <button className="auth-button logout-button" onClick={handleLogout}>
            Logout
          </button>
        ) : (
          <button className="auth-button login-button" onClick={() => window.location.href = "http://localhost:5001/api/spotify/login"}>
  Login with Spotify
          </button>
        )}
        <Link to="/flashcards">Flashcards</Link>
        <Link to="/history">History</Link>
      </div>
    </nav>
  );
}

export default Navbar;
