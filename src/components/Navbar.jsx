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

  const handleLogout = () => {
    localStorage.removeItem("spotify_access_token"); // Remove stored access token
    localStorage.removeItem("spotify_refresh_token"); // Remove refresh token
    setIsAuthenticated(false); // Update state
  
    // ✅ Redirect to home page for a fresh login session
    window.location.href = "/";
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
