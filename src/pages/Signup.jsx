import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { motion } from "framer-motion";
import "../styles/Signup.css";
import Toast from "../components/Toast";

const backendUrl = import.meta.env.VITE_BACKEND_URL || "http://localhost:5001";

const checkBackendConnectivity = async (setToast) => {
  try {
    console.log(`Checking backend connectivity to: ${backendUrl}`);
    
    const response = await fetch(`${backendUrl}/api/health`, { 
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
      signal: AbortSignal.timeout(5000) 
    });
    
    if (response.ok) {
      console.log('✅ Backend is reachable');
    } else {
      console.warn(`⚠️ Backend returned status: ${response.status}`);
    }
  } catch (error) {
    console.error(`❌ Backend connectivity error: ${error.message}`);
    
    setToast({
      show: true,
      message: "Unable to connect to server. Please check your network connection.",
      type: "error"
    });
  }
};

function Signup({ setIsLoggedIn }) {
  const navigate = useNavigate();
  const [toast, setToast] = useState({ show: false, message: "", type: "error" });
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: ""
  });
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  
  useEffect(() => {
    checkBackendConnectivity(setToast);
  }, []);
  
  // Handle input changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prevData => ({
      ...prevData,
      [name]: value
    }));
  };
  
  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    
    // First validate passwords match
    if (formData.password !== formData.confirmPassword) {
      setToast({
        show: true,
        message: "Passwords do not match",
        type: "error"
      });
      setIsLoading(false);
      return;
    }
    
    try {
      const response = await fetch(`${backendUrl}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          email: formData.email, 
          password: formData.password, 
          name: formData.name 
        })
      });
      
      // Check if response is OK before attempting to parse JSON
      if (!response.ok) {
        // First try to get error as JSON
        let errorData;
        const contentType = response.headers.get('content-type');
        
        if (contentType && contentType.includes('application/json')) {
          errorData = await response.json();
          throw new Error(errorData.error || `Registration failed with status: ${response.status}`);
        } else {
          // If not JSON, get text and throw generic error
          const textError = await response.text();
          console.error('Received non-JSON response:', textError.substring(0, 150) + '...');
          throw new Error(`Registration failed. Server returned status: ${response.status}`);
        }
      }
      
      const data = await response.json();
      
      // Store JWT token
      localStorage.setItem('token', data.token);
      sessionStorage.setItem("app_logged_in", "true");
      sessionStorage.removeItem("app_logged_out");
      
      setIsLoggedIn(true);
      setIsLoading(false);
      navigate("/flashcards");
    } catch (error) {
      console.error("Registration error:", error);
      setToast({
        show: true,
        message: error.message || "Registration failed. Please check your network connection and try again.",
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
    <div className="signup-page-container">
      <motion.div 
        className="signup-content-wrapper"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        <motion.div 
          className="signup-form-container"
          variants={itemVariants}
        >
          <div className="signup-header">
            <h1 className="signup-title">Create Account</h1>
            <p className="signup-subtitle">Join LyricLingo and start your language journey</p>
          </div>
          
          <form onSubmit={handleSubmit} className="signup-form">
            <div className="form-group">
              <label htmlFor="name" className="form-label">Full Name</label>
              <div className="input-container">
                <svg className="input-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M12 11C14.2091 11 16 9.20914 16 7C16 4.79086 14.2091 3 12 3C9.79086 3 8 4.79086 8 7C8 9.20914 9.79086 11 12 11Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M6 21V19C6 17.9391 6.42143 16.9217 7.17157 16.1716C7.92172 15.4214 8.93913 15 10 15H14C15.0609 15 16.0783 15.4214 16.8284 16.1716C17.5786 16.9217 18 17.9391 18 19V21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                <input 
                  type="text" 
                  id="name"
                  name="name"
                  placeholder="Enter your full name" 
                  className="signup-input"
                  value={formData.name}
                  onChange={handleChange}
                  disabled={isLoading}
                  required
                />
              </div>
            </div>
            
            <div className="form-group">
              <label htmlFor="email" className="form-label">Email Address</label>
              <div className="input-container">
                <svg className="input-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M22 6C22 4.9 21.1 4 20 4H4C2.9 4 2 4.9 2 6V18C2 19.1 2.9 20 4 20H20C21.1 20 22 19.1 22 18V6ZM20 6L12 11L4 6H20ZM20 18H4V8L12 13L20 8V18Z" fill="currentColor"/>
                </svg>
                <input 
                  type="email" 
                  id="email"
                  name="email"
                  placeholder="Enter your email" 
                  className="signup-input"
                  value={formData.email}
                  onChange={handleChange}
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
                  name="password"
                  placeholder="Create a password" 
                  className="signup-input"
                  value={formData.password}
                  onChange={handleChange}
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
              <div className="password-requirements">
                Password must be at least 8 characters long
              </div>
            </div>
            
            <div className="form-group">
              <label htmlFor="confirmPassword" className="form-label">Confirm Password</label>
              <div className="input-container">
                <svg className="input-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M12 1C8.676 1 6 3.676 6 7V9H4C2.895 9 2 9.895 2 11V21C2 22.105 2.895 23 4 23H20C21.105 23 22 22.105 22 21V11C22 9.895 21.105 9 20 9H18V7C18 3.676 15.324 1 12 1ZM12 3C14.276 3 16 4.724 16 7V9H8V7C8 4.724 9.724 3 12 3ZM12 15C13.105 15 14 15.895 14 17C14 18.105 13.105 19 12 19C10.895 19 10 18.105 10 17C10 15.895 10.895 15 12 15Z" fill="currentColor"/>
                </svg>
                <input 
                  type={showPassword ? "text" : "password"} 
                  id="confirmPassword"
                  name="confirmPassword"
                  placeholder="Confirm your password" 
                  className="signup-input"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  disabled={isLoading}
                  required
                />
              </div>
              {formData.confirmPassword && formData.password !== formData.confirmPassword && (
                <div className="password-mismatch">
                  Passwords do not match
                </div>
              )}
            </div>
            
            <button 
              type="submit" 
              className={`signup-button ${isLoading ? 'loading' : ''}`}
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <span className="loading-spinner"></span>
                  <span>Creating Account...</span>
                </>
              ) : "Create Account"}
            </button>
          </form>
          
          <div className="signup-footer">
            <p className="login-text">
              Already have an account? <Link to="/login" className="login-link">Sign in</Link>
            </p>
          </div>
        </motion.div>
        
        <motion.div 
          className="signup-info-panel"
          variants={itemVariants}
        >
          <div className="info-panel-content">
            <h2 className="info-panel-title">Learn Languages Through Music</h2>
            <p className="info-panel-description">
              Create your LyricLingo account to:
            </p>
            <ul className="feature-list">
              <li className="feature-item">
                <span className="feature-icon">🎵</span>
                <span>Connect with Spotify and translate songs</span>
              </li>
              <li className="feature-item">
                <span className="feature-icon">📝</span>
                <span>Save your progress and flashcards</span>
              </li>
              <li className="feature-item">
                <span className="feature-icon">🔍</span>
                <span>Track your language learning journey</span>
              </li>
              <li className="feature-item">
                <span className="feature-icon">🌐</span>
                <span>Access your account across devices</span>
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

export default Signup; 