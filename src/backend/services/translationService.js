const axios = require("axios");

const DEEPL_API_KEY = process.env.DEEPL_API_KEY;

/**
 * Comprehensive mapping of Spanish song contractions to their full forms
 * Includes verb conjugations, articles, and common expressions
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
    
    // Estar (to be) contractions - Comprehensive list with variations
    "tar": "estar",   // To be
    "'tar": "estar",  // To be with apostrophe
    "tamo": "estamos", // We are
    "'tamo": "estamos", // We are with apostrophe
    "tamos": "estamos", // We are
    "'tamos": "estamos", // We are with apostrophe
    "taba": "estaba",  // He/she/I was
    "'taba": "estaba", // He/she/I was with apostrophe
    "taban": "estaban", // They were
    "'taban": "estaban", // They were with apostrophe
    "tao": "estado",   // Been (past participle)
    "'tao": "estado",  // Been with apostrophe
    "tando": "estando", // Being
    "'tando": "estando", // Being with apostrophe
    
    // Second-person contractions (critical for song lyrics)
    "quiere'": "quieres", // You want
    "tiene'": "tienes",   // You have
    "puede'": "puedes",   // You can
    "sabe'": "sabes",     // You know
    "viene'": "vienes",   // You come
    "hace'": "haces",     // You do/make
    "dice'": "dices",     // You say
    "sale'": "sales",     // You leave
    "pone'": "pones",     // You put
    "baila'": "bailas",   // You dance
    "canta'": "cantas",   // You sing
    "habla'": "hablas",   // You speak
    "mira'": "miras",     // You look
    "escucha'": "escuchas", // You listen
    "llama'": "llamas",   // You call
    "busca'": "buscas",   // You search
    "siente'": "sientes", // You feel
    "piensa'": "piensas", // You think
    "entra'": "entras",   // You enter
    "toca'": "tocas",     // You touch/play
    
    // First-person contractions
    "quie'": "quiere", // He/she/it wants
    "sie'": "siente", // He/she/it feels
    "tie'": "tiene", // He/she/it has
    "vie'": "viene", // He/she/it comes
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
    
    // Special case verb phrases
    "dar todo": "darás todo", // You will give everything
    "dar más": "darás más",   // You will give more
    "dar menos": "darás menos", // You will give less
    
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
 * Calculates statistics on deduplication efficiency
 * 
 * @param {Array<string>} textArray - Array of text lines
 * @returns {Object} Statistics on deduplication
 */
const getDeduplicationStats = (textArray) => {
    if (!textArray || textArray.length === 0) return { total: 0, unique: 0, saved: 0 };
    
    // Count non-empty lines
    const nonEmptyLines = textArray.filter(text => text && text.trim().length > 0);
    
    // Count unique lines
    const uniqueLines = new Set(nonEmptyLines.map(text => text.trim()));
    
    return {
        total: nonEmptyLines.length,
        unique: uniqueLines.size,
        saved: nonEmptyLines.length - uniqueLines.size,
        percentSaved: Math.round(((nonEmptyLines.length - uniqueLines.size) / nonEmptyLines.length) * 100)
    };
};

/**
 * Preprocesses Spanish text to expand contractions and handle contextual patterns
 * Enhanced with better handling of estar contractions like "tar" and "'tar"
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
    
    // Pre-process special estar contractions with more specific patterns
    // Handle the 'tar' pattern at word boundaries with potential apostrophes
    normalizedText = normalizedText
        // Handle start of line or after space
        .replace(/(^|\s)('?)tar\b/gi, "$1estar")
        // Handle 'Tar' at beginning of sentences (capitalized)
        .replace(/(^|\s)('?)Tar\b/g, "$1Estar");
    
    // Apply contractions mapping
    let processedText = normalizedText;
    
    // Apply each contraction in the mapping
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
    
    // Handle contextual patterns with specific verb forms and reflexive structures
    const contextualPatterns = [
        // "si me baila'" → "si bailas para mí" (If you dance for me)
        [/\bsi me ([a-zá-úñ]+)'\b/gi, "si $1s para mí"],  
        
        // "me lo dar" → "me lo darás" (You will give it to me)
        [/\bme lo dar\b/gi, "me lo darás"],               
        
        // "te lo dar" → "te lo daré" (I will give it to you)
        [/\bte lo dar\b/gi, "te lo daré"],                
        
        // "si me das" → "si me das" (If you give me)
        [/\bsi me das\b/gi, "si me das"],
        
        // "dar todo" → "darás todo" (You will give everything)
        [/\bdar todo\b/gi, "darás todo"],
        
        // "lo dar" → "lo darás" (You will give it)
        [/\blo dar\b/gi, "lo darás"]
    ];

    contextualPatterns.forEach(([pattern, replacement]) => {
        processedText = processedText.replace(pattern, replacement);
    });
    
    return processedText;
};

/**
 * Post-processes translated text to fix common issues and artifacts
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
    
    // Fix common mistranslations for specific phrases
    const postProcessingPatterns = [
        // Fix common mistranslations
        [/If I dance for me/gi, "If you dance for me"],
        [/If I dance'/gi, "If you dance"],
        [/I'll give it all to me/gi, "I'll give you everything"],
        [/I will give it all to me/gi, "I will give you everything"],
        // Fix tar/estar mistranslations
        [/\btar\b/gi, "being"],
        [/\btar\s/gi, "being "],
        [/\bTar\b/gi, "Being"]
    ];
    
    postProcessingPatterns.forEach(([pattern, replacement]) => {
        processed = processed.replace(pattern, replacement);
    });
    
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
 * Translates an array of text lines using DeepL API with optimized handling of duplicates
 * 
 * @param {Array} textArray - List of lines/texts to translate
 * @param {String} sourceLanguage - Language code (default: "es" for Spanish)
 * @returns {Array} Translated text lines (English)
 */
const translateBatch = async (textArray, sourceLanguage = "es") => {
    try {
        // Create index mapping for deduplication while preserving order
        const uniqueTexts = new Map(); // Map of unique text -> index in uniqueArray
        const uniqueArray = []; // Array of unique texts
        const indexMapping = []; // Maps original indices to positions in uniqueArray
        
        // Build deduplication structures
        textArray.forEach((text, index) => {
            if (!text || text.trim().length === 0) {
                indexMapping.push(-1); // Marker for empty strings
                return;
            }
            
            const trimmedText = text.trim();
            if (!uniqueTexts.has(trimmedText)) {
                uniqueTexts.set(trimmedText, uniqueArray.length);
                uniqueArray.push(trimmedText);
            }
            
            indexMapping.push(uniqueTexts.get(trimmedText));
        });
        
        // Calculate and log deduplication stats
        const stats = getDeduplicationStats(textArray);
        console.log(`🔍 Deduplication: ${stats.total} lines → ${stats.unique} unique lines (saved ${stats.percentSaved}% API usage)`);
        
        // Skip processing if no valid texts
        if (uniqueArray.length === 0) {
            return textArray.map(() => "");
        }
        
        // Preprocess each unique line with Spanish-specific handling
        const preparedArray = sourceLanguage.toLowerCase() === "es" 
            ? uniqueArray.map(preprocessSpanishText)
            : uniqueArray.map(text => text.trim());
            
        // Create the params object with unique texts only
        const params = new URLSearchParams();
        params.append("auth_key", DEEPL_API_KEY);
        preparedArray.forEach(text => params.append("text", text));
        params.append("source_lang", sourceLanguage.toUpperCase());
        params.append("target_lang", "EN");
        params.append("preserve_formatting", "1");
        
        // Call the translation API with unique texts only
        const response = await axios.post(
            "https://api-free.deepl.com/v2/translate",
            params.toString(),
            { headers: { "Content-Type": "application/x-www-form-urlencoded" } }
        );
        
        // Process unique translations
        const uniqueTranslations = response.data.translations.map(t => 
            postprocessTranslation(t.text)
        );
        
        // Map translations back to original structure
        const result = textArray.map((text, index) => {
            // Handle empty strings
            if (indexMapping[index] === -1) return "";
            
            // Map back to the corresponding unique translation
            return uniqueTranslations[indexMapping[index]];
        });
        
        console.log(`✅ Translated ${uniqueArray.length} unique lines successfully`);
        
        return result;
    } catch (error) {
        console.error("❌ Translation Error:", error.response?.data || error.message);
        return textArray.map(() => "Translation unavailable");
    }
};

module.exports = { translateBatch };