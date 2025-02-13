import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom"; // Import navigation
import { motion, AnimatePresence } from "framer-motion";
import Toast from "../components/Toast";
import "../styles/History.css";

// Use backendUrl from environment variable
const backendUrl = import.meta.env.VITE_BACKEND_URL || "http://localhost:5001";

function History({ setSelectedSong }) {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState({ show: false, message: "", type: "error" });
  const navigate = useNavigate(); // Initialize navigation

  useEffect(() => {
    const fetchHistory = async () => {
      setLoading(true);
      try {
        const accessToken = localStorage.getItem("spotify_access_token");
        // Now include the accessToken to fetch the user-specific history
        const res = await fetch(`${backendUrl}/api/songs/history?accessToken=${accessToken}`);
        const data = await res.json();
        console.log("Fetched History:", data);
        setHistory(data);
      } catch (error) {
        console.error("Error fetching history:", error);
        setToast({ show: true, message: "Error fetching history.", type: "error" });
      } finally {
        setLoading(false);
      }
    };

    fetchHistory();
  }, []);

  const clearHistory = async () => {
    setLoading(true);
    try {
      const accessToken = localStorage.getItem("spotify_access_token");
      // Include accessToken in the clear history request
      await fetch(`${backendUrl}/api/songs/clear?accessToken=${accessToken}`, { method: "DELETE" });
      setHistory([]);
      setToast({ show: true, message: "History Cleared!", type: "success" });
    } catch (error) {
      console.error("Error clearing history:", error);
      setToast({ show: true, message: "Error clearing history.", type: "error" });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteEntry = async (entry, e) => {
    e.stopPropagation();
    if (!window.confirm(`Are you sure you want to delete "${entry.song}"?`)) {
      return;
    }
    try {
      const accessToken = localStorage.getItem("spotify_access_token");
      // Include accessToken in the delete request for that entry.
      await fetch(`${backendUrl}/api/songs/delete/${entry._id}?accessToken=${accessToken}`, { method: "DELETE" });
      setHistory((prev) => prev.filter((item) => item._id !== entry._id));
      setToast({ show: true, message: "Entry deleted!", type: "success" });
    } catch (error) {
      console.error("Error deleting entry:", error);
      setToast({ show: true, message: "Error deleting entry.", type: "error" });
    }
  };

  // ✅ Navigate to flashcards for selected song
  const handleSongClick = (song) => {
    setSelectedSong(song);
    navigate("/flashcards");
  };

  // When loading, render nothing (spinner removed)
  if (loading) {
    return null;
  }

  return (
    <div className="history-container">
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
        🗑 Clear History
      </motion.button>

      <motion.div className="history-list">
        <AnimatePresence>
          {history.length > 0 ? (
            history.map((entry, index) => (
              <motion.div
                key={index}
                className="history-item"
                onClick={() => handleSongClick(entry)}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ delay: index * 0.1 }}
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
                    onClick={(e) => handleDeleteEntry(entry, e)}
                  >
                    Delete
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
  );
}

export default History;
