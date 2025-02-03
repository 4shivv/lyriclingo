# LyricLingo

**LyricLingo** is a full-stack web application that fetches song lyrics, translates them, and generates flashcards for language learning. Users can log songs, view their history, and test themselves with flashcards generated from song lyrics.

## 🚀 Features

- **Fetch song lyrics** from Genius API
- **Translate lyrics** using DeepL API
- **Generate flashcards** from lyrics (original + translated)
- **Save song history** in MongoDB
- **Redis caching** for optimized API performance
- **Frontend built with React** (inside `src/`)
- **Backend powered by Node.js + Express**

---

## 🛠️ Installation

### **1️⃣ Clone the Repository**

```sh
git clone https://github.com/your-username/my-lyric-app.git 
cd my-lyric-app
```

### **2️⃣ Set Up Backend**

```sh
  cd backend
  npm install
```

#### **Environment Variables** (Create `.env` file inside `backend/`)

```env
GENIUS_ACCESS_TOKEN=your-genius-api-key
DEEPL_API_KEY=your-deepl-api-key
MONGO_URI=your-mongodb-connection-string
SPOTIFY_CLIENT_ID=your-spotify-client-id
SPOTIFY_CLIENT_SECRET=your-spotify-client-secret
SPOTIFY_REDIRECT_URI=http://localhost:5001/api/spotify/callback
```

#### **Run Backend**

```sh
  node server.js
```

> Backend runs on **[http://localhost:5001](http://localhost:5001)**

#### **Start Redis (If not running already)**

```sh
  redis-server
```

OR (if using Homebrew on macOS):

```sh
  brew services start redis
```

---

### **3️⃣ Set Up Frontend** (Inside `src/` but no separate frontend directory)

```sh
  npm install
```

#### **Run Frontend**

```sh
  npm run dev
```

> Frontend runs on **[http://localhost:5173/](http://localhost:5173/)**

---

## 📡 API Endpoints

### **1️⃣ Log a Song**

```http
POST /api/songs/log
```

**Request Body:**

```json
{
  "song": "BESO",
  "artist": "Rosalía & Rauw Alejandro"
}
```

**Response:**

```json
{
  "message": "Song logged successfully!",
  "song": {
    "song": "BESO",
    "artist": "Rosalía & Rauw Alejandro",
    "lyricsUrl": "https://genius.com/..."
  }
}
```

### **2️⃣ Get Song History**

```http
GET /api/songs/history
```

**Response:**

```json
[
  {
    "song": "BESO",
    "artist": "Rosalía & Rauw Alejandro"
  }
]
```

### **3️⃣ Fetch Flashcards**

```http
GET /api/songs/flashcards?song=BESO
```

**Response:**

```json
[
  { "front": "Ya yo necesito otro beso", "back": "Now I need another kiss" },
  { "front": "Uno de esos que tú me da'", "back": "One of those that you give me'" }
]
```

---

## 🛠️ Tech Stack

- **Frontend:** React, Tailwind CSS
- **Backend:** Node.js, Express
- **Database:** MongoDB Atlas
- **APIs Used:** Genius API, DeepL API
- **Caching:** Redis (ioredis)
- **Hosting:** Vercel (frontend), Render/Railway (backend)

---

## 👥 Contributors

- **Shivaganesh Nagamandla** - *Developer & Project Lead*

---

## 🎯 Future Improvements

- ✅ Support for more languages
- ✅ User authentication
- ✅ Mobile-friendly UI

🚀 **Built for music lovers & language learners!** 🎶

