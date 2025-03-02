const axios = require("axios");

const DEEPL_API_KEY = process.env.DEEPL_API_KEY;

/**
 * Translates an array of text lines using DeepL API
 * Each array element is treated as a separate text to translate,
 * eliminating the need for delimiters
 * 
 * @param {Array} textArray - List of lines/texts to translate
 * @param {String} sourceLanguage - Language code (default: "es" for Spanish)
 * @returns {Array} Translated text lines (English)
 */
const translateBatch = async (textArray, sourceLanguage = "es") => {
    try {
        // Filter out empty strings to avoid wasting API calls
        const filteredArray = textArray.filter(text => text && text.trim().length > 0);
        
        // If no valid texts, return empty array
        if (filteredArray.length === 0) {
            return [];
        }
        
        // Create the params object with the text array (DeepL API accepts arrays directly)
        const params = new URLSearchParams();
        params.append("auth_key", DEEPL_API_KEY);
        filteredArray.forEach(text => params.append("text", text));
        params.append("source_lang", sourceLanguage.toUpperCase());
        params.append("target_lang", "EN");
        
        const response = await axios.post(
            "https://api-free.deepl.com/v2/translate",
            params.toString(),
            { headers: { "Content-Type": "application/x-www-form-urlencoded" } }
        );

        // Map the translations to match the original array structure
        const translations = response.data.translations.map(t => t.text);
        
        // If original array had empty strings, we need to reinsert them to maintain alignment
        const result = [];
        let translationIndex = 0;
        
        for (const originalText of textArray) {
            if (originalText && originalText.trim().length > 0) {
                result.push(translations[translationIndex++]);
            } else {
                result.push("");
            }
        }
        
        return result;
    } catch (error) {
        console.error("❌ Translation Error:", error.response?.data || error.message);
        // Return an array of fallback strings matching the input array length
        return textArray.map(() => "Translation unavailable");
    }
};

module.exports = { translateBatch };