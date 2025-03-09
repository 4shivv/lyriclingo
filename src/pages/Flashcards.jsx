// src/pages/Flashcards.jsx - Updated with proper data isolation and token handling

import React, { useState, useEffect, useRef } from "react";
import "../styles/Flashcards.css";
import Toast from "../components/Toast";
import LoadingSpinner from "../components/LoadingSpinner";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { isAuthenticated, getUserId, getSpotifyTokens, storeSpotifyTokens } from "../utils/auth";
import { apiGet, apiPost, apiDelete } from "../utils/api";

// Use Vite's env variable for backend URL; fallback to localhost for development.
const backendUrl = import.meta.env.VITE_BACKEND_URL || "http://localhost:5001";

function Flashcards({ selectedSong, setSelectedSong, isLoggedIn, setIsLoggedIn }) {
  const navigate = useNavigate();
  const [flashcards, setFlashcards] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [toast, setToast] = useState({ show: false, message: "", type: "error" });
  const [logging, setLogging] = useState(false);
  const [isLoadingCards, setIsLoadingCards] = useState(false);
  const [sentiment, setSentiment] = useState(null);
  const [sentimentLoading, setSentimentLoading] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState("auto");
  const [detectedLanguage, setDetectedLanguage] = useState(null);
  const [spotifyConnected, setSpotifyConnected] = useState(false);
  
  // Check authentication and redirect if not logged in
  useEffect(() => {
    if (!isAuthenticated()) {
      setToast({
        show: true,
        message: "Please log in to access this feature",
        type: "warning"
      });
      navigate("/login");
    }
  }, [navigate]);
  
  // Check Spotify connection based on user ID
  useEffect(() => {
    const spotifyTokens = getSpotifyTokens();
    setSpotifyConnected(!!spotifyTokens);
  }, [isLoggedIn]);
  
  // Handle Spotify login
  const handleSpotifyLogin = () => {
    const userId = getUserId();
    if (!userId) {
      setToast({
        show: true,
        message: "You must log in to connect Spotify",
        type: "error"
      });
      navigate("/login");
      return;
    }
    
    // Redirect to Spotify login with userId included
    window.location.href = `${backendUrl}/api/spotify/login?userId=${userId}`;
  };
  
  // Handle Spotify logout
  const handleSpotifyLogout = async () => {
    try {
      // Clear history on Spotify disconnect
      await apiDelete(`${backendUrl}/api/songs/clear`);
      
      // Clear Spotify tokens but keep user logged in
      localStorage.removeItem(`spotify_access_token:${getUserId()}`);
      localStorage.removeItem(`spotify_refresh_token:${getUserId()}`);
      localStorage.removeItem("spotify_access_token");
      localStorage.removeItem("spotify_refresh_token");
      
      // Update UI state
      setSpotifyConnected(false);
      setFlashcards([]);
      setSentiment(null);
      setSelectedSong(null);
      
      setToast({
        show: true,
        message: "Disconnected from Spotify",
        type: "info"
      });
    } catch (error) {
      console.error("Error clearing history on logout:", error);
      setToast({
        show: true,
        message: "Error disconnecting: " + error.message,
        type: "error"
      });
    }
  };
  
  // Enhanced fetchFlashcards with user-specific handling
  const fetchFlashcards = async () => {
    if (!selectedSong) return;
    
    setIsLoadingCards(true);
    
    try {
      // Construct URL with language parameter
      let url = `${backendUrl}/api/songs/flashcards?song=${encodeURIComponent(selectedSong.song)}`;
      if (selectedLanguage !== "auto") {
        url += `&lang=${selectedLanguage}`;
      }
      
      // Add user ID for server-side validation
      const userId = getUserId();
      if (userId) {
        url += `&userId=${userId}`;
      }
      
      const data = await apiGet(url);
      
      if (data.error) {
        throw new Error(data.error);
      }
      
      setFlashcards(data);
      
      // Update detected language
      if (data.length > 0 && data[0].detectedLanguage) {
        setDetectedLanguage(data[0].detectedLanguage);
      }
    } catch (error) {
      console.error("Error fetching flashcards:", error);
      setToast({
        show: true,
        message: error.message || "Failed to load flashcards",
        type: "error"
      });
      
      // If unauthorized, might need to redirect to login
      if (error.message.includes("Authentication") || error.message.includes("401")) {
        setIsLoggedIn(false);
        navigate("/login");
      }
    } finally {
      setIsLoadingCards(false);
    }
  };
  
  // Fetch flashcards when song or language changes
  useEffect(() => {
    if (selectedSong && isAuthenticated()) {
      fetchFlashcards();
    }
  }, [selectedSong, selectedLanguage]);
  
  // Fetch sentiment analysis with user-specific validation
  useEffect(() => {
    if (selectedSong && flashcards.length > 0 && isAuthenticated()) {
      setSentimentLoading(true);
      
      const fetchSentiment = async () => {
        try {
          // Construct the URL
          let url = `${backendUrl}/api/songs/sentiment?song=${encodeURIComponent(selectedSong.song)}`;
          if (selectedSong.artist) {
            url += `&artist=${encodeURIComponent(selectedSong.artist)}`;
          }
          
          // Add user ID to validate on server
          const userId = getUserId();
          if (userId) {
            url += `&userId=${userId}`;
          }
          
          const data = await apiGet(url);
          setSentiment(data);
        } catch (error) {
          console.error("Error fetching sentiment:", error);
          
          // Provide a fallback sentiment when the API fails
          setSentiment({
            sentiment: "Neutral",
            emoji: "😐",
            score: "0.50",
            emotions: [],
            primaryEmotion: "Unknown",
            emotionScore: "0.00",
            fallback: true,
            error: error.message || "Failed to analyze sentiment",
            songMetadata: {
              title: selectedSong.song,
              artist: selectedSong.artist || "Unknown Artist"
            }
          });
          
          setToast({
            show: true,
            message: "Sentiment analysis issue: " + error.message,
            type: "warning"
          });
        } finally {
          setSentimentLoading(false);
        }
      };
      
      fetchSentiment();
    }
  }, [selectedSong, flashcards.length]);
  
  // Log current song with user-specific validation
  const logCurrentSong = async () => {
    setLogging(true);
    
    try {
      if (!isAuthenticated()) {
        setToast({
          show: true,
          message: "You need to be logged in to save songs",
          type: "error"
        });
        navigate("/login");
        return;
      }
      
      const spotifyTokens = getSpotifyTokens();
      if (!spotifyTokens) {
        setToast({
          show: true,
          message: "You need to connect to Spotify first!",
          type: "error"
        });
        return;
      }
      
      // Fetch the currently playing song from Spotify
      const response = await fetch(
        `${backendUrl}/api/spotify/current-song?accessToken=${spotifyTokens.accessToken}&refreshToken=${spotifyTokens.refreshToken}&userId=${getUserId()}`
      );
      
      if (!response.ok) {
        const errorData = await response.json();
        
        // Handle token refresh if needed
        if (response.status === 401 || (errorData && errorData.authExpired)) {
          setToast({
            show: true,
            message: "Your Spotify session has expired. Please reconnect.",
            type: "error"
          });
          
          // Clear tokens
          localStorage.removeItem(`spotify_access_token:${getUserId()}`);
          localStorage.removeItem(`spotify_refresh_token:${getUserId()}`);
          setSpotifyConnected(false);
          return;
        }
        
        throw new Error(errorData?.error || "Error connecting to Spotify");
      }
      
      const currentData = await response.json();
      
      // If new tokens were returned, update them
      if (currentData.newAccessToken) {
        storeSpotifyTokens(currentData.newAccessToken, spotifyTokens.refreshToken);
      }
      
      if (currentData.song) {
        // Log the song to user's history
        const logData = await apiPost(`${backendUrl}/api/songs/log`, {
          song: currentData.song, 
          artist: currentData.artist
        });
        
        // Reset language for new song
        setSelectedLanguage("auto");
        setIsLoadingCards(true);
        
        // Show success message
        setToast({
          show: true,
          message: `🎵 Logged: ${logData.song.song} by ${logData.song.artist}`,
          type: "success"
        });
        
        // Update selected song
        setSelectedSong(logData.song);
        
        // Force flashcards data to reload
        setFlashcards([]);
      } else {
        setToast({
          show: true,
          message: "No song currently playing!",
          type: "info"
        });
      }
    } catch (err) {
      console.error("Error logging song:", err);
      setToast({
        show: true,
        message: err.message || "Error logging song",
        type: "error"
      });
    } finally {
      setLogging(false);
    }
  };
  
  // Rest of the component remains unchanged...
  
  return (
    <div className="flashcards-container">
      <div className="flashcards-content">
        {/* Title */}
        <motion.h1 
          className="flashcards-title"
          variants={textVariants}
          initial="initial"
          animate="animate"
          transition={{ duration: 0.3 }}
        >
          Flashcards for {selectedSong ? selectedSong.song : "Unknown Song"}
        </motion.h1>

        {/* Spotify Authentication Button */}
        <motion.div 
          className="spotify-auth-container"
          variants={textVariants}
          initial="initial"
          animate="animate"
          transition={{ duration: 0.3, delay: 0.05 }}
        >
          {isLoggedIn ? (
            spotifyConnected ? (
              <button className="spotify-auth-button connected" onClick={handleSpotifyLogout}>
                Disconnect from Spotify
              </button>
            ) : (
              <button className="spotify-auth-button" onClick={handleSpotifyLogin}>
                Connect to Spotify
              </button>
            )
          ) : (
            <button 
              className="spotify-auth-button spotify-auth-button-disabled" 
              onClick={() => navigate("/login")}
            >
              <span className="lock-icon">🔒</span> Connect to Spotify
            </button>
          )}
        </motion.div>

        {/* Log Current Song Button */}
        <motion.div 
          className="log-button-wrapper"
          variants={textVariants}
          initial="initial"
          animate="animate"
          transition={{ duration: 0.3, delay: 0.1 }}
        >
          {isLoggedIn ? (
            spotifyConnected ? (
              <button className="log-song-button" onClick={logCurrentSong} disabled={logging}>
                {logging ? <LoadingSpinner size={20} color="#fff" /> : "🎵 Log Current Song"}
              </button>
            ) : (
              <button 
                className="log-song-button log-song-button-disabled" 
                onClick={() => setToast({
                  show: true,
                  message: "Please connect to Spotify to access this feature",
                  type: "info"
                })}
              >
                <span className="lock-icon">🔒</span> Log Current Song
              </button>
            )
          ) : (
            <button 
              className="log-song-button log-song-button-disabled" 
              onClick={() => navigate("/login")}
            >
              <span className="lock-icon">🔒</span> Log Current Song
            </button>
          )}
        </motion.div>

        {/* Language Selection Dropdown */}
        <motion.div
          className={`language-selection-container ${!isLoggedIn ? 'not-logged-in' : ''}`}
          variants={textVariants}
          initial="initial"
          animate="animate"
          transition={{ duration: 0.3, delay: 0.15 }}
        >
          <label htmlFor="language-select">Source Language: </label>
          <div className="select-wrapper">
            <select 
              id="language-select" 
              value={selectedLanguage}
              onChange={(e) => setSelectedLanguage(e.target.value)}
              disabled={isLoadingCards || !selectedSong}
              className="language-select"
            >
              {LANGUAGE_OPTIONS.map(lang => (
                <option key={lang.code} value={lang.code}>
                  {lang.name}
                </option>
              ))}
            </select>
          </div>
          
          {detectedLanguage && selectedLanguage === "auto" && (
            <div className="detected-language-label">
              Detected: {LANGUAGE_OPTIONS.find(l => l.code === detectedLanguage)?.name || detectedLanguage}
            </div>
          )}
        </motion.div>

        {/* Flashcard Display */}
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

        {/* Flashcard Navigation */}
        <motion.div 
          className="flashcard-controls"
          variants={textVariants}
          initial="initial"
          animate="animate"
          transition={{ duration: 0.3, delay: 0.2 }}
        >
          <button 
            className="nav-button" 
            onClick={() => {
              if (flashcards.length > 0) {
                setCurrentIndex((prev) => (prev === 0 ? flashcards.length - 1 : prev - 1));
                setFlipped(false);
              }
            }}
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
            onClick={() => {
              if (flashcards.length > 0) {
                setCurrentIndex((prev) => (prev + 1) % flashcards.length);
                setFlipped(false);
              }
            }}
            disabled={isLoadingCards || flashcards.length === 0}
          >
            &#8594; {/* Right Arrow */}
          </button>
        </motion.div>

        {/* Sentiment Analysis Display */}
        <motion.div 
          className="sentiment-container"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
          <h3 className="sentiment-title">Song Mood Analysis</h3>
          
          {!isLoggedIn ? (
            <div className="sentiment-unauthenticated">
              <div className="sentiment-lock-icon">🔒</div>
              <p className="sentiment-login-message">Log in to access song mood analysis</p>
            </div>
          ) : !spotifyConnected ? (
            <div className="sentiment-unauthenticated">
              <div className="sentiment-lock-icon">🔒</div>
              <p className="sentiment-login-message">Connect to Spotify to access song mood analysis</p>
            </div>
          ) : sentimentLoading ? (
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
            <div className="sentiment-unavailable">
              {selectedSong ? 
                "Mood analysis unavailable for this song" : 
                "Select or log a song to see mood analysis"
              }
            </div>
          )}
        </motion.div>

        <Toast message={toast.message} type={toast.type} onClose={() => setToast({ ...toast, show: false })} />
      </div>
    </div>
  );
}

// Enhanced LoadingEllipsis Component
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

// Empty Flashcard State Component
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

// Language options constant
const LANGUAGE_OPTIONS = [
  { code: "auto", name: "Auto-detect" },
  { code: "ES", name: "Spanish" },
  { code: "FR", name: "French" },
  { code: "PT", name: "Portuguese" },
  { code: "IT", name: "Italian" },
  { code: "DE", name: "German" },
  { code: "JA", name: "Japanese" },
  { code: "ZH", name: "Chinese" },
  { code: "RU", name: "Russian" },
  { code: "KO", name: "Korean" }
];

// Animation variants
const textVariants = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 }
};

export default Flashcards;