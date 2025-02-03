import React, { useState, useEffect } from "react";
import "../styles/Flashcards.css";

import { useNavigate } from "react-router-dom"; // ✅ Import navigation

function Flashcards({ selectedSong, setSelectedSong, isLoggedIn }) {
  const navigate = useNavigate(); // ✅ Initialize navigation
  const [flashcards, setFlashcards] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);

  useEffect(() => {
    if (selectedSong) {
      fetch(`http://localhost:5001/api/songs/flashcards?song=${encodeURIComponent(selectedSong.song)}`)
        .then(res => res.json())
        .then(data => {
          if (data.error) {
            console.error("Error fetching flashcards:", data.error);
          } else {
            setFlashcards(data);
          }
        })
        .catch(error => console.error("Error fetching flashcards:", error));
    }
  }, [selectedSong]); // ✅ Re-fetch flashcards when selectedSong changes

  const logCurrentSong = async () => {
    const accessToken = localStorage.getItem("spotify_access_token");
    const refreshToken = localStorage.getItem("spotify_refresh_token");

    if (!accessToken || !refreshToken) {
      alert("You need to log in with Spotify first!");
      return;
    }

    try {
      const response = await fetch(`http://localhost:5001/api/spotify/current-song?accessToken=${accessToken}&refreshToken=${refreshToken}`);
      const data = await response.json();

      if (data.song) {
        await fetch("http://localhost:5001/api/songs/log", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        });

        alert(`🎵 Logged: ${data.song} by ${data.artist}`);

        // ✅ Update selected song and navigate to Flashcards
        setSelectedSong(data);
        navigate("/flashcards");
      } else {
        alert("No song currently playing!");
      }
    } catch (error) {
      console.error("Error logging song:", error);
      alert("Error fetching current song.");
    }
  };

  return (
    <div className="flashcards-container">
      <h1 className="flashcards-title">
        Flashcards for {selectedSong ? selectedSong.song : "Unknown Song"}
      </h1>
      <p className="flashcards-subtitle">Click the card to flip 🔄</p>

      {/* ✅ Log Current Song Button - Now updates flashcards immediately */}
      {isLoggedIn && (
        <button className="log-song-button" onClick={logCurrentSong}>
          🎵 Log Current Song
        </button>
      )}

      <div className="flashcard-wrapper">
        <div className="flashcard-container">
          {flashcards.length > 0 ? (
            <div className={`flashcard ${flipped ? "flipped" : ""}`} onClick={() => setFlipped(!flipped)}>
              <div className="flashcard-face flashcard-front">
                {flashcards[currentIndex].front}
              </div>
              <div className="flashcard-face flashcard-back">
                {flashcards[currentIndex].back}
              </div>
            </div>
          ) : (
            <p>No flashcards available for this song.</p>
          )}
        </div>
      </div>

      <div className="flashcard-controls">
        <button className="nav-button" onClick={() => setCurrentIndex((prev) => (prev === 0 ? flashcards.length - 1 : prev - 1))}>⬅️</button>
        <span>{currentIndex + 1} / {flashcards.length}</span>
        <button className="nav-button" onClick={() => setCurrentIndex((prev) => (prev + 1) % flashcards.length)}>➡️</button>
      </div>
    </div>
  );
}

export default Flashcards;