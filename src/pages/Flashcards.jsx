import React, { useState } from "react";
import "../styles/Flashcards.css";

const sampleFlashcards = [
  { front: "Hola", back: "Hello" },
  { front: "Cómo estás?", back: "How are you?" },
  { front: "Gracias", back: "Thank you" },
];

function Flashcards({ isLoggedIn }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);

  const handleFlip = () => {
    setFlipped(!flipped);
  };

  const nextCard = () => {
    setFlipped(false);
    setCurrentIndex((prevIndex) => (prevIndex + 1) % sampleFlashcards.length);
  };

  const prevCard = () => {
    setFlipped(false);
    setCurrentIndex((prevIndex) =>
      prevIndex === 0 ? sampleFlashcards.length - 1 : prevIndex - 1
    );
  };

  return (
    <div className="flashcards-container">
      <h1 className="flashcards-title">Flashcards</h1>
      <p className="flashcards-subtitle">Click the card to flip 🔄</p>

      {isLoggedIn && (
        <button className="log-song-button">
          🎵 Log Current Song
        </button>
      )}

      <div className="flashcard-wrapper">
        <div className="flashcard-container">
          <div
            className={`flashcard ${flipped ? "flipped" : ""}`}
            onClick={handleFlip}
          >
            <div className="flashcard-face flashcard-front">
              {sampleFlashcards[currentIndex].front}
            </div>
            <div className="flashcard-face flashcard-back">
              {sampleFlashcards[currentIndex].back}
            </div>
          </div>
        </div>
      </div>

      <div className="flashcard-controls">
        <button className="nav-button" onClick={prevCard}>⬅️</button>
        <span>{currentIndex + 1} / {sampleFlashcards.length}</span>
        <button className="nav-button" onClick={nextCard}>➡️</button>
      </div>
    </div>
  );
}

export default Flashcards;
