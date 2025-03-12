# LyricLingo

The application is deployed at [LyricLingo](https://lyriclingo.vercel.app/).

LyricLingo is a full-stack web application that helps users learn new languages through music. By integrating with Spotify, LyricLingo allows users to log songs, view translated lyrics, create flashcards, and analyze song sentiment.

## 🌟 Features

- **Spotify Integration**: Log currently playing songs.
- **Lyrics Translation**: Translate song lyrics into multiple languages.
- **Flashcard Creation**: Generate flashcards for language learning.
- **Sentiment Analysis**: Analyze the sentiment of translated lyrics.
- **User Authentication**: Personalized song history and secure access.
- **Responsive Design**: Optimized for both mobile and desktop.

## 🛠️ Tech Stack

- **Frontend**: React, React Router, Framer Motion, Vite
- **Backend**: Node.js, Express, MongoDB, Redis
- **External APIs**: Spotify API, DeepL API, Genius Lyrics API

## 🚀 Getting Started

### Prerequisites

- [Node.js](https://nodejs.org) (v14 or higher)
- [MongoDB](https://www.mongodb.com)
- [Redis](https://redis.io)

### Installation

1. **Clone the Repository**:
   ```bash
   git clone https://github.com/your-username/lyriclingo.git
   cd lyriclingo
   ```

2. **Install Dependencies**:
   ```bash
   npm install
   ```

3. **Set Up Environment Variables**:
   - Create a `.env` file in the root directory.
   - Add the following variables:
     ```env
     MONGO_URI=your-mongodb-uri
     JWT_SECRET=your-jwt-secret
     SPOTIFY_CLIENT_ID=your-spotify-client-id
     SPOTIFY_CLIENT_SECRET=your-spotify-client-secret
     SPOTIFY_REDIRECT_URI=your-spotify-redirect-uri
     GENIUS_ACCESS_TOKEN=your-genius-access-token
     DEEPL_API_KEY=your-deepl-api-key
     REDIS_URL=your-redis-url
     HUGGINGFACE_API_TOKEN=

     ```

### Development

1. **Start the Backend Server**:
   ```bash
   cd src/backend
   node server.js
   ```

2. **Start the Frontend Development Server**:
   ```bash
   cd ../
   npm run dev
   ```

3. **Open Your Browser**:
   Visit [http://localhost:5173](http://localhost:5173) to see the application.


---

**Built for music lovers & language learners!** 🎶