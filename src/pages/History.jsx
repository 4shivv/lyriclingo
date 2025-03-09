import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom"; 
import { motion, AnimatePresence } from "framer-motion";
import Toast from "../components/Toast";
import LoadingSpinner from "../components/LoadingSpinner";
import "../styles/History.css";
import { isAuthenticated, getUserId } from "../utils/auth";
import { apiGet, apiDelete } from "../utils/api";

// Use backendUrl from environment variable
const backendUrl = import.meta.env.VITE_BACKEND_URL || "http://localhost:5001";

function History({ setSelectedSong }) {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [clearLoading, setClearLoading] = useState(false);
  const [toast, setToast] = useState({ show: false, message: "", type: "error" });
  const navigate = useNavigate();

  // Check authentication on component mount
  useEffect(() => {
    if (!isAuthenticated()) {
      setToast({
        show: true,
        message: "Please log in to access your history",
        type: "warning"
      });
      navigate("/login");
      return;
    }
    
    fetchHistory();
  }, [navigate]);

  // Fetch user-specific history
  const fetchHistory = async () => {
    setLoading(true);
    try {
      // Get user ID for data validation
      const userId = getUserId();
      if (!userId) {
        throw new Error("User ID not found. Please log in again.");
      }
      
      // Add timestamp and userId to prevent caching issues
      const url = `${backendUrl}/api/songs/history?userId=${userId}&t=${Date.now()}`;
      
      const data = await apiGet(url);
      setHistory(data);
    } catch (error) {
      console.error("Error fetching history:", error);
      
      if (error.message.includes("Authentication") || error.message.includes("User ID")) {
        // Authentication error - redirect to login
        navigate("/login");
      }
      
      setToast({ 
        show: true, 
        message: error.message || "Error fetching history", 
        type: "error" 
      });
    } finally {
      setLoading(false);
    }
  };

  // Clear history with user validation
  const clearHistory = async () => {
    setClearLoading(true);
    try {
      // Check authentication
      if (!isAuthenticated()) {
        throw new Error("Authentication required");
      }

      await apiDelete(`${backendUrl}/api/songs/clear`);
      
      // Clear selected song state to prevent stale data on flashcards page
      setSelectedSong(null);
      
      setToast({ show: true, message: "History Cleared!", type: "success" });
      setHistory([]);  // Clear history state immediately
    } catch (error) {
      console.error("Error clearing history:", error);
      
      if (error.message.includes("Authentication")) {
        // Authentication error - redirect to login
        navigate("/login");
      }
      
      setToast({ 
        show: true, 
        message: error.message || "Error clearing history", 
        type: "error" 
      });
    } finally {
      setClearLoading(false);
    }
  };

  // Navigate to flashcards for selected song
  const handleSongClick = (song) => {
    // Validate user is still authenticated
    if (!isAuthenticated()) {
      setToast({
        show: true,
        message: "Please log in to view flashcards",
        type: "warning"
      });
      navigate("/login");
      return;
    }
    
    setSelectedSong(song);
    navigate("/flashcards");
  };

  // Delete a specific song
  const handleSongDelete = async (id, event) => {
    // Stop event propagation to prevent navigating to flashcards
    event.stopPropagation();
    
    try {
      const response = await apiDelete(`${backendUrl}/api/songs/${id}`);
      
      // Update local state to remove the deleted song
      setHistory(prevHistory => prevHistory.filter(song => song._id !== id));
      
      // If this was the currently selected song in Flashcards, clear it
      if (response.songTitle && selectedSong && selectedSong.song === response.songTitle) {
        setSelectedSong(null);
      }
      
      setToast({
        show: true,
        message: "Song deleted from history",
        type: "success"
      });
    } catch (error) {
      console.error("Error deleting song:", error);
      setToast({
        show: true,
        message: error.message || "Error deleting song",
        type: "error"
      });
    }
  };

  return (
    <div className="history-container">
      <div className="history-content">
        <motion.h1 
          className="history-title"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          Translation History
        </motion.h1>
        <motion.p 
          className="history-subtitle"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          View your previously translated songs.
        </motion.p>

        <motion.button 
          className="clear-history-button"
          onClick={clearHistory}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          disabled={clearLoading || history.length === 0}
        >
          {clearLoading ? <LoadingSpinner size={20} color="#fff" /> : "🗑 Clear History"}
        </motion.button>

        <motion.div className="history-list">
          <AnimatePresence>
            {loading ? (
              <motion.div 
                className="history-loading"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <LoadingSpinner size={30} color="#fff" />
                <p>Loading your history...</p>
              </motion.div>
            ) : history.length > 0 ? (
              history.map((entry) => (
                <motion.div
                  key={entry._id}
                  className="history-item"
                  onClick={() => handleSongClick(entry)}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ delay: 0.1 }}
                  whileHover={{ 
                    scale: 1.02,
                    x: 10,
                    transition: { duration: 0.2 }
                  }}
                >
                  <div className="history-info">
                    <span className="history-song">{entry.song}</span> - 
                    <span className="history-artist"> {entry.artist}</span>
                  </div>
                  <div className="history-actions">
                    <span className="history-date">
                      {new Date(entry.timestamp).toLocaleDateString()}
                    </span>
                    <button 
                      className="delete-history-button"
                      onClick={(e) => handleSongDelete(entry._id, e)}
                      title="Delete song"
                    >
                      🗑️
                    </button>
                  </div>
                </motion.div>
              ))
            ) : (
              <motion.p 
                className="history-empty"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
              >
                No songs logged yet.
              </motion.p>
            )}
          </AnimatePresence>
        </motion.div>
        <Toast message={toast.message} type={toast.type} onClose={() => setToast({ ...toast, show: false })} />
      </div>
    </div>
  );
}

export default History;