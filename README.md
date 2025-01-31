# LyricLingo

## Overview
LyricLingo is a music-based language learning app that allows users to learn new languages by translating song lyrics into flashcards. The app integrates with Spotify to fetch the currently playing song, retrieves lyrics via the Genius API, translates lyrics using Google Translate, and organizes them into flashcards for interactive learning.

## Features
- **Spotify Authentication**: Log in with Spotify to fetch currently playing songs.
- **Fetch Lyrics**: Retrieve song lyrics using the Genius API.
- **Translate Lyrics**: Automatically translate lyrics line by line using Google Translate API.
- **Flashcard Generation**: Display translated lyrics as flashcards for language learning.
- **History Tracking**: Save previously translated songs for review.
- **Clear History**: Remove previously logged songs.

## Tech Stack
### **Frontend**
- **Framework:** React.js (Vite)
- **Styling:** CSS
- **State Management:** React Hooks (useState, useEffect)
- **Routing:** React Router
- **Animations:** CSS Transitions (Framer Motion optional)

### **Backend**
- **Framework:** Express.js (Node.js)
- **Authentication:** Spotify OAuth 2.0
- **APIs:**
  - **Spotify API** (fetch currently playing song)
  - **Genius API** (retrieve lyrics)
  - **Google Translate API** (translate lyrics line by line)
- **Database:** MongoDB (Mongoose) or PostgreSQL
- **Communication:** REST API for frontend-backend integration

## Installation & Setup
### **Backend**
1. Clone the repository:
   ```sh
   git clone https://github.com/yourusername/lyriclingo.git
   cd lyriclingo
   ```
2. Install backend dependencies:
   ```sh
   npm install
   ```
3. Create a `.env` file and add:
   ```sh
   PORT=5000
   SPOTIFY_CLIENT_ID=your_spotify_client_id
   SPOTIFY_CLIENT_SECRET=your_spotify_client_secret
   GENIUS_API_KEY=your_genius_api_key
   GOOGLE_TRANSLATE_API_KEY=your_google_translate_api_key
   ```
4. Start the backend server:
   ```sh
   node backend/server.js
   ```
5. Test the API:
   ```sh
   curl http://localhost:5000/ping
   ```

### **Frontend**
1. Navigate to the frontend directory:
   ```sh
   cd frontend
   ```
2. Install frontend dependencies:
   ```sh
   npm install
   ```
3. Start the frontend server:
   ```sh
   npm run dev
   ```
4. Open `http://localhost:5173/` in your browser.

## API Endpoints
### **Authentication**
- `GET /auth/spotify` - Redirects user to Spotify login.
- `GET /auth/callback` - Handles Spotify OAuth callback.

### **Song & Lyrics**
- `GET /song/current` - Fetches the currently playing song.
- `GET /lyrics/:songId` - Retrieves lyrics for a given song.
- `POST /translate` - Translates lyrics line by line.

### **History & Flashcards**
- `GET /history` - Fetches saved song translations.
- `POST /history` - Saves a translated song.
- `DELETE /history` - Clears all saved history.

## Future Enhancements
- **AI-Based Lyric Analysis** (Python microservice for deeper insights)
- **Speech Pronunciation (TTS Support)**
- **Offline Mode (IndexedDB Support)**
- **Multi-Language Support**

## License
MIT License

## Contributors
- **[Your Name]** - Developer

