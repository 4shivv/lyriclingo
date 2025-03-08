import React, { useState, useEffect, useRef } from "react";
import "../styles/Flashcards.css";
import Toast from "../components/Toast";
import LoadingSpinner from "../components/LoadingSpinner";

import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";

// Use Vite's env variable for backend URL; fallback to localhost for development.
const backendUrl = import.meta.env.VITE_BACKEND_URL || "http://localhost:5001";

// Language options for the dropdown
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

function Flashcards({ selectedSong, setSelectedSong, isLoggedIn, setIsLoggedIn }) {
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
  const [selectedLanguage, setSelectedLanguage] = useState("auto");
  const [detectedLanguage, setDetectedLanguage] = useState(null);

  // State to track navigation intervals
  const [navInterval, setNavInterval] = useState(null);
  
  // Add these state variables to track long press
  const [isLongPress, setIsLongPress] = useState(false);
  const longPressTimer = useRef(null);
  const LONG_PRESS_THRESHOLD = 300; // milliseconds

  // Spotify-specific state, completely independent from navbar auth
  const [spotifyConnected, setSpotifyConnected] = useState(false);
  
  // Check if user is connected to Spotify on component mount
  useEffect(() => {
    const spotifyToken = localStorage.getItem("spotify_access_token");
    if (spotifyToken) {
      setSpotifyConnected(true);
    }
    
    // Listen for Spotify token changes (for cross-component updates)
    const handleStorageChange = (e) => {
      if (e.key === "spotify_access_token") {
        setSpotifyConnected(!!e.newValue);
      }
    };
    
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  // Handle Spotify login - independent from navbar auth
  const handleSpotifyLogin = () => {
    // Get user ID from JWT token
    const token = localStorage.getItem('token');
    if (!token) {
      setToast({
        show: true,
        message: "You must log in to connect Spotify",
        type: "error"
      });
      return;
    }
    
    // Decode token to get userId (can also be handled by backend)
    try {
      const tokenData = JSON.parse(atob(token.split('.')[1]));
      const userId = tokenData.id;
      
      // Redirect to Spotify login with userId included
      window.location.href = `${backendUrl}/api/spotify/login?userId=${userId}`;
    } catch (error) {
      console.error("Error parsing token:", error);
      setToast({
        show: true,
        message: "Authentication error. Please log in again.",
        type: "error"
      });
    }
  };

  // Handle Spotify logout - only affects Spotify connection, not overall auth
  const handleSpotifyLogout = async () => {
    try {
      await fetch(`${backendUrl}/api/songs/clear`, { method: "DELETE" });
    } catch (error) {
      console.error("Error clearing history on logout:", error);
    }
    
    // Only remove Spotify tokens, not overall auth
    localStorage.removeItem("spotify_access_token");
    localStorage.removeItem("spotify_refresh_token");
    
    // Update Spotify connection state
    setSpotifyConnected(false);
    setFlashcards([]);
    setSentiment(null);
    
    // Show toast notification
    setToast({
      show: true,
      message: "Disconnected from Spotify",
      type: "info"
    });
  };

  // Modified navigation functions
  const handleMouseDown = (direction) => {
    if (flashcards.length === 0 || isLoadingCards) return;
    
    // Clear any existing timers
    if (longPressTimer.current) clearTimeout(longPressTimer.current);
    
    // Set a timer to detect long press
    longPressTimer.current = setTimeout(() => {
      setIsLongPress(true);
      startContinuousNavigation(direction);
    }, LONG_PRESS_THRESHOLD);
  };

  const handleMouseUp = () => {
    // Clear the long press timer
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
    
    // Stop navigation if it was a long press
    if (isLongPress) {
      stopContinuousNavigation();
      setIsLongPress(false);
    }
    // Single tap is handled by onClick, not here
  };

  // The onClick handlers remain unchanged
  const navigatePrevious = () => {
    if (!isLongPress && flashcards.length > 0) {
      setCurrentIndex((prev) => (prev === 0 ? flashcards.length - 1 : prev - 1));
      setFlipped(false);
    }
  };

  const navigateNext = () => {
    if (!isLongPress && flashcards.length > 0) {
      setCurrentIndex((prev) => (prev + 1) % flashcards.length);
      setFlipped(false);
    }
  };

  // Modified startContinuousNavigation to not perform initial navigation
  const startContinuousNavigation = (direction) => {
    if (flashcards.length === 0 || isLoadingCards) return;
    
    // Clear any existing interval
    if (navInterval) clearInterval(navInterval);
    
    // Set up interval for continuous navigation
    const interval = setInterval(() => {
      if (direction === 'previous') {
        setCurrentIndex((prev) => (prev === 0 ? flashcards.length - 1 : prev - 1));
      } else {
        setCurrentIndex((prev) => (prev + 1) % flashcards.length);
      }
      setFlipped(false);
    }, 250);
    
    setNavInterval(interval);
  };

  // Function to stop continuous navigation
  const stopContinuousNavigation = () => {
    if (navInterval) {
      clearInterval(navInterval);
      setNavInterval(null);
    }
  };

  // Fetch flashcards based on selected language
  const fetchFlashcards = () => {
    if (!selectedSong) return;
    
    setIsLoadingCards(true);
    
    // Get JWT token - Try both localStorage and sessionStorage
    const token = localStorage.getItem("token") || sessionStorage.getItem("auth_token");
    
    if (!token) {
      setToast({
        show: true,
        message: "Authentication required. Please log in again.",
        type: "error"
      });
      setIsLoadingCards(false);
      navigate("/login"); // Redirect to login page
      return;
    }
    
    // Store token in both places for consistency
    localStorage.setItem("token", token);
    sessionStorage.setItem("auth_token", token);
    
    // Construct URL with language parameter if not auto-detect
    let url = `${backendUrl}/api/songs/flashcards?song=${encodeURIComponent(selectedSong.song)}`;
    if (selectedLanguage !== "auto") {
      url += `&lang=${selectedLanguage}`;
    }
    
    fetch(url, {
      headers: {
        "Authorization": `Bearer ${token}`
      }
    })
      .then(res => {
        if (!res.ok) {
          if (res.status === 401) {
            // Handle authentication error specifically
            localStorage.removeItem("token");
            sessionStorage.removeItem("auth_token");
            setIsLoggedIn(false);
            sessionStorage.setItem("app_logged_out", "true");
            throw new Error("Authentication expired. Please log in again.");
          }
          throw new Error(`Failed to fetch flashcards: ${res.status}`);
        }
        return res.json();
      })
      .then(data => {
        if (data.error) {
          throw new Error(data.error);
        } 
        setFlashcards(data);
        
        // If response includes detected language info, update state
        if (data.length > 0 && data[0].detectedLanguage) {
          setDetectedLanguage(data[0].detectedLanguage);
        }
        setIsLoadingCards(false);
      })
      .catch(error => {
        console.error("Error fetching flashcards:", error);
        setToast({
          show: true,
          message: error.message || "Failed to load flashcards",
          type: "error"
        });
        setIsLoadingCards(false);
      });
  };

  // Clean up interval on component unmount
  useEffect(() => {
    return () => {
      if (navInterval) clearInterval(navInterval);
    };
  }, [navInterval]);

  // Effect for fetching flashcards when song or language changes
  useEffect(() => {
    if (selectedSong) {
      fetchFlashcards();
    }
  }, [selectedSong, selectedLanguage]);

  // Handle language change
  const handleLanguageChange = (e) => {
    const newLanguage = e.target.value;
    setSelectedLanguage(newLanguage);
    setIsLoadingCards(true);
    setCurrentIndex(0);
    setFlipped(false);
  };

  useEffect(() => {
    if (selectedSong && flashcards.length > 0) {
      setSentimentLoading(true);
      
      // Retrieve JWT token
      const token = localStorage.getItem("token") || sessionStorage.getItem("auth_token");
      
      if (!token) {
        setSentimentLoading(false);
        setSentiment(null);
        setToast({
          show: true,
          message: "Authentication required to analyze sentiment",
          type: "error"
        });
        return;
      }
      
      // Store token in both places for consistency
      localStorage.setItem("token", token);
      sessionStorage.setItem("auth_token", token);
      
      // Construct the URL with song and artist parameters
      let url = `${backendUrl}/api/songs/sentiment?song=${encodeURIComponent(selectedSong.song)}`;
      if (selectedSong.artist) {
        url += `&artist=${encodeURIComponent(selectedSong.artist)}`;
      }
      
      fetch(url, {
        headers: {
          "Authorization": `Bearer ${token}`
        }
      })
        .then(res => {
          if (!res.ok) {
            if (res.status === 401) {
              localStorage.removeItem("token");
              sessionStorage.removeItem("auth_token");
              setIsLoggedIn(false);
              sessionStorage.setItem("app_logged_out", "true");
              throw new Error("Authentication expired. Please log in again.");
            }
            throw new Error(`Sentiment analysis failed: ${res.status}`);
          }
          return res.json();
        })
        .then(data => {
          setSentiment(data);
          setSentimentLoading(false);
        })
        .catch(error => {
          console.error("Error fetching sentiment:", error);
          setSentimentLoading(false);
          setToast({
            show: true,
            message: "Failed to load sentiment analysis: " + error.message,
            type: "error"
          });
        });
    }
  }, [selectedSong, flashcards.length, backendUrl]);

  // Function to log the current song
  const logCurrentSong = async () => {
    setLogging(true);
    
    // Check authentication first
    const jwtToken = localStorage.getItem("token") || sessionStorage.getItem("auth_token");
    if (!jwtToken) {
      setToast({
        show: true,
        message: "You need to be logged in to save songs. Please log in first.",
        type: "error"
      });
      setLogging(false);
      navigate("/login");
      return;
    }

    // Then check Spotify connection
    const accessToken = localStorage.getItem("spotify_access_token");
    const refreshToken = localStorage.getItem("spotify_refresh_token");
    
    if (!accessToken || !refreshToken) {
      setToast({
        show: true,
        message: "You need to connect to Spotify first!",
        type: "error"
      });
      setLogging(false);
      return;
    }
    
    try {
      // Fetch the currently playing song from Spotify
      const currentResponse = await fetch(
        `${backendUrl}/api/spotify/current-song?accessToken=${accessToken}&refreshToken=${refreshToken}`
      );
      
      // Handle potential errors with better user feedback
      if (!currentResponse.ok) {
        const errorData = await currentResponse.json();
        
        // Handle specific error cases
        if (currentResponse.status === 401 || (errorData && errorData.authExpired)) {
          setToast({
            show: true,
            message: "Your Spotify session has expired. Please log in again.",
            type: "error"
          });
          
          // Update Spotify connection state on auth expiration
          localStorage.removeItem("spotify_access_token");
          localStorage.removeItem("spotify_refresh_token");
          setSpotifyConnected(false);
          
        } else if (errorData && errorData.scopeIssue) {
          setToast({
            show: true,
            message: "Your Spotify account needs additional permissions. Please log in again.",
            type: "error"
          });
          
          // Update Spotify connection state on scope issues
          localStorage.removeItem("spotify_access_token");
          localStorage.removeItem("spotify_refresh_token");
          setSpotifyConnected(false);
          
        } else if (currentResponse.status === 429) {
          setToast({
            show: true,
            message: "Too many requests to Spotify. Please try again in a moment.",
            type: "warning"
          });
          
        } else if (currentResponse.status === 412 || (errorData && errorData.noActiveDevice)) {
          setToast({
            show: true,
            message: "No active Spotify playback found. Please start playing music in your Spotify app.",
            type: "warning"
          });
          
        } else if (currentResponse.status === 404) {
          setToast({
            show: true,
            message: "No song currently playing on Spotify.",
            type: "info"
          });
          
        } else {
          setToast({
            show: true,
            message: errorData?.error || "Error connecting to Spotify. Please try again.",
            type: "error"
          });
        }
        
        setLogging(false);
        return;
      }
      
      // Process successful response
      const currentData = await currentResponse.json();
      
      if (currentData.song) {
        // Log the song in your history by posting it to your API
        const logResponse = await fetch(`${backendUrl}/api/songs/log`, {
          method: "POST",
          headers: { 
            "Content-Type": "application/json",
            "Authorization": `Bearer ${jwtToken}`  // Add the JWT token here
          },
          body: JSON.stringify(currentData)
        });
        
        if (!logResponse.ok) {
          const logError = await logResponse.json();
          setToast({ 
            show: true, 
            message: logError.error || "Failed to log song", 
            type: "error" 
          });
          setLogging(false);
          return;
        }
        
        const logData = await logResponse.json();

        // Reset language to auto-detect for new song
        setSelectedLanguage("auto");
        
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

        // Also trigger history refresh if user visits history page
        sessionStorage.setItem("refresh_history", "true");

        // Force flashcards data to reload
        setIsLoadingCards(true);
        setFlashcards([]);
        fetchFlashcards();
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
        message: "Network error while fetching current song.",
        type: "error"
      });
    } finally {
      setLogging(false);
    }
  };

  // Add at the start of your component
  useEffect(() => {
    // Check authentication on component mount
    const token = localStorage.getItem("token");
    if (!token) {
      setToast({
        show: true,
        message: "Please log in to access this feature",
        type: "warning"
      });
      navigate("/login");
    }
  }, []);

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

        {/* Integrated Spotify Auth Button with toggle functionality */}
        <motion.div 
          className="spotify-auth-container"
          variants={textVariants}
          initial="initial"
          animate="animate"
          transition={{ duration: 0.3, delay: 0.05 }}
        >
          {isLoggedIn ? (
            // Spotify connection button logic (already implemented)
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
              onClick={() => setToast({
                show: true,
                message: "Please log in to connect Spotify",
                type: "info"
              })}
            >
              <span className="lock-icon">🔒</span> Connect to Spotify
            </button>
          )}
        </motion.div>

        {/* Log Current Song Button - uses spotifyConnected state */}
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
              onClick={() => {
                setToast({
                  show: true,
                  message: "Please log in to access this feature",
                  type: "info"
                });
                navigate("/login");
              }}
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
              onChange={handleLanguageChange}
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
            onClick={navigatePrevious}
            onMouseDown={() => handleMouseDown('previous')}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            onTouchStart={() => handleMouseDown('previous')}
            onTouchEnd={handleMouseUp}
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
            onClick={navigateNext}
            onMouseDown={() => handleMouseDown('next')}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            onTouchStart={() => handleMouseDown('next')}
            onTouchEnd={handleMouseUp}
            disabled={isLoadingCards || flashcards.length === 0}
          >
            &#8594; {/* Right Arrow */}
          </button>
        </motion.div>

        {/* Sentiment Analysis Display with Emotions */}
        <motion.div 
          className="sentiment-container"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
          <h3 className="sentiment-title">Song Mood Analysis</h3>
          
          {!spotifyConnected ? (
            <div className="sentiment-unauthenticated">
              <div className="sentiment-lock-icon">🔒</div>
              <p className="sentiment-login-message">Connect to Spotify to access song mood analysis</p>
              <p className="sentiment-feature-description">
                Discover the emotional tones and primary feelings behind your favorite songs
              </p>
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

export default Flashcards;