const axios = require("axios");
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

const HUGGINGFACE_API_TOKEN = process.env.HUGGINGFACE_API_TOKEN;
const MAX_RETRY_ATTEMPTS = 3;
const RETRY_DELAY_MS = 1000;
const MAX_TEXT_LENGTH = 1500;

// Map raw emotions to sentiment categories
const EMOTION_TO_SENTIMENT_MAP = {
  admiration: { sentiment: "Positive", score: 0.7 },
  amusement: { sentiment: "Positive", score: 0.8 },
  approval: { sentiment: "Positive", score: 0.7 },
  caring: { sentiment: "Positive", score: 0.6 },
  desire: { sentiment: "Positive", score: 0.6 },
  excitement: { sentiment: "Very Positive", score: 0.9 },
  gratitude: { sentiment: "Very Positive", score: 0.9 },
  joy: { sentiment: "Very Positive", score: 0.9 },
  love: { sentiment: "Very Positive", score: 0.9 },
  optimism: { sentiment: "Positive", score: 0.7 },
  pride: { sentiment: "Positive", score: 0.7 },
  relief: { sentiment: "Positive", score: 0.6 },
  curiosity: { sentiment: "Neutral", score: 0.5 },
  realization: { sentiment: "Neutral", score: 0.5 },
  surprise: { sentiment: "Neutral", score: 0.5 },
  neutral: { sentiment: "Neutral", score: 0.5 },
  anger: { sentiment: "Very Negative", score: 0.9 },
  annoyance: { sentiment: "Negative", score: 0.7 },
  confusion: { sentiment: "Neutral", score: 0.4 },
  disappointment: { sentiment: "Negative", score: 0.7 },
  disapproval: { sentiment: "Negative", score: 0.6 },
  disgust: { sentiment: "Very Negative", score: 0.8 },
  embarrassment: { sentiment: "Negative", score: 0.6 },
  fear: { sentiment: "Very Negative", score: 0.8 },
  grief: { sentiment: "Very Negative", score: 0.9 },
  nervousness: { sentiment: "Negative", score: 0.6 },
  remorse: { sentiment: "Negative", score: 0.7 },
  sadness: { sentiment: "Very Negative", score: 0.8 }
};

const SENTIMENT_TO_EMOJI = {
  "Very Positive": "😄",
  Positive: "🙂",
  Neutral: "😐",
  Negative: "😕",
  "Very Negative": "😞"
};

const EMOTION_TRANSLATIONS = {
  admiration: "Admiración",
  amusement: "Diversión",
  anger: "Enojo",
  annoyance: "Irritación",
  approval: "Aprobación",
  caring: "Afecto",
  confusion: "Confusión",
  curiosity: "Curiosidad",
  desire: "Deseo",
  disappointment: "Decepción",
  disapproval: "Desaprobación",
  disgust: "Disgusto",
  embarrassment: "Vergüenza",
  excitement: "Entusiasmo",
  fear: "Miedo",
  gratitude: "Gratitud",
  grief: "Duelo",
  joy: "Alegría",
  love: "Amor",
  nervousness: "Nerviosismo",
  optimism: "Optimismo",
  pride: "Orgullo",
  realization: "Realización",
  relief: "Alivio",
  remorse: "Remordimiento",
  sadness: "Tristeza",
  surprise: "Sorpresa",
  neutral: "Neutral"
};

// Process model output and map to our sentiment response
const processEmotionResults = (results) => {
  // Ensure each result has a defined score (defaulting to 0 if missing)
  const emotions = results
    .map(result => ({
      emotion: result.label,
      score: result.score !== undefined ? result.score : 0
    }))
    .filter((emotion, index, array) => {
      // Include 'neutral' only if it's the only emotion or if its confidence is high enough
      if (emotion.emotion === "neutral") {
        const otherEmotions = array.filter(e => e.emotion !== "neutral");
        return otherEmotions.length === 0 || emotion.score > 0.7;
      }
      return true;
    })
    .sort((a, b) => b.score - a.score);

  const primaryEmotion = emotions.length > 0 ? emotions[0] : { emotion: "neutral", score: 1.0 };
  const sentimentInfo = EMOTION_TO_SENTIMENT_MAP[primaryEmotion.emotion] || { sentiment: "Neutral", score: 0.5 };

  const translatedEmotions = emotions.slice(0, 3).map(item => ({
    emotion: EMOTION_TRANSLATIONS[item.emotion] || item.emotion,
    score: item.score ? item.score.toFixed(2) : "0.00"
  }));

  return {
    sentiment: sentimentInfo.sentiment,
    emoji: SENTIMENT_TO_EMOJI[sentimentInfo.sentiment] || "😐",
    score: sentimentInfo.score.toFixed(2),
    emotions: translatedEmotions,
    primaryEmotion: EMOTION_TRANSLATIONS[primaryEmotion.emotion] || primaryEmotion.emotion,
    emotionScore: primaryEmotion.score ? primaryEmotion.score.toFixed(2) : "0.00",
    fallback: false
  };
};

const performSentimentAnalysis = async (text) => {
  const HUGGINGFACE_API_URL = "https://api-inference.huggingface.co/models/SamLowe/roberta-base-go_emotions";
  let attempts = 0;

  while (attempts < MAX_RETRY_ATTEMPTS) {
    try {
      console.log(`🔍 HUGGINGFACE API: Making sentiment request (attempt ${attempts + 1})...`);

      const response = await axios.post(
        HUGGINGFACE_API_URL,
        { inputs: text },
        {
          headers: {
            Authorization: `Bearer ${HUGGINGFACE_API_TOKEN}`,
            "Content-Type": "application/json",
          },
          timeout: 10000, // 10 second timeout
        }
      );

      console.log("HUGGINGFACE API RESPONSE:", response.data);

      let predictions = [];
      if (response.data && Array.isArray(response.data[0])) {
        predictions = response.data[0];
      } else if (Array.isArray(response.data)) {
        predictions = response.data;
      } else {
        throw new Error("Unexpected response format from Hugging Face API.");
      }

      if (predictions.length > 0) {
        return processEmotionResults(predictions);
      }

      console.log("⚠️ HUGGINGFACE API: Received empty predictions array.");
      return null;
    } catch (error) {
      attempts++;
      const statusCode = error.response ? error.response.status : "undefined";
      console.error(
        `❌ HUGGINGFACE API: Attempt ${attempts} failed with status ${statusCode}:`,
        error.response ? error.response.data : error.message
      );

      if (
        attempts >= MAX_RETRY_ATTEMPTS ||
        (error.response && ![429, 500, 502, 503, 504].includes(error.response.status))
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

const analyzeSentiment = async (text) => {
  if (!HUGGINGFACE_API_TOKEN) {
    console.error("❌ HUGGINGFACE API: Token is not configured");
    return createFallbackResponse("API token not configured");
  }

  const truncatedText = text.length > MAX_TEXT_LENGTH ? text.substring(0, MAX_TEXT_LENGTH) + "..." : text;
  const analysisResult = await performSentimentAnalysis(truncatedText);

  if (analysisResult) {
    console.log(`✅ API: Sentiment and emotion analysis successful`);
    return analysisResult;
  }
  
  console.log(`❌ API: Sentiment and emotion analysis failed, using fallback`);
  return createFallbackResponse("Analysis service unavailable");
};

module.exports = { analyzeSentiment };
