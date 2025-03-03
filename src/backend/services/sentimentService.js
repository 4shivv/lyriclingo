const axios = require("axios");

// Use environment variable for HuggingFace API Token
const HUGGINGFACE_API_TOKEN = process.env.HUGGINGFACE_API_TOKEN;

/**
 * Analyze sentiment of text using HuggingFace API
 * @param {string} text - Text to analyze
 * @returns {Object} Sentiment analysis result
 */
const analyzeSentiment = async (text) => {
  try {
    // Add token validation
    if (!HUGGINGFACE_API_TOKEN) {
      console.error("Hugging Face API token is not configured");
      return { error: "API token not configured", sentiment: "Unknown", emoji: "❓" };
    }

    console.log("Making request to Hugging Face API...");
    const response = await axios.post(
      "https://api-inference.huggingface.co/models/distilbert-base-uncased-finetuned-sst-2-english",
      { inputs: text },
      {
        headers: {
          Authorization: `Bearer ${HUGGINGFACE_API_TOKEN}`,
          "Content-Type": "application/json",
        },
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

      return {
        sentiment,
        emoji,
        score: dominantSentiment.score.toFixed(2),
        rawResults: results
      };
    }

    return { sentiment: "Neutral", emoji: "😐", score: 0.5 };
  } catch (error) {
    console.error("Error analyzing sentiment:", error);
    return { error: "Failed to analyze sentiment", sentiment: "Unknown", emoji: "❓" };
  }
};

module.exports = { analyzeSentiment };
