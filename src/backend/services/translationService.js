const axios = require("axios");

const DEEPL_API_KEY = process.env.DEEPL_API_KEY;

/**
 * Comprehensive mapping of Spanish song contractions to their full forms
 */
const SPANISH_CONTRACTIONS = {
    // Common verb contractions
    "ere'": "eres",  // You are (informal)
    "e'": "es",      // Is
    "ta'": "estás",  // You are (state, informal)
    "toy": "estoy",  // I am
    "tamo": "estamos", // We are
    "tás": "estás",  // You are (state, informal)
    "tas": "estás",  // You are (state, informal)
    "'ta": "está",   // He/she/it is
    "pa'": "para",   // For
    "pa": "para",    // For
    "na'": "nada",   // Nothing
    "to'": "todo",   // All/everything
    "da'": "dar",    // To give
    "pue'": "puede", // Can (3rd person)
    "va'": "vas",    // You go
    "vo'": "voy",    // I go
    "quie'": "quiere", // He/she/it wants
    "sie'": "siente", // He/she/it feels
    "tie'": "tiene", // He/she/it has
    "vie'": "viene", // He/she/it comes
    "sa'": "sabes",  // You know
    "se'": "ser",    // To be
    "do'": "dos",    // Two
    "ma'": "más",    // More
    "po'": "por",    // For/by
    "ve'": "ver",    // To see
    "di'": "dice",   // He/she/it says
    "di": "dice",    // He/she/it says
    "ha'": "hay",    // There is/are
    "qui'": "quiere", // He/she/it wants
    
    // Common reductions with articles
    "d'": "de",      // Of
    "l'": "la",      // The (feminine)
    "pa'l": "para el", // For the
    "pa'la": "para la", // For the (feminine)
    "p'": "para",    // For
    "qu'": "que",    // That
    
    // Common combined contractions
    "na' que": "nada que", // Nothing that
    "to' lo": "todo lo",   // All the
    "pa' que": "para que", // So that
    "'ta bien": "está bien", // It's okay
    "'toy": "estoy",      // I am
    "'taba": "estaba",    // I/he/she was
    "'tamo": "estamos",   // We are
    "'taban": "estaban",  // They were
    "'tás": "estás",      // You are
    "'tá": "está",        // He/she/it is
    "d'un": "de un",      // Of a
    "d'el": "de él",      // Of him
    "m'a": "me ha",       // (He/she) has (done to) me
    "t'a": "te ha",       // (He/she) has (done to) you
    
    // Specific to song lyrics
    "bellaquit'": "bellaquita", // Cute/pretty
    "muñeq'": "muñeca",  // Doll/baby
    "fre'": "fresco",    // Fresh/cool
    "equi'": "equidad",  // Equity
    "exponentе": "exponente", // Exponent (fix for character issues)
    
    // Numbers
    "un'": "uno",        // One
    "do'": "dos",        // Two
    "tre'": "tres",      // Three
    "cua'": "cuatro",    // Four
    "cin'": "cinco",     // Five
    
    // Additional common contractions
    "ca'": "casa",       // House
    "mu'": "muy",        // Very
    "po'": "poco",       // Little
    "bue'": "bueno",     // Good
    "nue'": "nuevo",     // New
    "mal'": "malo",      // Bad
    "tra'": "tras",      // After
    "dí'": "día",        // Day
    "ta'bien": "también", // Also
};

/**
 * Preprocesses Spanish text to expand contractions while preserving original formatting
 * 
 * @param {string} text - Spanish text to preprocess
 * @returns {string} - Preprocessed text ready for translation
 */
const preprocessSpanishText = (text) => {
    if (!text || text.trim().length === 0) return "";
    
    // Normalize text to handle special characters and ensure consistent handling
    let normalizedText = text
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, c => c) // Keep accents but normalize them
        .trim();
    
    // Replace all contractions with their full forms
    let processedText = normalizedText;
    
    // Apply contractions mapping
    Object.entries(SPANISH_CONTRACTIONS).forEach(([contraction, fullForm]) => {
        // Word boundary pattern to prevent partial word matches
        const pattern = new RegExp(`\\b${contraction}\\b`, 'gi');
        processedText = processedText.replace(pattern, fullForm);
        
        // Also handle contractions at word boundaries with apostrophes
        const apostrophePattern = new RegExp(`\\b${contraction}'\\b`, 'gi');
        processedText = processedText.replace(apostrophePattern, fullForm);
    });
    
    // Special case: Handle standalone apostrophes at word ends that weren't caught
    processedText = processedText.replace(/(\w+)'(\s|$)/g, (match, word, ending) => {
        // Don't modify English contractions (e.g., don't, can't)
        if (/^(don|can|won|isn|aren|haven|hasn|wouldn|couldn|shouldn|didn|ain)$/.test(word.toLowerCase())) {
            return match;
        }
        
        // For Spanish words ending with apostrophes, attempt to expand them
        const possibleExpansion = SPANISH_CONTRACTIONS[word.toLowerCase() + "'"];
        return possibleExpansion ? possibleExpansion + ending : match;
    });
    
    // NO PERIODS ADDED - preserve original formatting exactly
    
    return processedText;
};

/**
 * Post-processes translated text to fix common issues while maintaining original formatting
 * 
 * @param {string} translatedText - Raw translation from DeepL
 * @returns {string} - Cleaned and improved translation
 */
const postprocessTranslation = (translatedText) => {
    if (!translatedText) return "Translation unavailable";
    
    let processed = translatedText;
    
    // Fix common DeepL translation artifacts without altering punctuation
    processed = processed
        .replace(/\|+/g, '') // Remove pipe characters
        .replace(/\s+/g, ' ') // Normalize whitespace
        .replace(/еre'/g, "are") // Fix specific untranslated contractions
        .replace(/exponentе/g, "exponent") // Fix character issues
        .replace(/equi'/g, "equity") // Fix specific case from example
        .trim();
    
    // Check for untranslated Spanish words that should have been translated
    const commonSpanishWords = [
        "la", "el", "los", "las", "un", "una", "es", "está", "estoy", 
        "eres", "soy", "tiene", "tengo", "quiere", "quiero", "hace",
        "hago", "va", "voy", "dice", "digo", "ve", "veo", "da", "doy"
    ];
    
    // If common Spanish words remain in the translation, log it for review
    const containsSpanishWords = commonSpanishWords.some(word => {
        // Check for whole word matches only
        const regex = new RegExp(`\\b${word}\\b`, 'i');
        return regex.test(processed);
    });
    
    if (containsSpanishWords) {
        console.log(`⚠️ Translation may contain untranslated Spanish words: "${processed}"`);
    }
    
    return processed;
};

/**
 * Translates an array of text lines using DeepL API with enhanced Spanish preprocessing
 * 
 * @param {Array} textArray - List of lines/texts to translate
 * @param {String} sourceLanguage - Language code (default: "es" for Spanish)
 * @returns {Array} Translated text lines (English)
 */
const translateBatch = async (textArray, sourceLanguage = "es") => {
    try {
        // Preprocess each line with Spanish-specific handling if source is Spanish
        const preparedArray = sourceLanguage.toLowerCase() === "es" 
            ? textArray.map(preprocessSpanishText)
            : textArray.map(text => text && text.trim().length > 0 ? text.trim() : "");
        
        // Filter out empty strings to avoid wasting API calls
        const filteredArray = preparedArray.filter(text => text && text.trim().length > 0);
        
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

        // Process translations
        const translations = response.data.translations.map(t => {
            return postprocessTranslation(t.text);
        });
        
        // Reinsert empty strings to maintain alignment with original array
        const result = [];
        let translationIndex = 0;
        
        for (let i = 0; i < textArray.length; i++) {
            const originalText = textArray[i];
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