const axios = require("axios");
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Use environment variable for HuggingFace API Token
const HUGGINGFACE_API_TOKEN = process.env.HUGGINGFACE_API_TOKEN;

// Configuration options
const MAX_RETRY_ATTEMPTS = 3;
const RETRY_DELAY_MS = 1000;
const MAX_TEXT_LENGTH = 1500; // Maximum length to avoid token limits

/**
 * Group emotions into sentiment categories for consistent mapping
 */
const EMOTION_TO_SENTIMENT_MAP = {
  // Positive emotions
  "admiration": { sentiment: "Positive", score: 0.7 },
  "amusement": { sentiment: "Positive", score: 0.8 },
  "approval": { sentiment: "Positive", score: 0.7 },
  "caring": { sentiment: "Positive", score: 0.6 },
  "desire": { sentiment: "Positive", score: 0.6 },
  "excitement": { sentiment: "Very Positive", score: 0.9 },
  "gratitude": { sentiment: "Very Positive", score: 0.9 },
  "joy": { sentiment: "Very Positive", score: 0.9 },
  "love": { sentiment: "Very Positive", score: 0.9 },
  "optimism": { sentiment: "Positive", score: 0.7 },
  "pride": { sentiment: "Positive", score: 0.7 },
  "relief": { sentiment: "Positive", score: 0.6 },
  
  // Neutral emotions
  "curiosity": { sentiment: "Neutral", score: 0.5 },
  "realization": { sentiment: "Neutral", score: 0.5 },
  "surprise": { sentiment: "Neutral", score: 0.5 },
  "neutral": { sentiment: "Neutral", score: 0.5 },
  
  // Negative emotions
  "anger": { sentiment: "Very Negative", score: 0.9 },
  "annoyance": { sentiment: "Negative", score: 0.7 },
  "confusion": { sentiment: "Neutral", score: 0.4 },
  "disappointment": { sentiment: "Negative", score: 0.7 },
  "disapproval": { sentiment: "Negative", score: 0.6 },
  "disgust": { sentiment: "Very Negative", score: 0.8 },
  "embarrassment": { sentiment: "Negative", score: 0.6 },
  "fear": { sentiment: "Very Negative", score: 0.8 },
  "grief": { sentiment: "Very Negative", score: 0.9 },
  "nervousness": { sentiment: "Negative", score: 0.6 },
  "remorse": { sentiment: "Negative", score: 0.7 },
  "sadness": { sentiment: "Very Negative", score: 0.8 }
};

/**
 * Map sentiment categories to emoji representations
 */
const SENTIMENT_TO_EMOJI = {
  "Very Positive": "😄",
  "Positive": "🙂",
  "Neutral": "😐",
  "Negative": "😕",
  "Very Negative": "😞"
};

/**
 * Spanish translation mapping for emotions
 */
const EMOTION_TRANSLATIONS = {
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
  "surprise": "Sorpresa",
  "neutral": "Neutral"
};

/**
 * Analyze sentiment and emotions using a single Hugging Face model
 * @param {string} text - Text to analyze (English translation of lyrics)
 * @returns {Promise<Object>} Combined sentiment and emotion analysis results
 */
const analyzeSentiment = async (text) => {
  // Check for API token
  if (!HUGGINGFACE_API_TOKEN) {
    console.error("❌ HUGGINGFACE API: Token is not configured");
    return createFallbackResponse("API token not configured");
  }
  
  // Truncate text if needed
  const truncatedText = text.length > MAX_TEXT_LENGTH 
    ? text.substring(0, MAX_TEXT_LENGTH) + "..." 
    : text;
  
  // Try to get combined sentiment and emotion analysis
  const analysisResult = await performSentimentAnalysis(truncatedText);
  
  if (analysisResult) {
    console.log(`✅ API: Sentiment and emotion analysis successful`);
    return analysisResult;
  }
  
  // Return fallback neutral response if analysis failed
  console.log(`❌ API: Sentiment and emotion analysis failed, using fallback`);
  return createFallbackResponse("Analysis service unavailable");
};

/**
 * Perform sentiment analysis using Hugging Face API
 * @param {string} text - Text to analyze
 * @returns {Promise<Object|null>} Analysis results or null if failed
 */
const performSentimentAnalysis = async (text) => {
  let attempts = 0;

  while (attempts < MAX_RETRY_ATTEMPTS) {
    try {
      console.log(`🔍 HUGGINGFACE API: Making sentiment request (attempt ${attempts + 1})...`);

      // Call the updated model endpoint
      const response = await axios.post(
        "https://api-inference.huggingface.co/models/SamLowe/roberta-base-go_emotions",
        { inputs: text },
        {
          headers: {
            Authorization: `Bearer ${HUGGINGFACE_API_TOKEN}`,
            "Content-Type": "application/json",
          },
          timeout: 10000, // 10 second timeout
        }
      );

      // Extract predictions: either response.data is an array or nested in response.data[0]
      const predictions = Array.isArray(response.data)
        ? response.data
        : (Array.isArray(response.data[0]) ? response.data[0] : []);

      if (predictions.length > 0) {
        return processEmotionResults(predictions);
      }

      console.log("⚠️ HUGGINGFACE API: Received empty response");
      return null;
    } catch (error) {
      const statusCode = error.response?.status;
      attempts++;

      console.error(
        `❌ HUGGINGFACE API: Attempt ${attempts} failed with status ${statusCode}:`,
        error.response?.data || error.message
      );

      // Break if we've reached max attempts or if the error is non-retryable
      if (
        attempts >= MAX_RETRY_ATTEMPTS ||
        (statusCode && ![429, 500, 502, 503, 504].includes(statusCode))
      ) {
        break;
      }

      const delay = RETRY_DELAY_MS * Math.pow(2, attempts - 1);
      console.log(`⏱️ HUGGINGFACE API: Retrying in ${delay}ms...`);
      await sleep(delay);
    }
  }

  return null;
};


/**
 * Process emotion results from the model and map to sentiment categories
 * @param {Array} results - Raw emotion predictions from model
 * @returns {Object} Processed sentiment and emotion data
 */
const processEmotionResults = (results) => {
  // Extract emotions with scores (excluding neutral if other emotions present)
  const emotions = results
    .map(result => ({
      emotion: result.label,
      score: result.score
    }))
    .filter((emotion, index, array) => {
      // Only include 'neutral' if it's the only emotion or has very high confidence
      if (emotion.emotion === 'neutral') {
        const otherEmotions = array.filter(e => e.emotion !== 'neutral');
        return otherEmotions.length === 0 || emotion.score > 0.7;
      }
      return true;
    })
    .sort((a, b) => b.score - a.score);
  
  // Get primary emotion (highest confidence)
  const primaryEmotion = emotions.length > 0 ? emotions[0] : { emotion: "neutral", score: 1.0 };
  
  // Map emotion to sentiment category
  const sentimentInfo = EMOTION_TO_SENTIMENT_MAP[primaryEmotion.emotion] || 
                        { sentiment: "Neutral", score: 0.5 };
  
  // Translate emotions to Spanish
  const translatedEmotions = emotions.slice(0, 3).map(item => ({
    emotion: EMOTION_TRANSLATIONS[item.emotion] || item.emotion,
    score: item.score.toFixed(2)
  }));
  
  // Format final result
  return {
    sentiment: sentimentInfo.sentiment,
    emoji: SENTIMENT_TO_EMOJI[sentimentInfo.sentiment] || "😐",
    score: sentimentInfo.score.toFixed(2),
    emotions: translatedEmotions,
    primaryEmotion: EMOTION_TRANSLATIONS[primaryEmotion.emotion] || primaryEmotion.emotion,
    emotionScore: primaryEmotion.score.toFixed(2),
    fallback: false
  };
};

/**
 * Create a fallback neutral response when analysis fails
 * @param {string} errorMessage - Error message to include
 * @returns {Object} Fallback neutral response object
 */
const createFallbackResponse = (errorMessage) => {
  return {
    sentiment: "Neutral",
    emoji: "😐",
    score: "0.50",
    emotions: [],
    primaryEmotion: "Unknown",
    emotionScore: "0.00",
    error: errorMessage,
    fallback: true
  };
};

module.exports = { analyzeSentiment };