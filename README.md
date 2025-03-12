# LyricLingo

The application is deployed at https://lyriclingo.vercel.app/.

LyricLingo is an interactive web application that helps users learn new languages through music. By integrating with Spotify, LyricLingo allows users to log songs, view translated lyrics, create flashcards, and analyze song sentiment.

## Features

- Spotify integration to log currently playing songs
- Translation of song lyrics into multiple languages
- Flashcard creation for language learning
- Sentiment analysis of translated lyrics
- User authentication and personalized song history
- Responsive design for mobile and desktop

## Tech Stack

- **Frontend:** React, React Router, Framer Motion, Vite
- **Backend:** Node.js, Express, MongoDB, Redis
- **External APIs:** Spotify API, DeepL API, Genius Lyrics API

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org) (v14 or higher)
- [MongoDB](https://www.mongodb.com)
- [Redis](https://redis.io)

### Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/your-username/lyriclingo.git
   cd lyriclingo

2. **Install dependencies:**
  ```bash
    npm install

3. **Set up environment variables:**

- Create a .env file in the root directory
- Add the following variables:
  ``` bash
      MONGO_URI=your-mongodb-uri
      JWT_SECRET=your-jwt-secret
      SPOTIFY_CLIENT_ID=your-spotify-client-id
      SPOTIFY_CLIENT_SECRET=your-spotify-client-secret
      SPOTIFY_REDIRECT_URI=your-spotify-redirect-uri
      GENIUS_ACCESS_TOKEN=your-genius-access-token
      DEEPL_API_KEY=your-deepl-api-key
      REDIS_URL=your-redis-url

### Development

1. **Start the backend server:**
```bash 
    cd src/backend
    node server.js
 
2.  **Start the frontend development server:**
  ```bash 
    cd ../
    npm run dev

3. **Open your browser** and visit http://localhost:5173 to see the application.