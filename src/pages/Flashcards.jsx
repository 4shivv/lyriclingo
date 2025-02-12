import React, { useState, useEffect } from "react";
import "../styles/Flashcards.css";
import Toast from "../components/Toast";
import LoadingSpinner from "../components/LoadingSpinner";

import { useNavigate } from "react-router-dom"; // ✅ Import navigation

const backendUrl = process.env.REACT_APP_BACKEND_URL || "http://localhost:5001";

function Flashcards({ selectedSong, setSelectedSong, isLoggedIn }) {
  const navigate = useNavigate(); // ✅ Initialize navigation
  const [flashcards, setFlashcards] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState({ show: false, message: "", type: "error" });

  useEffect(() => {
    if (selectedSong) {
      fetch(`${backendUrl}/api/songs/flashcards?song=${encodeURIComponent(selectedSong.song)}`)
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

    setLoading(true);
    try {
      const response = await fetch(
        `${backendUrl}/api/spotify/current-song?accessToken=${accessToken}&refreshToken=${refreshToken}`
      );
      const data = await response.json();

      if (data.song) {
        await fetch(`${backendUrl}/api/songs/log`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        });
        setToast({
          show: true,
          message: `🎵 Logged: ${data.song} by ${data.artist}`,
          type: "success",
        });
        setSelectedSong(data);
      } else {
        setToast({
          show: true,
          message: "No song currently playing!",
          type: "error",
        });
      }
    } catch (error) {
      console.error("Error logging song:", error);
      setToast({
        show: true,
        message: "Error fetching current song.",
        type: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flashcards-container">
      {loading && <LoadingSpinner />}
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

      <Toast message={toast.message} type={toast.type} onClose={() => setToast({ ...toast, show: false })} />
    </div>
  );
}

export default Flashcards;