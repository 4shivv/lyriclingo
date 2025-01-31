import React from "react";
import "../styles/Home.css";

function Home() {
  return (
    <div className="home-container">
      <div className="home-content">
        <h1 className="home-title">Welcome to LyricLingo</h1>
        <p className="home-subtitle">
          Learn languages through your favorite songs.
        </p>
        <p className="home-description">
          Connect your Spotify account to discover, translate, and create flashcards from song lyrics.
        </p>
        <button className="connect-button">Connect to Spotify</button>
      </div>
    </div>
  );
}

export default Home;
