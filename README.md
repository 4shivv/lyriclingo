# 🎵 LyricLingo

**LyricLingo** is a full-stack web application that fetches song lyrics, translates them, and generates flashcards for language learning. Users can log songs, view their history, and test themselves with flashcards generated from song lyrics.

## 🚀 Features
- **Fetch song lyrics** from Genius API
- **Translate lyrics** using DeepL API
- **Generate flashcards** from lyrics (original + translated)
- **Save song history** in MongoDB
- **Frontend built with React**
- **Backend powered by Node.js + Express**

---

## 🛠️ Installation
### **1️⃣ Clone the Repository**
```sh
  git clone https://github.com/your-username/LyricLingo.git
  cd LyricLingo
```

### **2️⃣ Set Up Backend**
```sh
  cd backend
  npm install
```
#### **Environment Variables** (Create `.env` file in `backend/`)
```env
GENIUS_ACCESS_TOKEN=your-genius-api-key
DEEPL_API_KEY=your-deepl-api-key
MONGO_URI=your-mongodb-connection-string
```
#### **Run Backend**
```sh
  npm start
  node server.js
```
> Backend runs on **http://localhost:5001**

---

### **3️⃣ Set Up Frontend**
```sh
  cd frontend
  npm install
```
#### **Environment Variables** (Create `.env` file in `frontend/`)
```env
REACT_APP_BACKEND_URL=http://localhost:5001
```
#### **Run Frontend**
```sh
  npm start
  npm run dev
```
> Frontend runs on **http://localhost:3000**

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
    "lyricsUrl": "https://genius.com/...","
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

## 🌍 Deployment Guide
### **1️⃣ Deploy Backend** (Render/Railway/Heroku)
- Push backend to GitHub
- Deploy on [Render](https://render.com/) or [Railway](https://railway.app/)
- Set environment variables
- Get the backend URL (e.g., `https://lyriclingo-backend.onrender.com`)

### **2️⃣ Deploy Frontend** (Vercel/Netlify)
- Push frontend to GitHub
- Deploy on [Vercel](https://vercel.com/)
- Set `REACT_APP_BACKEND_URL=https://lyriclingo-backend.onrender.com`
- Deploy & get URL (e.g., `https://lyriclingo.vercel.app`)

---

## 🛠️ Tech Stack
- **Frontend:** React, Tailwind CSS
- **Backend:** Node.js, Express
- **Database:** MongoDB Atlas
- **APIs Used:** Genius API, DeepL API
- **Hosting:** Vercel (frontend), Render/Railway (backend)

---

## 👥 Contributors
- **Shivaganesh Nagamandla** - *Developer & Project Lead*

---

## 📜 License
This project is licensed under the MIT License.

---

## 🎯 Future Improvements
- ✅ Support for more languages
- ✅ User authentication
- ✅ Mobile-friendly UI

🚀 **Built for music lovers & language learners!** 🎶

