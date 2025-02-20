import React, { useState, useEffect } from "react";
import "../styles/Flashcards.css";
import Toast from "../components/Toast";
import LoadingSpinner from "../components/LoadingSpinner"; // ✅ Import LoadingSpinner for log feedback

import { useNavigate } from "react-router-dom"; // ✅ Import navigation

// Use Vite's env variable for backend URL; fallback to localhost for development.
const backendUrl = import.meta.env.VITE_BACKEND_URL || "http://localhost:5001";

function Flashcards({ selectedSong, setSelectedSong, isLoggedIn }) {
  const navigate = useNavigate(); // ✅ Initialize navigation
  const [flashcards, setFlashcards] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [toast, setToast] = useState({ show: false, message: "", type: "error" });
  const [currentSong, setCurrentSong] = useState(null);
  const [error, setError] = useState(null);
  const [logging, setLogging] = useState(false); // New state to track logging status

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

  // Function to log the current song.
  const logCurrentSong = async () => {
    setLogging(true); // Begin logging spinner
    const accessToken = localStorage.getItem("spotify_access_token");
    const refreshToken = localStorage.getItem("spotify_refresh_token");

    if (!accessToken || !refreshToken) {
      alert("You need to log in with Spotify first!");
      setLogging(false);
      return;
    }

    try {
      // Fetch the currently playing song from Spotify
      const currentResponse = await fetch(
        `${backendUrl}/api/spotify/current-song?accessToken=${accessToken}&refreshToken=${refreshToken}`
      );
      const currentData = await currentResponse.json();

      if (currentData.song) {
        // Log the song in your history by posting it to your API.
        const logResponse = await fetch(`${backendUrl}/api/songs/log`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(currentData)
        });
        const logData = await logResponse.json();

        if (logData.error) {
          setToast({ show: true, message: logData.error, type: "error" });
        } else {
          // logData is expected to be: { message, song }
          // Set state from the song property so that selectedSong is a plain object.
          setToast({
            show: true,
            message: `🎵 Logged: ${logData.song.song} by ${logData.song.artist}`,
            type: "success"
          });
          setSelectedSong(logData.song);
          setCurrentSong(logData.song);
        }
      } else {
        setToast({
          show: true,
          message: "No song currently playing!",
          type: "error"
        });
      }
    } catch (err) {
      console.error("Error logging song:", err);
      setError(err.message);
      setToast({
        show: true,
        message: "Error fetching current song.",
        type: "error"
      });
    } finally {
      setLogging(false); // End logging spinner regardless of success or error
    }
  };

  return (
    <div className="flashcards-container">
      <div className="flashcards-content">
        <h1 className="flashcards-title">
          Flashcards for {selectedSong ? selectedSong.song : "Unknown Song"}
        </h1>
        <p className="flashcards-subtitle">Click the card to flip 🔄</p>

        {/* ✅ Log Current Song Button - Now updates flashcards immediately */}
        {isLoggedIn && (
          <button className="log-song-button" onClick={logCurrentSong} disabled={logging}>
            {logging ? <LoadingSpinner size={20} color="#fff" /> : "🎵 Log Current Song"}
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
    </div>
  );
}

export default Flashcards;