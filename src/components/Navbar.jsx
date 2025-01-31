import React from "react";
import { Link } from "react-router-dom";
import "../styles/Navbar.css";

function Navbar() {
    return (
      <nav className="navbar">
        <Link to="/" className="logo">🎵 LyricFlash</Link>
        <div className="menu">
          <Link to="/login">Login</Link>
          <Link to="/flashcards">Flashcards</Link>
          <Link to="/history">History</Link>
        </div>
      </nav>
    );
  }
  
  export default Navbar;