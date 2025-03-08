import React, { useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import "../styles/ForgotPassword.css";
import Toast from "../components/Toast";

function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const [toast, setToast] = useState({ show: false, message: "", type: "error" });

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      const response = await fetch(`${process.env.REACT_APP_API_URL}/api/auth/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to send reset email');
      }
      
      setEmailSent(true);
    } catch (error) {
      setToast({
        show: true,
        message: error.message,
        type: "error"
      });
    } finally {
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
    <div className="forgot-password-page-container">
      <motion.div 
        className="forgot-password-content-wrapper"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        <motion.div 
          className="forgot-password-form-container"
          variants={itemVariants}
        >
          <div className="forgot-password-header">
            <h1 className="forgot-password-title">Reset Password</h1>
            <p className="forgot-password-subtitle">
              {emailSent 
                ? "Check your email for a link to reset your password" 
                : "Enter your email and we'll send you a link to reset your password"
              }
            </p>
          </div>
          
          {!emailSent ? (
            <form onSubmit={handleSubmit} className="forgot-password-form">
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
                    className="forgot-password-input"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={isLoading}
                    required
                  />
                </div>
              </div>
              
              <button 
                type="submit" 
                className={`forgot-password-button ${isLoading ? 'loading' : ''}`}
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <span className="loading-spinner"></span>
                    <span>Sending Link...</span>
                  </>
                ) : "Send Reset Link"}
              </button>
            </form>
          ) : (
            <div className="email-sent-container">
              <div className="email-sent-icon">
                <svg width="60" height="60" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M12 2C6.48 2 2 6.48 2 12C2 17.52 6.48 22 12 22C17.52 22 22 17.52 22 12C22 6.48 17.52 2 12 2ZM10 17L5 12L6.41 10.59L10 14.17L17.59 6.58L19 8L10 17Z" fill="rgba(252, 220, 77, 0.9)"/>
                </svg>
              </div>
              <p className="email-sent-message">
                If an account exists with this email, you'll receive a password reset link shortly.
              </p>
              <p className="email-sent-instruction">
                Be sure to check your spam folder if you don't see it in your inbox.
              </p>
            </div>
          )}
          
          <div className="forgot-password-footer">
            <span className="login-text">Remember your password?</span>
            <Link to="/login" className="login-link">Log in</Link>
          </div>
        </motion.div>
      </motion.div>
      
      {toast.show && (
        <Toast 
          message={toast.message} 
          type={toast.type} 
          onClose={() => setToast({ ...toast, show: false })} 
        />
      )}
    </div>
  );
}

export default ForgotPassword; 