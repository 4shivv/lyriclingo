const axios = require("axios");

/**
 * Language detection module for automatic source language identification
 * Uses common language patterns and character frequency analysis
 */
const languageDetector = {
  // ISO-639-1 language codes supported by DeepL API
  supportedLanguages: {
    "BG": { name: "Bulgarian", patterns: /[а-яА-Я]/ },
    "CS": { name: "Czech", patterns: /[ěščřžýáíéóúůďťňĎŇŤŠČŘŽÝÁÍÉÚŮ]/ },
    "DA": { name: "Danish", patterns: /[æøåÆØÅ]/ },
    "DE": { name: "German", patterns: /[äöüÄÖÜß]/ },
    "EL": { name: "Greek", patterns: /[\u0370-\u03FF\u1F00-\u1FFF]/ },
    "ES": { name: "Spanish", patterns: /[áéíóúüñ¿¡]/ },
    "ET": { name: "Estonian", patterns: /[äõöüÄÕÖÜ]/ },
    "FI": { name: "Finnish", patterns: /[äöÄÖ]/ },
    "FR": { name: "French", patterns: /[àâäæçéèêëîïôœùûüÿÀÂÄÆÇÉÈÊËÎÏÔŒÙÛÜŸ]/ },
    "HU": { name: "Hungarian", patterns: /[áéíóöőúüűÁÉÍÓÖŐÚÜŰ]/ },
    "ID": { name: "Indonesian", patterns: null }, // Using frequency analysis
    "IT": { name: "Italian", patterns: /[àèéìíîòóùúÀÈÉÌÍÎÒÓÙÚ]/ },
    "JA": { name: "Japanese", patterns: /[\u3040-\u30FF\u3400-\u4DBF\u4E00-\u9FFF]/ },
    "KO": { name: "Korean", patterns: /[\uAC00-\uD7AF\u1100-\u11FF]/ },
    "LT": { name: "Lithuanian", patterns: /[ąčęėįšųūžĄČĘĖĮŠŲŪŽ]/ },
    "LV": { name: "Latvian", patterns: /[āčēģīķļņšūžĀČĒĢĪĶĻŅŠŪŽ]/ },
    "NB": { name: "Norwegian", patterns: /[æøåÆØÅ]/ },
    "NL": { name: "Dutch", patterns: /[áéíóúëïöüÁÉÍÓÚËÏÖÜ]/ },
    "PL": { name: "Polish", patterns: /[ąćęłńóśźżĄĆĘŁŃÓŚŹŻ]/ },
    "PT": { name: "Portuguese", patterns: /[áàâãéêíóôõúçÁÀÂÃÉÊÍÓÔÕÚÇ]/ },
    "RO": { name: "Romanian", patterns: /[ăâîșțĂÂÎȘȚ]/ },
    "RU": { name: "Russian", patterns: /[а-яА-Я]/ },
    "SK": { name: "Slovak", patterns: /[áäčďéíĺľňóôŕšťúýžÁÄČĎÉÍĹĽŇÓÔŔŠŤÚÝŽ]/ },
    "SL": { name: "Slovenian", patterns: /[čšžĆŠŽ]/ },
    "SV": { name: "Swedish", patterns: /[åäöÅÄÖ]/ },
    "TR": { name: "Turkish", patterns: /[çğıİöşüÇĞÖŞÜ]/ },
    "UK": { name: "Ukrainian", patterns: /[а-яА-ЯіїґєІЇҐЄ]/ },
    "ZH": { name: "Chinese", patterns: /[\u3400-\u9FFF\uF900-\uFAFF]/ }
  },

  // Frequent words by language to help with languages that use Latin script without distinctive diacritics
  frequentWords: {
    "ES": ["el", "la", "de", "que", "y", "en", "un", "ser", "se", "no", "por", "con", "para", "como", "pero", "más", "yo", "si", "bien", "esto", "todo", "esta", "cuando", "hay", "así", "muy", "sin", "sobre", "también", "me", "hasta", "desde", "nos", "durante", "ni", "contra", "ese", "este"],
    "PT": ["o", "a", "de", "que", "e", "é", "do", "da", "em", "um", "para", "com", "não", "uma", "os", "no", "se", "na", "por", "mais", "as", "dos", "como", "mas", "ao", "ele", "das", "à", "seu", "sua", "ou", "quando", "muito", "nos", "já", "eu", "também", "só", "pelo", "pela", "até", "isso", "ela", "entre", "depois", "sem", "mesmo", "aos", "seus", "quem", "nas", "me", "esse", "esses", "está", "você", "te"],
    "FR": ["le", "la", "de", "et", "un", "à", "être", "ce", "il", "que", "en", "du", "elle", "au", "qui", "ne", "sur", "se", "par", "pas", "pour", "avec", "plus", "mais", "ou", "si", "mon", "ton", "son", "nous", "vous", "dans", "leur", "me", "te", "je", "tu", "ils", "cette", "ces", "des", "tout"],
    "IT": ["il", "la", "di", "e", "un", "a", "è", "che", "in", "per", "non", "sono", "mi", "si", "ho", "ma", "lo", "ha", "con", "ti", "se", "da", "tu", "ci", "al", "così", "bene", "come", "uno", "io", "lei", "lui", "suo", "sua", "mio", "mia", "del", "della", "tutto", "qui", "perché", "quando", "sei", "anche", "più", "solo", "fatto", "ancora", "tempo"],
    "ID": ["yang", "dan", "akan", "dengan", "untuk", "pada", "tidak", "dari", "saya", "ini", "mereka", "itu", "ada", "anda", "dalam", "bisa", "kami", "dia", "kita", "juga", "sudah", "satu", "atau", "hanya", "oleh", "tapi", "ke", "kamu", "jika", "aku", "ya", "tersebut", "adalah", "di", "tahun", "belum", "lagi", "saja", "telah", "dapat"]
  },

  // Language ID confidence thresholds
  confidenceThresholds: {
    patternMatch: 0.3,  // Minimum percentage of text that should match patterns
    wordMatch: 0.2      // Minimum percentage of words that should match frequent word lists
  },

  /**
   * Detects language based on text characteristics
   * 
   * @param {string} text - Text to analyze
   * @return {string} - ISO 639-1 language code (e.g., "ES", "FR", "JA")
   */
  detectLanguage(text) {
    if (!text || typeof text !== 'string' || text.trim().length === 0) {
      return "ES"; // Default to Spanish if no text or invalid input
    }

    const normalizedText = text.trim().toLowerCase();
    
    // Step 1: Fast pattern-based detection for languages with unique scripts or diacritics
    for (const [langCode, langData] of Object.entries(this.supportedLanguages)) {
      if (langData.patterns && langData.patterns.test(normalizedText)) {
        // Calculate the match percentage for characters with this pattern
        const matchCount = normalizedText.split('')
          .filter(char => langData.patterns.test(char)).length;
        
        const matchPercentage = matchCount / normalizedText.length;
        
        // If enough of the text matches the pattern, we have a high confidence
        if (matchPercentage > this.confidenceThresholds.patternMatch) {
          console.log(`🔍 Language detected as ${langData.name} (${langCode}) based on character patterns`);
          return langCode;
        }
      }
    }
    
    // Step 2: Word frequency analysis for similar script languages (Spanish, Portuguese, etc.)
    const words = normalizedText.split(/\s+/);
    
    const langScores = {};
    
    for (const [langCode, wordList] of Object.entries(this.frequentWords)) {
      // Count how many words from this text appear in the frequent words list
      const matchCount = words.filter(word => 
        wordList.includes(word.replace(/[.,!?;:]/g, ''))
      ).length;
      
      // Calculate match percentage
      const matchPercentage = matchCount / words.length;
      langScores[langCode] = matchPercentage;
    }
    
    // Find the language with the highest word match score
    const bestMatch = Object.entries(langScores)
      .filter(([_, score]) => score > this.confidenceThresholds.wordMatch)
      .sort(([_, scoreA], [__, scoreB]) => scoreB - scoreA)[0];
    
    if (bestMatch) {
      const [langCode, score] = bestMatch;
      console.log(`🔍 Language detected as ${this.supportedLanguages[langCode].name} (${langCode}) based on word frequency (${Math.round(score * 100)}% confidence)`);
      return langCode;
    }
    
    // Step 3: Fallback to Spanish if no clear language is detected
    console.log(`⚠️ Language detection inconclusive, using default: Spanish (ES)`);
    return "ES";
  }
};

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
    "pa'cá": "acá", // Converts "pa'cá" to "acá"
};

/**
 * Language-specific preprocessing handlers for cleaning up text before translation
 */
const languagePreprocessors = {
  // Spanish preprocessor - handles contractions and linguistic artifacts
  "ES": (text) => {
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
  },

  // French preprocessor - handles common contractions
  "FR": (text) => {
    if (!text || text.trim().length === 0) return "";
    
    // Normalize text
    const normalizedText = text.trim();
    
    // Handle French contractions
    return normalizedText
      // Common apostrophe contractions: j'ai -> je ai, l'amour -> le amour
      .replace(/([cdjlmnst])'([a-zéèêëàâäôöùûüÿçœæ])/gi, "$1e $2")
      // Handle "qu'" -> "que "
      .replace(/qu'([a-zéèêëàâäôöùûüÿçœæ])/gi, "que $1");
  },

  // Portuguese preprocessor
  "PT": (text) => {
    if (!text || text.trim().length === 0) return "";
    
    // Handle Portuguese contractions
    return text
      // Common contractions: "d'água" -> "de água", "n'água" -> "na água"
      .replace(/d'([áàâãéêíóôõú])/gi, "de $1")
      .replace(/n'([áàâãéêíóôõú])/gi, "na $1");
  },
  
  // Default preprocessor for languages without specific handlers
  "default": (text) => text?.trim() || ""
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
 * Preprocesses text based on detected language before translation
 * 
 * @param {string} text - Source text to preprocess
 * @param {string} languageCode - ISO 639-1 language code (e.g., "ES", "FR")
 * @returns {string} - Preprocessed text ready for translation
 */
const preprocessSourceText = (text, languageCode) => {
    // Use the language-specific preprocessor if available, otherwise use default
    const preprocessor = languagePreprocessors[languageCode] || languagePreprocessors.default;
    return preprocessor(text);
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
        "la", "el", "de", "que", "y", "en", "un", "ser", "se", "no", "por", "con", "para", "como", "pero", "más", "yo", "si", "bien", "esto", "todo", "esta", "cuando", "hay", "así", "muy", "sin", "sobre", "también", "me", "hasta", "desde", "nos", "durante", "ni", "contra", "ese", "este"
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
 * Basic English detection for phrases within foreign songs
 * @param {string} text - Text to analyze
 * @return {boolean} - True if text appears to be primarily English
 */
const isEnglishPhrase = (text) => {
  // Skip short text
  if (!text || text.length < 3) return false;
  
  // Common English words that strongly indicate English content
  const englishMarkers = [
    /\b(the|and|are|you|for|this|that|with|have|from|what|when|where|will|would|could|should)\b/i,
    /\b(love|baby|heart|tonight|forever|never|always|because|without|everything|something)\b/i,
    // Common English pronouns
    /\b(i|me|my|mine|you|your|yours|we|our|ours|they|their|theirs|he|his|him|she|her|hers|it|its)\b/i
  ];
  
  // Count how many English markers are found
  const englishMarkerCount = englishMarkers.filter(pattern => pattern.test(text)).length;
  
  // Get word count
  const wordCount = text.split(/\s+/).length;
  
  // Text is likely English if:
  // 1. For short phrases (1-3 words): at least 1 English marker
  // 2. For medium phrases (4-6 words): at least 2 English markers
  // 3. For longer phrases: at least 30% of patterns match
  if (wordCount <= 3) return englishMarkerCount >= 1;
  if (wordCount <= 6) return englishMarkerCount >= 2;
  return (englishMarkerCount / englishMarkers.length) > 0.3;
};

/**
 * Translates an array of text lines using DeepL API with language auto-detection
 * 
 * @param {Array} textArray - List of lines/texts to translate
 * @param {String} forceLanguage - Force specific language code (skip detection)
 * @returns {Array} Translated text lines (English)
 */
const translateBatch = async (textArray, forceLanguage = null) => {
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

        // Detect language from the combined text for consistent results
        // unless forceLanguage is provided
        const sourceLanguage = forceLanguage || 
            languageDetector.detectLanguage(uniqueArray.join(" "));
        
        console.log(`🔤 Source language detected/set: ${sourceLanguage}`);
        
        // Preprocess each unique line with language-specific handling
        const preparedArray = uniqueArray.map(text => {
            const trimmedText = text.trim();
            
            // Check if the line appears to be English already
            if (isEnglishPhrase(trimmedText)) {
                console.log(`🇬🇧 Preserving English phrase: "${trimmedText}"`);
                // Mark this text for skipping translation
                return { text: trimmedText, skipTranslation: true };
            }
            
            // Process normally for translation
            return { 
                text: preprocessSourceText(trimmedText, sourceLanguage),
                skipTranslation: false 
            };
        });
            
        // Separate texts for translation and those to preserve as-is
        const textsToTranslate = preparedArray.filter(item => !item.skipTranslation).map(item => item.text);
        const preservedTexts = new Map(); // Map original text position to preserved text

        preparedArray.forEach((item, index) => {
            if (item.skipTranslation) {
                preservedTexts.set(index, item.text);
            }
        });
        
        // Modify the params creation to only include texts that need translation
        const params = new URLSearchParams();
        params.append("auth_key", DEEPL_API_KEY);
        textsToTranslate.forEach(text => params.append("text", text));
        params.append("source_lang", sourceLanguage);
        params.append("target_lang", "EN");
        params.append("preserve_formatting", "1");
        
        // Call the translation API with unique texts only
        const response = await axios.post(
            "https://api-free.deepl.com/v2/translate",
            params.toString(),
            { headers: { "Content-Type": "application/x-www-form-urlencoded" } }
        );
        
        // After receiving API response, merge with preserved English phrases

        // Create full translations array in original order
        const uniqueTranslations = [];
        let translationIndex = 0;

        preparedArray.forEach((item, index) => {
            if (item.skipTranslation) {
                // Use the preserved English text
                uniqueTranslations[index] = preservedTexts.get(index);
            } else {
                // Use the API translation
                uniqueTranslations[index] = postprocessTranslation(response.data.translations[translationIndex].text);
                translationIndex++;
            }
        });
        
        // Map translations back to original structure
        const result = textArray.map((text, index) => {
            // Handle empty strings
            if (indexMapping[index] === -1) return "";
            
            // Map back to the corresponding unique translation
            return uniqueTranslations[indexMapping[index]];
        });
        
        console.log(`✅ Translated ${uniqueArray.length} unique lines from ${languageDetector.supportedLanguages[sourceLanguage]?.name || sourceLanguage} to English successfully`);
        
        return result;
    } catch (error) {
        console.error("❌ Translation Error:", error.response?.data || error.message);
        return textArray.map(() => "Translation unavailable");
    }
};

module.exports = { translateBatch, languageDetector };