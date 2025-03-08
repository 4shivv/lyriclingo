import React, { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { motion } from "framer-motion";
import "../styles/ForgotPassword.css";
import Toast from "../components/Toast";

function ResetPassword() {
  const { token } = useParams();
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isTokenValid, setIsTokenValid] = useState(null);
  const [showPassword, setShowPassword] = useState(false);
  const [toast, setToast] = useState({ show: false, message: "", type: "error" });

  // Verify token on component mount
  useEffect(() => {
    const verifyToken = async () => {
      setIsLoading(true);
      try {
        const response = await fetch(`${process.env.REACT_APP_API_URL}/api/auth/verify-reset-token/${token}`);
        
        if (response.ok) {
          setIsTokenValid(true);
        } else {
          setIsTokenValid(false);
          setToast({
            show: true,
            message: "Invalid or expired password reset link",
            type: "error"
          });
        }
      } catch (error) {
        setIsTokenValid(false);
        setToast({
          show: true,
          message: "Error verifying reset token",
          type: "error"
        });
      } finally {
        setIsLoading(false);
      }
    };

    verifyToken();
  }, [token]);

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (password !== confirmPassword) {
      setToast({
        show: true,
        message: "Passwords do not match",
        type: "error"
      });
      return;
    }
    
    if (password.length < 8) {
      setToast({
        show: true,
        message: "Password must be at least 8 characters long",
        type: "error"
      });
      return;
    }
    
    setIsLoading(true);
    
    try {
      const response = await fetch(`${process.env.REACT_APP_API_URL}/api/auth/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password })
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to reset password');
      }
      
      setToast({
        show: true,
        message: "Password reset successful!",
        type: "success"
      });
      
      // Redirect to login after successful reset
      setTimeout(() => {
        navigate("/login");
      }, 2000);
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

  if (isTokenValid === null) {
    return (
      <div className="forgot-password-page-container">
        <div className="forgot-password-content-wrapper">
          <div className="forgot-password-form-container">
            <div className="verifying-token">
              <div className="loading-spinner-large"></div>
              <p>Verifying reset link...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (isTokenValid === false) {
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
            <div className="token-invalid">
              <div className="token-invalid-icon">
                <svg width="60" height="60" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M12 2C6.48 2 2 6.48 2 12C2 17.52 6.48 22 12 22C17.52 22 22 17.52 22 12C22 6.48 17.52 2 12 2ZM13 17H11V15H13V17ZM13 13H11V7H13V13Z" fill="rgba(231, 76, 60, 0.9)"/>
                </svg>
              </div>
              <h2>Invalid or Expired Link</h2>
              <p>The password reset link is invalid or has expired.</p>
              <Link to="/forgot-password" className="reset-button">
                Request a new link
              </Link>
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
            <h1 className="forgot-password-title">Create New Password</h1>
            <p className="forgot-password-subtitle">
              Enter a new password for your account
            </p>
          </div>
          
          <form onSubmit={handleSubmit} className="forgot-password-form">
            <div className="form-group">
              <label htmlFor="password" className="form-label">New Password</label>
              <div className="input-container">
                <svg className="input-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M12 1C8.676 1 6 3.676 6 7V9H4C2.895 9 2 9.895 2 11V21C2 22.105 2.895 23 4 23H20C21.105 23 22 22.105 22 21V11C22 9.895 21.105 9 20 9H18V7C18 3.676 15.324 1 12 1ZM12 3C14.276 3 16 4.724 16 7V9H8V7C8 4.724 9.724 3 12 3ZM12 15C13.105 15 14 15.895 14 17C14 18.105 13.105 19 12 19C10.895 19 10 18.105 10 17C10 15.895 10.895 15 12 15Z" fill="currentColor"/>
                </svg>
                <input 
                  type={showPassword ? "text" : "password"} 
                  id="password"
                  placeholder="Create a new password" 
                  className="forgot-password-input"
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
              <div className="password-requirements">
                Password must be at least 8 characters long
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="confirmPassword" className="form-label">Confirm New Password</label>
              <div className="input-container">
                <svg className="input-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M12 1C8.676 1 6 3.676 6 7V9H4C2.895 9 2 9.895 2 11V21C2 22.105 2.895 23 4 23H20C21.105 23 22 22.105 22 21V11C22 9.895 21.105 9 20 9H18V7C18 3.676 15.324 1 12 1ZM12 3C14.276 3 16 4.724 16 7V9H8V7C8 4.724 9.724 3 12 3ZM12 15C13.105 15 14 15.895 14 17C14 18.105 13.105 19 12 19C10.895 19 10 18.105 10 17C10 15.895 10.895 15 12 15Z" fill="currentColor"/>
                </svg>
                <input 
                  type={showPassword ? "text" : "password"} 
                  id="confirmPassword"
                  placeholder="Confirm your new password" 
                  className="forgot-password-input"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  disabled={isLoading}
                  required
                />
              </div>
              {confirmPassword && password !== confirmPassword && (
                <div className="password-mismatch">
                  Passwords do not match
                </div>
              )}
            </div>
            
            <button 
              type="submit" 
              className={`forgot-password-button ${isLoading ? 'loading' : ''}`}
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <span className="loading-spinner"></span>
                  <span>Resetting Password...</span>
                </>
              ) : "Reset Password"}
            </button>
          </form>
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

export default ResetPassword; 