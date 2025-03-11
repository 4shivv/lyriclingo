import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom"; 
import { motion, AnimatePresence } from "framer-motion";
import Toast from "../components/Toast";
import LoadingSpinner from "../components/LoadingSpinner";
import "../styles/History.css";
import { isAuthenticated, getUserId } from "../utils/auth";
import { apiGet, apiDelete } from "../utils/api";

// Use backendUrl from environment variable
const backendUrl = import.meta.env.VITE_BACKEND_URL || "http://localhost:5001";

function History({ setSelectedSong, currentUserId }) {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [clearLoading, setClearLoading] = useState(false);
  const [toast, setToast] = useState({ show: false, message: "", type: "error" });
  const navigate = useNavigate();

  // Reset component state when needed
  const resetComponentState = useCallback(() => {
    setHistory([]);
    setSelectedSong(null);
  }, [setSelectedSong]);

  // Check authentication on component mount and handle user changes
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
    
    // Check if user ID changed
    const userId = getUserId();
    if (userId !== currentUserId && currentUserId !== null) {
      console.log("User changed in History component, resetting state");
      resetComponentState();
    }
    
    fetchHistory();
  }, [navigate, currentUserId, resetComponentState]);

  // Fetch user-specific history with improved validation
  const fetchHistory = async () => {
    setLoading(true);
    try {
      // Get user ID for data validation
      const userId = getUserId();
      if (!userId) {
        throw new Error("User ID not found. Please log in again.");
      }
      
      // Validate that the current user matches the expected user
      if (currentUserId !== null && userId !== currentUserId) {
        console.warn("User mismatch detected, refreshing auth state");
        throw new Error("User session changed. Please log in again.");
      }
      
      // Add timestamp and userId to prevent caching issues
      const url = `${backendUrl}/api/songs/history?userId=${userId}&t=${Date.now()}`;
      
      const data = await apiGet(url);
      
      // Ensure the data isn't cached from a previous user
      if (data.length > 0 && data[0].user !== userId) {
        console.warn("Retrieved data belongs to a different user");
        setHistory([]);
        throw new Error("Data integrity issue. Please refresh the page.");
      }
      
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

  // Clear history with improved user validation
  const clearHistory = async () => {
    setClearLoading(true);
    try {
      // Check authentication
      if (!isAuthenticated()) {
        throw new Error("Authentication required");
      }
      
      // Verify current user ID
      const userId = getUserId();
      if (userId !== currentUserId && currentUserId !== null) {
        throw new Error("User session may have changed. Please log in again.");
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

  // Navigate to flashcards for selected song with ownership validation
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
    
    // Verify song belongs to current user
    const userId = getUserId();
    if (song.user !== userId) {
      setToast({
        show: true,
        message: "This song is not in your library",
        type: "warning"
      });
      return;
    }
    
    setSelectedSong(song);
    navigate("/flashcards");
  };

  // Delete a specific song with improved validation
  const handleSongDelete = async (id, event) => {
    // Stop event propagation to prevent navigating to flashcards
    event.stopPropagation();
    
    try {
      // Validate current user
      const userId = getUserId();
      if (!userId || (currentUserId !== null && userId !== currentUserId)) {
        throw new Error("User session may have changed. Please log in again.");
      }
      
      // Find song to verify ownership
      const songToDelete = history.find(song => song._id === id);
      if (!songToDelete) {
        throw new Error("Song not found");
      }
      
      // Verify ownership
      if (songToDelete.user !== userId) {
        throw new Error("You don't have permission to delete this song");
      }
      
      const response = await apiDelete(`${backendUrl}/api/songs/${id}`);
      
      // Update local state to remove the deleted song
      setHistory(prevHistory => prevHistory.filter(song => song._id !== id));
      
      // If this was the currently selected song in Flashcards, clear it
      if (response.songTitle && response.songTitle === selectedSong?.song) {
        setSelectedSong(null);
      }
      
      setToast({
        show: true,
        message: "Song deleted from history",
        type: "success"
      });
    } catch (error) {
      console.error("Error deleting song:", error);
      
      // If authentication error, redirect to login
      if (error.message.includes("authentication") || error.message.includes("session")) {
        navigate("/login");
      }
      
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
          <AnimatePresence mode="wait">
            {loading ? (
              <motion.div 
                className="history-loading"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                key="loading"
              >
                <LoadingSpinner size={40} color="#fcdc4d" />
              </motion.div>
            ) : history.length > 0 ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="history-items-container"
                key="history-items"
                style={{ width: "100%" }}
              >
                {history.map((entry) => (
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
                ))}
              </motion.div>
            ) : (
              <motion.p 
                className="history-empty"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
                key="empty"
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