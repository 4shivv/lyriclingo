const axios = require("axios");
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Use environment variable for HuggingFace API Token
const HUGGINGFACE_API_TOKEN = process.env.HUGGINGFACE_API_TOKEN;

// Configuration options
const MAX_RETRY_ATTEMPTS = 3;
const RETRY_DELAY_MS = 1000;
const MAX_TEXT_LENGTH = 1500; // Increased limit for better context

/**
 * Analyze sentiment using HuggingFace API
 * @param {string} text - Text to analyze
 * @returns {Promise<Object>} Sentiment analysis or null if failed
 */
const analyzeApiSentiment = async (text) => {
  // Truncate text if it's too long
  const truncatedText = text.length > MAX_TEXT_LENGTH 
    ? text.substring(0, MAX_TEXT_LENGTH) + "..." 
    : text;
  
  let attempts = 0;
  
  while (attempts < MAX_RETRY_ATTEMPTS) {
    try {
      console.log(`🔍 HUGGINGFACE API: Making sentiment request (attempt ${attempts + 1})...`);
      
      const response = await axios.post(
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
      if (response.data && response.data[0]) {
        // Get results and find the dominant sentiment
        const results = response.data[0];
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
        
        console.log(`✅ HUGGINGFACE API: Sentiment analysis successful: ${sentiment} (Score: ${dominantSentiment.score.toFixed(2)})`);
        
        return {
          sentiment,
          emoji,
          score: dominantSentiment.score.toFixed(2),
          rawResults: results
        };
      }
      
      console.log("⚠️ HUGGINGFACE API: Received empty sentiment response");
      return null;
      
    } catch (error) {
      const statusCode = error.response?.status;
      attempts++;
      
      console.error(`❌ HUGGINGFACE API: Sentiment attempt ${attempts} failed with status ${statusCode}:`, 
        error.response?.data || error.message);
      
      // If we've reached max attempts or it's not a retryable error, break the loop
      if (attempts >= MAX_RETRY_ATTEMPTS || 
          (statusCode && ![429, 500, 502, 503, 504].includes(statusCode))) {
        break;
      }
      
      // Exponential backoff delay
      const delay = RETRY_DELAY_MS * Math.pow(2, attempts - 1);
      console.log(`⏱️ HUGGINGFACE API: Retrying sentiment in ${delay}ms...`);
      await sleep(delay);
    }
  }
  
  console.log(`❌ HUGGINGFACE API: All sentiment attempts failed`);
  return null;
};

/**
 * Analyze emotions using HuggingFace API
 * @param {string} text - Text to analyze
 * @returns {Promise<Object>} Emotions analysis or null if failed
 */
const analyzeApiEmotions = async (text) => {
  // Truncate text if it's too long
  const truncatedText = text.length > MAX_TEXT_LENGTH 
    ? text.substring(0, MAX_TEXT_LENGTH) + "..." 
    : text;
  
  let attempts = 0;
  
  while (attempts < MAX_RETRY_ATTEMPTS) {
    try {
      console.log(`🔍 HUGGINGFACE API: Making emotions request (attempt ${attempts + 1})...`);
      
      const response = await axios.post(
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
      if (response.data && response.data[0]) {
        const emotionsResults = response.data[0];
        
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
        let emotions = [];
        for (const emotion of emotionsResults.slice(0, 3)) {
          const spanishEmotion = emotionMapping[emotion.label] || emotion.label;
          emotions.push({
            emotion: spanishEmotion,
            score: emotion.score.toFixed(2)
          });
        }
        
        const primaryEmotion = emotions[0].emotion;
        const emotionScore = emotions[0].score;
        
        console.log(`✅ HUGGINGFACE API: Emotions analysis successful - Primary: ${primaryEmotion} (Score: ${emotionScore})`);
        
        return {
          emotions,
          primaryEmotion,
          emotionScore
        };
      }
      
      console.log("⚠️ HUGGINGFACE API: Received empty emotions response");
      return null;
      
    } catch (error) {
      const statusCode = error.response?.status;
      attempts++;
      
      console.error(`❌ HUGGINGFACE API: Emotions attempt ${attempts} failed with status ${statusCode}:`, 
        error.response?.data || error.message);
      
      // If we've reached max attempts or it's not a retryable error, break the loop
      if (attempts >= MAX_RETRY_ATTEMPTS || 
          (statusCode && ![429, 500, 502, 503, 504].includes(statusCode))) {
        break;
      }
      
      // Exponential backoff delay
      const delay = RETRY_DELAY_MS * Math.pow(2, attempts - 1);
      console.log(`⏱️ HUGGINGFACE API: Retrying emotions in ${delay}ms...`);
      await sleep(delay);
    }
  }
  
  console.log(`❌ HUGGINGFACE API: All emotions attempts failed`);
  return null;
};

/**
 * Analyze sentiment and emotions using only the Hugging Face API
 * @param {string} text - Text to analyze
 * @returns {Object} Combined sentiment and emotion analysis
 */
const analyzeSentiment = async (text) => {
  // Check for API token
  if (!HUGGINGFACE_API_TOKEN) {
    console.error("❌ HUGGINGFACE API: Token is not configured");
    return {
      sentiment: "Neutral",
      emoji: "😐",
      score: "0.50",
      emotions: [],
      primaryEmotion: "Unknown",
      emotionScore: "0.00",
      error: "Hugging Face API token not configured",
      fallback: true
    };
  }
  
  // Try API for sentiment analysis
  const apiSentiment = await analyzeApiSentiment(text);
  
  // Try API for emotions analysis
  const apiEmotions = await analyzeApiEmotions(text);
  
  // If both API calls succeeded
  if (apiSentiment && apiEmotions) {
    console.log(`✅ API: Both sentiment and emotions analysis successful`);
    
    return {
      sentiment: apiSentiment.sentiment,
      emoji: apiSentiment.emoji,
      score: apiSentiment.score,
      emotions: apiEmotions.emotions,
      primaryEmotion: apiEmotions.primaryEmotion,
      emotionScore: apiEmotions.emotionScore,
      fallback: false
    };
  }
  
  // If only sentiment succeeded
  if (apiSentiment && !apiEmotions) {
    console.log(`⚠️ API: Only sentiment analysis successful, emotions failed`);
    
    return {
      sentiment: apiSentiment.sentiment,
      emoji: apiSentiment.emoji,
      score: apiSentiment.score,
      emotions: [],
      primaryEmotion: "Unknown",
      emotionScore: "0.00",
      emotionsError: true,
      fallback: false,
      notice: "Emotion analysis unavailable"
    };
  }
  
  // If only emotions succeeded
  if (!apiSentiment && apiEmotions) {
    console.log(`⚠️ API: Only emotions analysis successful, sentiment failed`);
    
    return {
      sentiment: "Neutral",
      emoji: "😐",
      score: "0.50",
      emotions: apiEmotions.emotions,
      primaryEmotion: apiEmotions.primaryEmotion,
      emotionScore: apiEmotions.emotionScore,
      sentimentError: true,
      fallback: false,
      notice: "Sentiment analysis unavailable"
    };
  }
  
  // If both failed
  console.log(`❌ API: Both sentiment and emotions analysis failed`);
  return {
    sentiment: "Neutral",
    emoji: "😐",
    score: "0.50",
    emotions: [],
    primaryEmotion: "Unknown",
    emotionScore: "0.00",
    error: "Analysis service unavailable",
    fallback: true
  };
};

module.exports = { analyzeSentiment };