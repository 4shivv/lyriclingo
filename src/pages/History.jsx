import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom"; // Import navigation
import "../styles/History.css";

function History({ setSelectedSong }) {
  const [history, setHistory] = useState([]);
  const navigate = useNavigate(); // Initialize navigation

  useEffect(() => {
    fetch("http://localhost:5001/api/songs/history")
      .then((res) => res.json())
      .then((data) => {
        console.log("Fetched History:", data); // ✅ Debugging: Check if data arrives
        setHistory(data);
      })
      .catch((error) => console.error("Error fetching history:", error));
  }, []);

  // ✅ Function to clear history
  const clearHistory = async () => {
    await fetch("http://localhost:5001/api/songs/clear", { method: "DELETE" });
    setHistory([]); // ✅ Update frontend immediately
    alert("History Cleared!");
  };

  // ✅ Navigate to flashcards for selected song
  const handleSongClick = (song) => {
    setSelectedSong(song);
    navigate("/flashcards");
  };

  return (
    <div className="history-container">
      <h1 className="history-title">Translation History</h1>
      <p className="history-subtitle">View your previously translated songs.</p>

      <button className="clear-history-button" onClick={clearHistory}>
        🗑 Clear History
      </button>

      <div className="history-list">
        {history.length > 0 ? (
          history.map((entry, index) => (
            <div key={index} className="history-item" onClick={() => handleSongClick(entry)}>
              <div className="history-info">
                <span className="history-song">{entry.song}</span> - 
                <span className="history-artist"> {entry.artist}</span>
              </div>
              <span className="history-date">
                {new Date(entry.timestamp).toLocaleDateString()}
              </span>
            </div>
          ))
        ) : (
          <p className="history-empty">No songs logged yet.</p>
        )}
      </div>
    </div>
  );
}

export default History;
