const axios = require("axios");
const path = require("path");
const fs = require("fs");
const { spawn } = require("child_process");
const os = require("os");

// Use environment variable for HuggingFace API Token
const HUGGINGFACE_API_TOKEN = process.env.HUGGINGFACE_API_TOKEN;

// Configuration options
const MAX_RETRY_ATTEMPTS = 3;
const RETRY_DELAY_MS = 1000;
const MAX_TEXT_LENGTH = 1500; // Increased limit for better context

// Local model paths - will be created when models are downloaded
const MODELS_DIR = path.join(__dirname, "../../models");
const SENTIMENT_MODEL_DIR = path.join(MODELS_DIR, "sentiment-model");
const EMOTIONS_MODEL_DIR = path.join(MODELS_DIR, "emotions-model");

// Ensure model directories exist
if (!fs.existsSync(MODELS_DIR)) {
  fs.mkdirSync(MODELS_DIR, { recursive: true });
}
if (!fs.existsSync(SENTIMENT_MODEL_DIR)) {
  fs.mkdirSync(SENTIMENT_MODEL_DIR, { recursive: true });
}
if (!fs.existsSync(EMOTIONS_MODEL_DIR)) {
  fs.mkdirSync(EMOTIONS_MODEL_DIR, { recursive: true });
}

// Python script path for local ML inference
const PYTHON_SCRIPT_PATH = path.join(__dirname, "sentiment_inference.py");

// Create Python script for local inference if it doesn't exist
if (!fs.existsSync(PYTHON_SCRIPT_PATH)) {
  const pythonScript = `
import sys
import json
import os
from pathlib import Path

# Check if transformers is installed, if not provide instructions
try:
    from transformers import pipeline, AutoModelForSequenceClassification, AutoTokenizer
    import torch
except ImportError:
    print(json.dumps({
        "error": "Required Python packages not installed. Please run: pip install transformers torch"
    }))
    sys.exit(1)

def download_models_if_needed():
    """Download models if they don't exist locally"""
    models_dir = Path(os.path.dirname(os.path.realpath(__file__)), "..", "..", "models")
    
    sentiment_dir = models_dir / "sentiment-model"
    emotions_dir = models_dir / "emotions-model"
    
    # Download sentiment model if needed
    if not os.path.exists(sentiment_dir / "config.json"):
        print("Downloading sentiment model...", file=sys.stderr)
        sentiment_model = AutoModelForSequenceClassification.from_pretrained("distilbert-base-uncased-finetuned-sst-2-english")
        sentiment_tokenizer = AutoTokenizer.from_pretrained("distilbert-base-uncased-finetuned-sst-2-english")
        sentiment_model.save_pretrained(sentiment_dir)
        sentiment_tokenizer.save_pretrained(sentiment_dir)
        print("Sentiment model downloaded successfully", file=sys.stderr)
    
    # Download emotions model if needed
    if not os.path.exists(emotions_dir / "config.json"):
        print("Downloading emotions model...", file=sys.stderr) 
        emotions_model = AutoModelForSequenceClassification.from_pretrained("joeddav/distilbert-base-uncased-go-emotions-student")
        emotions_tokenizer = AutoTokenizer.from_pretrained("joeddav/distilbert-base-uncased-go-emotions-student")
        emotions_model.save_pretrained(emotions_dir)
        emotions_tokenizer.save_pretrained(emotions_dir)
        print("Emotions model downloaded successfully", file=sys.stderr)

def analyze_sentiment(text):
    """Analyze sentiment using local model"""
    models_dir = Path(os.path.dirname(os.path.realpath(__file__)), "..", "..", "models")
    sentiment_dir = str(models_dir / "sentiment-model")
    
    # Load sentiment model locally
    classifier = pipeline(
        "sentiment-analysis",
        model=sentiment_dir,
        tokenizer=sentiment_dir,
        device=-1  # Use CPU
    )
    
    result = classifier(text)[0]
    sentiment_label = result["label"]
    score = result["score"]
    
    # Map sentiment to user-friendly format
    if sentiment_label == "POSITIVE":
        if score > 0.9:
            sentiment = "Very Positive"
            emoji = "😄"
        else:
            sentiment = "Positive"
            emoji = "🙂"
    else:  # NEGATIVE
        if score > 0.9:
            sentiment = "Very Negative"
            emoji = "😞"
        else:
            sentiment = "Negative"
            emoji = "😕"
    
    return {
        "sentiment": sentiment,
        "emoji": emoji,
        "score": float(score),
        "label": sentiment_label
    }

def analyze_emotions(text):
    """Analyze emotions using a specialized emotions model"""
    models_dir = Path(os.path.dirname(os.path.realpath(__file__)), "..", "..", "models")
    emotions_dir = str(models_dir / "emotions-model")
    
    # Load emotions model locally
    emotions_classifier = pipeline(
        "text-classification",
        model=emotions_dir,
        tokenizer=emotions_dir,
        device=-1,  # Use CPU
        top_k=5      # Return top 5 emotions
    )
    
    # Analyze emotions in the text
    results = emotions_classifier(text)
    
    # Map Spanish music-relevant emotions
    emotion_mapping = {
        "admiration": "Admiración",
        "amusement": "Diversión",
        "anger": "Enojo",
        "annoyance": "Irritación",
        "approval": "Aprobación",
        "caring": "Afecto",
        "confusion": "Confusión",
        "curiosity": "Curiosidad",
        "desire": "Deseo",
        "disappointment": "Decepción",
        "disapproval": "Desaprobación",
        "disgust": "Disgusto",
        "embarrassment": "Vergüenza",
        "excitement": "Entusiasmo",
        "fear": "Miedo",
        "gratitude": "Gratitud",
        "grief": "Duelo",
        "joy": "Alegría",
        "love": "Amor",
        "nervousness": "Nerviosismo",
        "optimism": "Optimismo",
        "pride": "Orgullo",
        "realization": "Realización",
        "relief": "Alivio",
        "remorse": "Remordimiento",
        "sadness": "Tristeza",
        "surprise": "Sorpresa"
    }
    
    # Extract and map top emotions
    emotions = []
    for item in results[0]:
        emotion = item["label"]
        score = item["score"]
        spanish_emotion = emotion_mapping.get(emotion, emotion)
        emotions.append({
            "emotion": spanish_emotion,
            "english": emotion,
            "score": float(score)
        })
    
    return emotions

def main():
    # Get input text from stdin
    input_data = json.loads(sys.stdin.read())
    text = input_data.get("text", "")
    mode = input_data.get("mode", "all")
    
    try:
        # Download models if needed
        download_models_if_needed()
        
        if mode == "sentiment" or mode == "all":
            sentiment_result = analyze_sentiment(text)
        else:
            sentiment_result = None
            
        if mode == "emotions" or mode == "all":
            emotions_result = analyze_emotions(text)
        else:
            emotions_result = None
        
        # Return results
        result = {
            "sentiment": sentiment_result,
            "emotions": emotions_result
        }
        print(json.dumps(result))
        
    except Exception as e:
        print(json.dumps({"error": str(e)}))

if __name__ == "__main__":
    main()
  `;
  
  fs.writeFileSync(PYTHON_SCRIPT_PATH, pythonScript);
  console.log(`✅ Created Python inference script at ${PYTHON_SCRIPT_PATH}`);
}

/**
 * Sleep function for implementing delay between retries
 * @param {number} ms - Milliseconds to sleep
 * @returns {Promise} Promise that resolves after the specified time
 */
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Run local ML-based sentiment analysis using Python and transformers
 * @param {string} text - Text to analyze
 * @returns {Promise<Object>} Sentiment analysis result
 */
const runLocalMLAnalysis = async (text) => {
  console.log(`🔍 LOCAL ML: Starting sentiment analysis`);
  
  try {
    // Prepare input for the Python script
    const input = {
      text: text,
      mode: "all" // analyze both sentiment and emotions
    };
    
    // Spawn a Python process
    const pythonProcess = spawn("python3", [PYTHON_SCRIPT_PATH]);
    
    // Write the input to the Python process
    pythonProcess.stdin.write(JSON.stringify(input));
    pythonProcess.stdin.end();
    
    // Collect stdout data
    let result = "";
    pythonProcess.stdout.on("data", (data) => {
      result += data.toString();
    });
    
    // Collect stderr data (for debugging)
    let errorOutput = "";
    pythonProcess.stderr.on("data", (data) => {
      errorOutput += data.toString();
      console.log(`🐍 Python: ${data.toString().trim()}`);
    });
    
    // Handle process completion
    return new Promise((resolve, reject) => {
      pythonProcess.on("close", (code) => {
        if (code !== 0) {
          console.error(`❌ LOCAL ML: Python process exited with code ${code}`);
          console.error(`Python stderr: ${errorOutput}`);
          return reject(new Error(`Python process failed with code ${code}`));
        }
        
        try {
          // Parse the Python script's output
          const analysis = JSON.parse(result);
          
          if (analysis.error) {
            console.error(`❌ LOCAL ML: Error in Python script: ${analysis.error}`);
            return reject(new Error(analysis.error));
          }
          
          // Extract sentiment and emotions
          const sentimentResult = analysis.sentiment;
          const emotions = analysis.emotions;
          
          // Get the top emotion
          const topEmotion = emotions[0];
          
          console.log(`✅ LOCAL ML: Analysis complete - Sentiment: ${sentimentResult.sentiment}, Emotion: ${topEmotion.emotion}`);
          
          // Return a combined result
          return resolve({
            sentiment: sentimentResult.sentiment,
            emoji: sentimentResult.emoji,
            score: sentimentResult.score.toFixed(2),
            emotions: emotions.slice(0, 3).map(e => ({
              emotion: e.emotion,
              score: e.score.toFixed(2)
            })),
            primaryEmotion: topEmotion.emotion,
            emotionScore: topEmotion.score.toFixed(2),
            fallback: true,
            localML: true
          });
        } catch (parseError) {
          console.error(`❌ LOCAL ML: Failed to parse output: ${parseError.message}`);
          console.error(`Python stdout: ${result}`);
          return reject(new Error(`Failed to parse Python output: ${parseError.message}`));
        }
      });
    });
  } catch (error) {
    console.error(`❌ LOCAL ML: Error running local analysis: ${error.message}`);
    throw error;
  }
};

/**
 * Analyze sentiment and emotions using HuggingFace API with retry logic and fallback to local ML
 * @param {string} text - Text to analyze
 * @returns {Object} Sentiment analysis result
 */
const analyzeSentiment = async (text) => {
  // Add token validation
  if (!HUGGINGFACE_API_TOKEN) {
    console.error("❌ HUGGINGFACE API: Token is not configured");
    return runLocalMLAnalysis(text);
  }
  
  // Truncate text if it's too long to avoid large payloads
  const truncatedText = text.length > MAX_TEXT_LENGTH 
    ? text.substring(0, MAX_TEXT_LENGTH) + "..." 
    : text;
  
  // Retry logic implementation for sentiment analysis
  let attempts = 0;
  let lastError = null;
  
  // First try HuggingFace API for sentiment analysis
  while (attempts < MAX_RETRY_ATTEMPTS) {
    try {
      console.log(`🔍 HUGGINGFACE API: Making sentiment request (attempt ${attempts + 1})...`);
      
      const sentimentResponse = await axios.post(
        "https://api-inference.huggingface.co/models/distilbert-base-uncased-finetuned-sst-2-english",
        { inputs: truncatedText },
        {
          headers: {
            Authorization: `Bearer ${HUGGINGFACE_API_TOKEN}`,
            "Content-Type": "application/json",
          },
          timeout: 10000, // 10 second timeout
        }
      );
      
      // Process and categorize sentiment
      if (sentimentResponse.data && sentimentResponse.data[0]) {
        // Get results and find the dominant sentiment
        const results = sentimentResponse.data[0];
        let dominantSentiment = { label: "NEUTRAL", score: 0 };
        
        for (const result of results) {
          if (result.score > dominantSentiment.score) {
            dominantSentiment = result;
          }
        }
        
        // Map the sentiment to a more user-friendly format
        let sentiment = "Neutral";
        let emoji = "😐";
        
        if (dominantSentiment.label === "POSITIVE" && dominantSentiment.score > 0.7) {
          sentiment = "Very Positive";
          emoji = "😄";
        } else if (dominantSentiment.label === "POSITIVE") {
          sentiment = "Positive";
          emoji = "🙂";
        } else if (dominantSentiment.label === "NEGATIVE" && dominantSentiment.score > 0.7) {
          sentiment = "Very Negative";
          emoji = "😞";
        } else if (dominantSentiment.label === "NEGATIVE") {
          sentiment = "Negative";
          emoji = "😕";
        }
        
        // Now get emotions from second API call
        try {
          console.log(`🔍 HUGGINGFACE API: Making emotions request...`);
          
          const emotionsResponse = await axios.post(
            "https://api-inference.huggingface.co/models/joeddav/distilbert-base-uncased-go-emotions-student",
            { inputs: truncatedText },
            {
              headers: {
                Authorization: `Bearer ${HUGGINGFACE_API_TOKEN}`,
                "Content-Type": "application/json",
              },
              timeout: 10000, // 10 second timeout
            }
          );
          
          // Process emotions
          const emotionsResults = emotionsResponse.data[0];
          let emotions = [];
          
          // Map Spanish music-relevant emotions
          const emotionMapping = {
            "admiration": "Admiración",
            "amusement": "Diversión",
            "anger": "Enojo",
            "annoyance": "Irritación",
            "approval": "Aprobación",
            "caring": "Afecto",
            "confusion": "Confusión",
            "curiosity": "Curiosidad",
            "desire": "Deseo",
            "disappointment": "Decepción",
            "disapproval": "Desaprobación",
            "disgust": "Disgusto",
            "embarrassment": "Vergüenza",
            "excitement": "Entusiasmo",
            "fear": "Miedo",
            "gratitude": "Gratitud",
            "grief": "Duelo",
            "joy": "Alegría",
            "love": "Amor",
            "nervousness": "Nerviosismo",
            "optimism": "Optimismo",
            "pride": "Orgullo",
            "realization": "Realización",
            "relief": "Alivio",
            "remorse": "Remordimiento",
            "sadness": "Tristeza",
            "surprise": "Sorpresa"
          };
          
          // Extract top emotions (limit to top 3)
          for (const emotion of emotionsResults.slice(0, 3)) {
            const spanishEmotion = emotionMapping[emotion.label] || emotion.label;
            emotions.push({
              emotion: spanishEmotion,
              score: emotion.score.toFixed(2)
            });
          }
          
          const primaryEmotion = emotions[0].emotion;
          const emotionScore = emotions[0].score;
          
          console.log(`✅ HUGGINGFACE API: Sentiment analysis successful: ${sentiment} (Score: ${dominantSentiment.score.toFixed(2)})`);
          console.log(`✅ HUGGINGFACE API: Primary emotion detected: ${primaryEmotion} (Score: ${emotionScore})`);
          
          return {
            sentiment,
            emoji,
            score: dominantSentiment.score.toFixed(2),
            emotions,
            primaryEmotion,
            emotionScore,
            fallback: false,
            localML: false,
            rawResults: results
          };
        } catch (emotionsError) {
          console.error(`⚠️ HUGGINGFACE API: Emotions analysis failed, but sentiment succeeded: ${emotionsError.message}`);
          
          // Return just sentiment if emotions failed
          return {
            sentiment,
            emoji,
            score: dominantSentiment.score.toFixed(2),
            emotions: [],
            primaryEmotion: "Unknown",
            emotionScore: "0.00",
            fallback: false,
            localML: false,
            emotionsError: true,
            rawResults: results
          };
        }
      }
      
      console.log("⚠️ HUGGINGFACE API: Received empty response, using fallback");
      break;
      
    } catch (error) {
      lastError = error;
      const statusCode = error.response?.status;
      attempts++;
      
      console.error(`❌ HUGGINGFACE API: Attempt ${attempts} failed with status ${statusCode}:`, 
        error.response?.data || error.message);
      
      // If we've reached max attempts or it's not a retryable error, break the loop
      if (attempts >= MAX_RETRY_ATTEMPTS || 
          (statusCode && ![429, 500, 502, 503, 504].includes(statusCode))) {
        break;
      }
      
      // Exponential backoff delay
      const delay = RETRY_DELAY_MS * Math.pow(2, attempts - 1);
      console.log(`⏱️ HUGGINGFACE API: Retrying in ${delay}ms...`);
      await sleep(delay);
    }
  }
  
  console.log(`❌ HUGGINGFACE API: All attempts failed, switching to local ML analysis`);
  
  // If API fails, use local ML analysis
  return runLocalMLAnalysis(text);
};

module.exports = { analyzeSentiment };