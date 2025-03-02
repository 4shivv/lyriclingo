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
        // Prepare texts for translation - preserve all meaningful content
        const preparedArray = textArray.map(text => {
            if (!text || text.trim().length === 0) return "";
            
            // Normalize text to handle special characters and ensure consistent handling
            let normalizedText = text
                .normalize('NFD')
                .replace(/[\u0300-\u036f]/g, c => c) // Keep accents but normalize them
                .trim();
                
            // Add a period at the end if missing punctuation to help translation accuracy
            if (!/[.!?;,:]$/.test(normalizedText)) {
                normalizedText += ".";
            }
            
            return normalizedText;
        });
        
        // Filter out empty strings for the API call
        const filteredArray = preparedArray.filter(text => text.length > 0);
        
        // If no valid texts, return empty array
        if (filteredArray.length === 0) {
            return [];
        }
        
        // Create the params object with enhanced translation parameters
        const params = new URLSearchParams();
        params.append("auth_key", DEEPL_API_KEY);
        filteredArray.forEach(text => params.append("text", text));
        params.append("source_lang", sourceLanguage.toUpperCase());
        params.append("target_lang", "EN");
        params.append("preserve_formatting", "1"); // Maintain original formatting
        
        const response = await axios.post(
            "https://api-free.deepl.com/v2/translate",
            params.toString(),
            { headers: { "Content-Type": "application/x-www-form-urlencoded" } }
        );

        // Process and verify translations
        const translations = response.data.translations.map(t => {
            // Remove trailing period if we added one
            let translation = t.text;
            if (translation.endsWith(".") && !/[.!?;,:]$/.test(t.text.slice(0, -1))) {
                translation = translation.slice(0, -1);
            }
            return translation;
        });
        
        // Reinsert empty strings to maintain alignment
        const result = [];
        let translationIndex = 0;
        
        for (const originalText of textArray) {
            if (originalText && originalText.trim().length > 0) {
                result.push(translations[translationIndex++]);
            } else {
                result.push("");
            }
        }
        
        // Log translation diagnostics
        console.log(`✅ Translated ${translations.length} lines successfully`);
        
        return result;
    } catch (error) {
        console.error("❌ Translation Error:", error.response?.data || error.message);
        // Return an array of fallback strings matching the input array length
        return textArray.map(() => "Translation unavailable");
    }
};

module.exports = { translateBatch };