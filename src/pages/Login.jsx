import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/Login.css";
import Toast from "../components/Toast";

function Login({ setIsLoggedIn }) {
  const navigate = useNavigate();
  const [toast, setToast] = useState({ show: false, message: "", type: "error" });
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  
  // Handle form submission with basic validation
  const handleSubmit = (e) => {
    e.preventDefault();
    setIsLoading(true);
    
    // Basic validation
    if (!email || !password) {
      setToast({
        show: true,
        message: "Please enter both email and password",
        type: "error"
      });
      setIsLoading(false);
      return;
    }
    
    // Simulate login success (frontend only for now)
    setTimeout(() => {
      // For now, just simulate successful login
      setIsLoggedIn(true);
      setIsLoading(false);
      navigate("/flashcards");
    }, 1000);
  };
  
  // Handle social login buttons
  const handleSocialLogin = (provider) => {
    setIsLoading(true);
    
    // Handle Spotify differently
    if (provider === "spotify") {
      const backendUrl = import.meta.env.VITE_BACKEND_URL || "http://localhost:5001";
      window.location.href = `${backendUrl}/api/spotify/login`;
      return;
    }
    
    // Simulate other social logins (frontend only)
    setTimeout(() => {
      setIsLoggedIn(true);
      setIsLoading(false);
      navigate("/flashcards");
    }, 1000);
  };

  return (
    <div className="login-container">
      <div className="login-box">
        <h1 className="login-title">Sign in to LyricLingo</h1>

        {/* Social Login Buttons */}
        <button 
          className="social-login spotify-login"
          onClick={() => handleSocialLogin("spotify")}
          disabled={isLoading}
        >
          <img src="/Spotify_Primary_Logo_RGB_Green.png" alt="Spotify Logo" className="social-icon" />
          Continue with Spotify
        </button>
        <button 
          className="social-login google-login"
          onClick={() => handleSocialLogin("google")}
          disabled={isLoading}
        >
          <img src="/Google_Icons-09-512.webp" alt="Google Logo" className="social-icon" />
          Continue with Google
        </button>
        <button 
          className="social-login apple-login"
          onClick={() => handleSocialLogin("apple")}
          disabled={isLoading}
        >
          <img src="/pngegg.png" alt="Apple Logo" className="social-icon" />
         Continue with Apple
        </button>

        {/* Separator */}
        <div className="separator"><span>Or sign in with email</span></div>

        {/* Email & Password Login Form */}
        <form onSubmit={handleSubmit}>
          <input 
            type="email" 
            placeholder="Enter your email address" 
            className="login-input"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={isLoading}
          />
          <input 
            type="password" 
            placeholder="Enter your password" 
            className="login-input"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={isLoading}
          />
          <button 
            type="submit" 
            className="login-submit"
            disabled={isLoading}
          >
            {isLoading ? "Signing in..." : "Sign In"}
          </button>
        </form>

        {/* Additional Options */}
        <p className="login-footer">
          New to LyricLingo? <a href="#">Create an account.</a>
        </p>
        <p className="forgot-password">
          <a href="#">Forgot password?</a>
        </p>
      </div>
      
      <Toast 
        message={toast.message} 
        type={toast.type} 
        onClose={() => setToast({ ...toast, show: false })} 
      />
    </div>
  );
}

export default Login;