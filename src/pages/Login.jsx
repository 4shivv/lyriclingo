import React from "react";
import "../styles/Login.css";

function Login() {
  return (
    <div className="login-container">
      <h1>Welcome to LyricFlash</h1>
      <p>Log in to access your music and translations.</p>
      <button className="login-button">Log in with Spotify</button>
    </div>
  );
}

export default Login;
