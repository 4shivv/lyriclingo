import React, { useState } from "react";
import "../styles/History.css";

const sampleHistory = [
  { id: 1, song: "Despacito", artist: "Luis Fonsi", date: "2024-01-30" },
  { id: 2, song: "Bailando", artist: "Enrique Iglesias", date: "2024-01-29" },
  { id: 3, song: "Vivir Mi Vida", artist: "Marc Anthony", date: "2024-01-28" },
];

function History({ onSelectSong }) {
  const [history, setHistory] = useState(sampleHistory);

  const clearHistory = () => {
    setHistory([]);
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
          history.map((entry) => (
            <div
              key={entry.id}
              className="history-item"
              onClick={() => onSelectSong(entry.id)}
            >
              <div className="history-info">
                <span className="history-song">{entry.song}</span> - 
                <span className="history-artist"> {entry.artist}</span>
              </div>
              <span className="history-date">{entry.date}</span>
            </div>
          ))
        ) : (
          <p className="history-empty">No history available.</p>
        )}
      </div>
    </div>
  );
}

export default History;
