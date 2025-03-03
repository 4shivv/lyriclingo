import React, { useState, useEffect } from "react";
import "../styles/Flashcards.css";
import Toast from "../components/Toast";
import LoadingSpinner from "../components/LoadingSpinner";

import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";

// Use Vite's env variable for backend URL; fallback to localhost for development.
const backendUrl = import.meta.env.VITE_BACKEND_URL || "http://localhost:5001";

// Variants for text and button animations
const textVariants = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 }
};

// Loading Ellipsis Component
function LoadingEllipsis() {
  const [dots, setDots] = useState('.');
  
  useEffect(() => {
    const interval = setInterval(() => {
      setDots(prev => prev.length >= 3 ? '.' : prev + '.');
    }, 400);
    return () => clearInterval(interval);
  }, []);
  
  return (
    <div className="loading-ellipsis">
      Fetching flashcards<span className="animated-dots">{dots}</span>
    </div>
  );
}

function Flashcards({ selectedSong, setSelectedSong, isLoggedIn }) {
  const navigate = useNavigate();
  const [flashcards, setFlashcards] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [toast, setToast] = useState({ show: false, message: "", type: "error" });
  const [currentSong, setCurrentSong] = useState(null);
  const [error, setError] = useState(null);
  const [logging, setLogging] = useState(false); // Track logging status
  const [isLoadingCards, setIsLoadingCards] = useState(false); // New state for loading flashcards

  useEffect(() => {
    if (selectedSong) {
      setIsLoadingCards(true); // Set loading to true before fetch
      fetch(`${backendUrl}/api/songs/flashcards?song=${encodeURIComponent(selectedSong.song)}`)
        .then(res => res.json())
        .then(data => {
          if (data.error) {
            console.error("Error fetching flashcards:", data.error);
          } else {
            setFlashcards(data);
          }
          setIsLoadingCards(false); // Set loading to false after fetch completes
        })
        .catch(error => {
          console.error("Error fetching flashcards:", error);
          setIsLoadingCards(false); // Set loading to false on error
        });
    }
  }, [selectedSong]);

  // Function to log the current song
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
          // Set loading state to true as we're about to update selectedSong
          setIsLoadingCards(true);
          
          // Show success toast
          setToast({
            show: true,
            message: `🎵 Logged: ${logData.song.song} by ${logData.song.artist}`,
            type: "success"
          });
          
          // Update selected song which will trigger the useEffect to fetch flashcards
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
        {/* Animated Title */}
        <motion.h1 
          className="flashcards-title"
          variants={textVariants}
          initial="initial"
          animate="animate"
          transition={{ duration: 0.3 }}
        >
          Flashcards for {selectedSong ? selectedSong.song : "Unknown Song"}
        </motion.h1>

        {/* Animated Log Current Song Button Wrapper */}
        {isLoggedIn && (
          <motion.div 
            className="log-button-wrapper"
            variants={textVariants}
            initial="initial"
            animate="animate"
            transition={{ duration: 0.3, delay: 0.1 }}
          >
            <button className="log-song-button" onClick={logCurrentSong} disabled={logging}>
              {logging ? <LoadingSpinner size={20} color="#fff" /> : "🎵 Log Current Song"}
            </button>
          </motion.div>
        )}

        <div className="flashcard-wrapper">
          <div className="flashcard-container">
            {isLoadingCards ? (
              <LoadingEllipsis />
            ) : flashcards.length > 0 ? (
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

        {/* Animated Flashcard Controls */}
        <motion.div 
          className="flashcard-controls"
          variants={textVariants}
          initial="initial"
          animate="animate"
          transition={{ duration: 0.3, delay: 0.2 }}
        >
          <button 
            className="nav-button" 
            onClick={() => setCurrentIndex((prev) => (prev === 0 ? flashcards.length - 1 : prev - 1))}
            disabled={isLoadingCards || flashcards.length === 0}
          >
            &#8592; {/* Left Arrow */}
          </button>
          <span>{flashcards.length > 0 ? `${currentIndex + 1} / ${flashcards.length}` : "0 / 0"}</span>
          <button 
            className="nav-button" 
            onClick={() => setCurrentIndex((prev) => (prev + 1) % flashcards.length)}
            disabled={isLoadingCards || flashcards.length === 0}
          >
            &#8594; {/* Right Arrow */}
          </button>
        </motion.div>

        <Toast message={toast.message} type={toast.type} onClose={() => setToast({ ...toast, show: false })} />
      </div>
    </div>
  );
}

export default Flashcards;