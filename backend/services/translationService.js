const axios = require("axios");

const DEEPL_API_KEY = process.env.DEEPL_API_KEY; // ✅ Your DeepL API key

/**
 * Translates an array of text lines using DeepL API
 * @param {Array} textArray - List of lines to translate
 * @param {String} sourceLanguage - Language code (default: "es" for Spanish)
 * @returns {Array} Translated text lines (English)
 */
const translateBatch = async (textArray, sourceLanguage = "es") => {
    try {
        const response = await axios.post(
            "https://api-free.deepl.com/v2/translate",
            new URLSearchParams({
                auth_key: DEEPL_API_KEY,
                text: textArray,
                source_lang: sourceLanguage.toUpperCase(), // "ES" for Spanish
                target_lang: "EN", // ✅ Always translate to English
            }).toString(),
            { headers: { "Content-Type": "application/x-www-form-urlencoded" } }
        );

        return response.data.translations.map(t => t.text);
    } catch (error) {
        console.error("❌ Translation Error:", error.response?.data || error.message);
        return textArray.map(() => "Translation unavailable"); // Prevents breaking
    }
};

module.exports = { translateBatch };