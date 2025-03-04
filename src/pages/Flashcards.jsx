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

// Enhanced LoadingEllipsis Component without Emoji
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

// New EmptyFlashcardState Component without Emoji
function EmptyFlashcardState({ songName }) {
  return (
    <div className="empty-flashcard-container">
      <div className="empty-flashcard-text">
        No flashcards available{songName ? ` for "${songName}"` : ''}
      </div>
      <div className="empty-flashcard-subtext">
        Try selecting a different song or log a new song from Spotify
      </div>
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
  const [sentiment, setSentiment] = useState(null);
  const [sentimentLoading, setSentimentLoading] = useState(false);

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

  useEffect(() => {
    if (selectedSong && flashcards.length > 0) {
      setSentimentLoading(true);
      
      // Construct the URL with song and artist if available
      let url = `${backendUrl}/api/songs/sentiment?song=${encodeURIComponent(selectedSong.song)}`;
      if (selectedSong.artist) {
        url += `&artist=${encodeURIComponent(selectedSong.artist)}`;
      }
      
      fetch(url)
        .then(res => res.json())
        .then(data => {
          setSentiment(data);
          setSentimentLoading(false);
        })
        .catch(error => {
          console.error("Error fetching sentiment:", error);
          setSentimentLoading(false);
        });
    }
  }, [selectedSong, flashcards.length, backendUrl]);

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
              <EmptyFlashcardState songName={selectedSong?.song} />
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
          
          <div className="progress-container">
            <div 
              className="progress-bar" 
              style={{ 
                width: `${flashcards.length > 0 ? ((currentIndex + 1) / flashcards.length) * 100 : 0}%` 
              }}
            ></div>
            <div className="progress-text">
              {flashcards.length > 0 ? `${currentIndex + 1} / ${flashcards.length}` : "0 / 0"}
            </div>
          </div>
          
          <button 
            className="nav-button" 
            onClick={() => setCurrentIndex((prev) => (prev + 1) % flashcards.length)}
            disabled={isLoadingCards || flashcards.length === 0}
          >
            &#8594; {/* Right Arrow */}
          </button>
        </motion.div>

        {/* Sentiment Analysis Display with Emotions */}
        {flashcards.length > 0 && (
          <motion.div 
            className="sentiment-container"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
          >
            <h3 className="sentiment-title">Song Mood Analysis</h3>
            {sentimentLoading ? (
              <div className="sentiment-loading">
                <div className="loading-spinner"></div>
                <span>Analyzing song mood...</span>
              </div>
            ) : sentiment ? (
              <div className="sentiment-result">
                <div className="sentiment-emoji">{sentiment.emoji}</div>
                <div className="sentiment-text">
                  This song appears to be <span className="sentiment-value">{sentiment.sentiment}</span>
                </div>
                
                {/* Primary Emotion Display */}
                {sentiment.primaryEmotion && sentiment.primaryEmotion !== "Unknown" && (
                  <div className="primary-emotion">
                    Primary emotion: <span className="emotion-value">{sentiment.primaryEmotion}</span>
                    <span className="emotion-score">({sentiment.emotionScore})</span>
                  </div>
                )}
                
                {/* Additional Emotions */}
                {sentiment.emotions && sentiment.emotions.length > 1 && (
                  <div className="emotion-chips">
                    {sentiment.emotions.slice(1, 3).map((emotion, index) => (
                      <div key={index} className="emotion-chip">
                        {emotion.emotion} <span className="chip-score">{emotion.score}</span>
                      </div>
                    ))}
                  </div>
                )}
                
                <div className="sentiment-score">Confidence: {sentiment.score}</div>
                
                {/* Display API source indicator */}
                {!sentiment.fallback && (
                  <div className="sentiment-source api">
                    Analysis performed via API
                  </div>
                )}
                
                {sentiment.notice && (
                  <div className="sentiment-notice">
                    {sentiment.notice}
                  </div>
                )}
                
                {sentiment.error ? (
                  <div className="sentiment-error">
                    {sentiment.error}
                  </div>
                ) : (
                  <div className="sentiment-info">
                    Based on analysis of the English translations of these lyrics
                  </div>
                )}
              </div>
            ) : (
              <div className="sentiment-unavailable">Mood analysis unavailable</div>
            )}
          </motion.div>
        )}

        <Toast message={toast.message} type={toast.type} onClose={() => setToast({ ...toast, show: false })} />
      </div>
    </div>
  );
}

export default Flashcards;