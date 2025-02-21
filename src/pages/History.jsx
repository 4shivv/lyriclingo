import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom"; // Import navigation
import { motion, AnimatePresence } from "framer-motion";
import Toast from "../components/Toast";
import LoadingSpinner from "../components/LoadingSpinner"; // Import spinner for clear history
import "../styles/History.css";

// Use backendUrl from environment variable
const backendUrl = import.meta.env.VITE_BACKEND_URL || "http://localhost:5001";

function History({ setSelectedSong }) {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [clearLoading, setClearLoading] = useState(false); // New state for clear history spinner
  const [toast, setToast] = useState({ show: false, message: "", type: "error" });
  const navigate = useNavigate(); // Initialize navigation

  // Fetch history from API
  const fetchHistory = async () => {
    setLoading(true);
    try {
      const accessToken = localStorage.getItem("spotify_access_token");
      const res = await fetch(
        `${backendUrl}/api/songs/history?accessToken=${accessToken}&t=${Date.now()}`
      );
      const data = await res.json();
      setHistory(data);
    } catch (error) {
      console.error("Error fetching history:", error);
      setToast({ show: true, message: "Error fetching history.", type: "error" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  // Clear history without confirmation and with spinner
  const clearHistory = async () => {
    setClearLoading(true);
    try {
      const accessToken = localStorage.getItem("spotify_access_token");
      await fetch(`${backendUrl}/api/songs/clear?accessToken=${accessToken}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" }
      });
      setToast({ show: true, message: "History Cleared!", type: "success" });
      fetchHistory();
    } catch (error) {
      console.error("Error clearing history:", error);
      setToast({ show: true, message: "Error clearing history.", type: "error" });
    } finally {
      setClearLoading(false);
    }
  };

  // Navigate to flashcards for selected song
  const handleSongClick = (song) => {
    setSelectedSong(song);
    navigate("/flashcards");
  };

  return (
    <div className="history-container">
      {/* New content wrapper with downward shift */}
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
        >
          {clearLoading ? <LoadingSpinner size={20} color="#fff" /> : "🗑 Clear History"}
        </motion.button>

        <motion.div className="history-list">
          <AnimatePresence>
            {history.length > 0 ? (
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
