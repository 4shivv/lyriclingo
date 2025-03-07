import React, { useRef } from "react";
import { motion, useInView } from "framer-motion";
import { Link, useNavigate } from "react-router-dom";
import "../styles/Home.css";

function Home() {
  // Create refs for scroll-triggered animations
  const featuresRef = useRef(null);
  const languagesRef = useRef(null);
  const navigate = useNavigate();
  
  // Use inView hook to detect when elements are in viewport
  const featuresInView = useInView(featuresRef, { 
    once: true, 
    amount: 0.2 // Trigger when 20% visible
  });
  
  const languagesInView = useInView(languagesRef, { 
    once: true, 
    amount: 0.2 
  });

  // Navigation handler
  const handleGetStarted = () => {
    navigate("/login");
  };
  
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

  return (
    <div className="home-container">
      {/* Hero Section - No changes to initial animations */}
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
                onClick={handleGetStarted}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M5 12H19M19 12L12 5M19 12L12 19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                Get Started
              </button>
              
              <Link to="/flashcards" className="secondary-cta">
                Try Flashcards
              </Link>
            </motion.div>
            
            {/* Social Links in hero section */}
            <motion.div 
              className="social-links-container"
              variants={itemVariants}
            >
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

      {/* Features Section - Now with scroll-triggered animations */}
      <motion.div 
        ref={featuresRef}
        className="features-section"
        initial={{ opacity: 0, y: 40 }}
        animate={featuresInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 40 }}
        transition={{ duration: 0.6 }}
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
              animate={featuresInView ? 
                { opacity: 1, y: 0, transition: { delay: 0.1 + (index * 0.2) } } : 
                { opacity: 0, y: 20 }
              }
            >
              <div className="feature-icon">{feature.icon}</div>
              <h3 className="feature-title">{feature.title}</h3>
              <p className="feature-description">{feature.description}</p>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* Language Section - Now with scroll-triggered animations */}
      <motion.div 
        ref={languagesRef}
        className="language-section"
        initial={{ opacity: 0 }}
        animate={languagesInView ? { opacity: 1 } : { opacity: 0 }}
        transition={{ duration: 0.8 }}
      >
        <h2 className="languages-title">Supported Languages</h2>
        <div className="languages-container">
          {["Spanish", "French", "Portuguese", "Italian", "German", "Japanese", "Chinese", "Russian", "Korean"].map((language, index) => (
            <motion.div 
              key={language}
              className="language-badge"
              initial={{ opacity: 0, y: 20 }}
              animate={languagesInView ? 
                { opacity: 1, y: 0, transition: { delay: 0.1 + (index * 0.05) } } : 
                { opacity: 0, y: 20 }
              }
            >
              {language}
            </motion.div>
          ))}
        </div>
      </motion.div>
    </div>
  );
}

export default Home;