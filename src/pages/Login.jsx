import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { motion } from "framer-motion";
import "../styles/Login.css";
import Toast from "../components/Toast";

const backendUrl = import.meta.env.VITE_BACKEND_URL || "http://localhost:5001";

function Login({ setIsLoggedIn }) {
  const navigate = useNavigate();
  const [toast, setToast] = useState({ show: false, message: "", type: "error" });
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  
  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      const response = await fetch(`${backendUrl}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Login failed');
      }
      
      // Store JWT token
      localStorage.setItem('token', data.token);
      sessionStorage.setItem("app_logged_in", "true");
      sessionStorage.removeItem("app_logged_out");
      
      setIsLoggedIn(true);
      setIsLoading(false);
      navigate("/flashcards");
    } catch (error) {
      setToast({
        show: true,
        message: error.message,
        type: "error"
      });
      setIsLoading(false);
    }
  };
  
  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { 
        duration: 0.5,
        staggerChildren: 0.1,
        delayChildren: 0.2
      }
    }
  };
  
  const itemVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { duration: 0.4 }
    }
  };

  return (
    <div className="login-page-container">
      <motion.div 
        className="login-content-wrapper"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        <motion.div 
          className="login-form-container"
          variants={itemVariants}
        >
          <div className="login-header">
            <h1 className="login-title">Welcome Back</h1>
            <p className="login-subtitle">Sign in to continue your language journey</p>
          </div>
          
          <form onSubmit={handleSubmit} className="login-form">
            <div className="form-group">
              <label htmlFor="email" className="form-label">Email Address</label>
              <div className="input-container">
                <svg className="input-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M22 6C22 4.9 21.1 4 20 4H4C2.9 4 2 4.9 2 6V18C2 19.1 2.9 20 4 20H20C21.1 20 22 19.1 22 18V6ZM20 6L12 11L4 6H20ZM20 18H4V8L12 13L20 8V18Z" fill="currentColor"/>
                </svg>
                <input 
                  type="email" 
                  id="email"
                  placeholder="Enter your email" 
                  className="login-input"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={isLoading}
                  required
                />
              </div>
            </div>
            
            <div className="form-group">
              <label htmlFor="password" className="form-label">Password</label>
              <div className="input-container">
                <svg className="input-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M12 1C8.676 1 6 3.676 6 7V9H4C2.895 9 2 9.895 2 11V21C2 22.105 2.895 23 4 23H20C21.105 23 22 22.105 22 21V11C22 9.895 21.105 9 20 9H18V7C18 3.676 15.324 1 12 1ZM12 3C14.276 3 16 4.724 16 7V9H8V7C8 4.724 9.724 3 12 3ZM12 15C13.105 15 14 15.895 14 17C14 18.105 13.105 19 12 19C10.895 19 10 18.105 10 17C10 15.895 10.895 15 12 15Z" fill="currentColor"/>
                </svg>
                <input 
                  type={showPassword ? "text" : "password"} 
                  id="password"
                  placeholder="Enter your password" 
                  className="login-input"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={isLoading}
                  required
                />
                <button 
                  type="button" 
                  className="password-toggle-button"
                  onClick={() => setShowPassword(!showPassword)}
                  tabIndex="-1"
                >
                  {showPassword ? (
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M12 4.5C7 4.5 2.73 7.61 1 12C2.73 16.39 7 19.5 12 19.5C17 19.5 21.27 16.39 23 12C21.27 7.61 17 4.5 12 4.5ZM12 17C9.24 17 7 14.76 7 12C7 9.24 9.24 7 12 7C14.76 7 17 9.24 17 12C17 14.76 14.76 17 12 17ZM12 9C10.34 9 9 10.34 9 12C9 13.66 10.34 15 12 15C13.66 15 15 13.66 15 12C15 10.34 13.66 9 12 9Z" fill="currentColor"/>
                    </svg>
                  ) : (
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M12 6.5C15.79 6.5 19.17 8.63 20.82 12C20.23 13.27 19.4 14.36 18.41 15.2L20.54 17.33C21.86 16.11 22.99 14.56 23.82 12.75C23.94 12.5 23.99 12.25 23.99 12C23.99 11.75 23.94 11.5 23.82 11.25C21.86 6.88 17.16 4 12 4C10.62 4 9.27 4.2 8 4.57L10.17 6.74C10.74 6.59 11.35 6.5 12 6.5ZM2 3.27L4.28 5.55L4.73 6C3.08 7.3 1.78 9.02 1 11.25C0.88 11.5 0.83 11.75 0.83 12C0.83 12.25 0.88 12.5 1 12.75C2.96 17.12 7.66 20 12.83 20C14.45 20 16.02 19.71 17.45 19.18L17.74 19.47L20.73 22.46L22 21.19L3.27 2.46L2 3.27ZM7.53 8.8L9.08 10.35C9.03 10.56 9 10.78 9 11C9 12.66 10.34 14 12 14C12.22 14 12.44 13.97 12.65 13.92L14.2 15.47C13.53 15.8 12.79 16 12 16C9.24 16 7 13.76 7 11C7 10.21 7.2 9.47 7.53 8.8ZM11.84 8.02L14.99 11.17L15.01 11.01C15.01 9.35 13.67 8.01 12.01 8.01L11.84 8.02Z" fill="currentColor"/>
                    </svg>
                  )}
                </button>
              </div>
            </div>

            <div className="forgot-password-row">
              <Link to="/forgot-password" className="forgot-password-link">Forgot password?</Link>
            </div>
            
            <button 
              type="submit" 
              className={`login-button ${isLoading ? 'loading' : ''}`}
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <span className="loading-spinner"></span>
                  <span>Signing in...</span>
                </>
              ) : "Sign In"}
            </button>
          </form>
          
          <div className="login-footer">
            <p className="signup-text">
              Don't have an account? <Link to="/signup" className="signup-link">Create an account</Link>
            </p>
          </div>
        </motion.div>
        
        <motion.div 
          className="login-info-panel"
          variants={itemVariants}
        >
          <div className="info-panel-content">
            <h2 className="info-panel-title">Learn Languages Through Music</h2>
            <p className="info-panel-description">
              LyricLingo helps you master new languages by translating your favorite songs and creating interactive flashcards.
            </p>
            <ul className="feature-list">
              <li className="feature-item">
                <span className="feature-icon">🎵</span>
                <span>Learn from songs you love</span>
              </li>
              <li className="feature-item">
                <span className="feature-icon">📝</span>
                <span>Create custom flashcards</span>
              </li>
              <li className="feature-item">
                <span className="feature-icon">🔍</span>
                <span>Analyze song emotions</span>
              </li>
            </ul>
          </div>
        </motion.div>
      </motion.div>
      
      <Toast 
        message={toast.message} 
        type={toast.type} 
        onClose={() => setToast({ ...toast, show: false })} 
      />
    </div>
  );
}

export default Login;