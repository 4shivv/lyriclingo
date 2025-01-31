import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Navbar from "./components/Navbar";
import Home from "./pages/Home";
import Flashcards from "./pages/Flashcards";
import History from "./pages/History";
import Login from "./pages/Login"; 

function App() {
  
  return (
    <Router>
      <Navbar />
      <div className="page-container">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/flashcards" element={<Flashcards />} />
          <Route path="/history" element={<History />} />
          <Route path="/login" element={<Login />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
