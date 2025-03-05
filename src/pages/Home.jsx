import React from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import "../styles/Home.css";

function Home() {
  // Read the backend URL from Vite's environment variables
  const backendUrl = import.meta.env.VITE_BACKEND_URL || "http://localhost:5001";

  // Animation variants for staggered animations
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        delayChildren: 0.3,
        staggerChildren: 0.2
      }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: { duration: 0.5, ease: "easeOut" }
    }
  };

  // Feature cards data
  const features = [
    {
      icon: "🎵",
      title: "Song Translation",
      description: "Convert lyrics from foreign languages to English instantly"
    },
    {
      icon: "📝",
      title: "Flashcard Learning",
      description: "Create study flashcards from any song to practice vocabulary"
    },
    {
      icon: "🔍",
      title: "Mood Analysis",
      description: "Discover the emotional tone and sentiment behind lyrics"
    }
  ];

  // Handle Spotify login
  const handleSpotifyLogin = () => {
    window.location.href = `${backendUrl}/api/spotify/login`;
  };

  return (
    <div className="home-container">
      {/* Hero Section */}
      <div className="home-hero">
        <motion.div 
          className="hero-content"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8 }}
        >
          <motion.div
            className="hero-text-container"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
          >
            <motion.h1 
              className="hero-title"
              variants={itemVariants}
            >
              Learn Languages <span className="highlight">Through Music</span>
            </motion.h1>
            
            <motion.p 
              className="hero-tagline"
              variants={itemVariants}
            >
              Discover a new rhythm for language learning
            </motion.p>
            
            <motion.p 
              className="hero-description"
              variants={itemVariants}
            >
              LyricLingo transforms your favorite songs into powerful language learning tools with instant translations and interactive flashcards.
            </motion.p>
            
            <motion.div 
              className="hero-cta-container"
              variants={itemVariants}
            >
              <button 
                className="primary-cta" 
                onClick={handleSpotifyLogin}
              >
                <img src="/Spotify_Primary_Logo_RGB_Green.png" alt="Spotify" className="cta-icon" />
                Connect with Spotify
              </button>
              
              <Link to="/flashcards" className="secondary-cta">
                Try Flashcards
              </Link>
            </motion.div>
          </motion.div>
          
          <motion.div 
            className="hero-image-container"
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.5, duration: 0.8 }}
          >
            <div className="hero-image">
              <div className="floating-card card1">
                <div className="card-lyric">Despacito</div>
                <div className="card-translation">Slowly</div>
              </div>
              <div className="floating-card card2">
                <div className="card-lyric">La vie en rose</div>
                <div className="card-translation">Life in pink</div>
              </div>
              <div className="floating-card card3">
                <div className="card-lyric">Volare</div>
                <div className="card-translation">To fly</div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      </div>

      {/* Features Section */}
      <motion.div 
        className="features-section"
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.8, duration: 0.6 }}
      >
        <h2 className="features-title">How LyricLingo Works</h2>
        
        <div className="features-container">
          {features.map((feature, index) => (
            <motion.div 
              className="feature-card" 
              key={index}
              whileHover={{ 
                y: -10, 
                boxShadow: "0 10px 25px rgba(0, 0, 0, 0.2)" 
              }}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.9 + (index * 0.2) }}
            >
              <div className="feature-icon">{feature.icon}</div>
              <h3 className="feature-title">{feature.title}</h3>
              <p className="feature-description">{feature.description}</p>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* Language Section */}
      <motion.div 
        className="language-section"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.4, duration: 0.8 }}
      >
        <h2 className="languages-title">Supported Languages</h2>
        <div className="languages-container">
          <div className="language-badge">Spanish</div>
          <div className="language-badge">French</div>
          <div className="language-badge">Portuguese</div>
          <div className="language-badge">Italian</div>
          <div className="language-badge">German</div>
          <div className="language-badge">Japanese</div>
          <div className="language-badge">Chinese</div>
          <div className="language-badge">Russian</div>
          <div className="language-badge">Korean</div>
        </div>
      </motion.div>

      {/* Footer / Social Section */}
      <div className="home-footer">
        <p className="footer-tagline">Start your musical language journey today</p>
        <motion.div 
          className="footer-cta"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.98 }}
        >
          <button className="primary-cta footer-button" onClick={handleSpotifyLogin}>
            <img src="/Spotify_Primary_Logo_RGB_Green.png" alt="Spotify" className="cta-icon" />
            Get Started for Free
          </button>
        </motion.div>
        
        <div className="social-links-container">
          <h3 className="social-links-title">Connect with the developer</h3>
          <div className="social-links">
            <motion.a 
              href="https://github.com/4shivv" 
              target="_blank" 
              rel="noopener noreferrer"
              whileHover={{ y: -5, scale: 1.1 }}
              transition={{ type: "spring", stiffness: 400 }}
            >
              <img src="/github-logo.png" alt="GitHub" className="social-icon" />
            </motion.a>
            <motion.a 
              href="https://www.linkedin.com/in/shivaganesh-nagamandla" 
              target="_blank" 
              rel="noopener noreferrer"
              whileHover={{ y: -5, scale: 1.1 }}
              transition={{ type: "spring", stiffness: 400 }}
            >
              <img src="/linkedin-logo.png" alt="LinkedIn" className="social-icon" />
            </motion.a>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Home;