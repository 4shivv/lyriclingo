import React from "react";
import "../styles/Login.css";

function Login() {
  return (
    <div className="login-container">
      <div className="login-box">
        <h1 className="login-title">Sign in to LyricLingo</h1>

        {/* Social Login Buttons */}
        <button className="social-login spotify-login">
          <img src="/Spotify_Primary_Logo_RGB_Green.png" alt="Spotify Logo" className="social-icon" />
          Continue with Spotify
        </button>
        <button className="social-login google-login">
          <img src="/Google_Icons-09-512.webp" alt="Google Logo" className="social-icon" />
          Continue with Google
        </button>
        <button className="social-login apple-login">
          <img src="/pngegg.png" alt="Apple Logo" className="social-icon" />
         Continue with Apple
        </button>

        {/* Separator */}
        <div className="separator"><span>Or sign in with email</span></div>

        {/* Email & Password Login Form */}
        <form>
          <input type="email" placeholder="Enter your email address" className="login-input" />
          <input type="password" placeholder="Enter your password" className="login-input" />
          <button type="submit" className="login-submit">Sign In</button>
        </form>

        {/* Additional Options */}
        <p className="login-footer">
          New to LyricLingo? <a href="#">Create an account.</a>
        </p>
        <p className="forgot-password">
          <a href="#">Forgot password?</a>
        </p>
      </div>
    </div>
  );
}

export default Login;
