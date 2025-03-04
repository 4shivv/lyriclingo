const axios = require("axios");
const cheerio = require("cheerio");

/**
 * Fetch original song lyrics URL from Genius API
 * 
 * Strictly filters out all translation variants
 * 
 * @param {string} song - Song title
 * @param {string} artist - Artist name
 * @returns {string|null} - URL to original lyrics or null if not found
 */
const fetchLyricsUrl = async (song, artist) => {
    // Normalize accents for better matching
    const normalizedSong = song.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    const normalizedArtist = artist.normalize("NFD").replace(/[\u0300-\u036f]/g, "");

    // Encode search query
    const searchQuery = encodeURIComponent(`${normalizedArtist} ${normalizedSong}`);
    const searchUrl = `https://genius.com/api/search?q=${searchQuery}`;

    try {
        const { data } = await axios.get(searchUrl);
        
        if (!data.response.hits || data.response.hits.length === 0) {
            console.error(`❌ No results found for: ${song} by ${artist}`);
            return null;
        }

        // Format song title for URL matching
        const formattedSongForUrl = normalizedSong
            .toLowerCase()
            .replace(/\s+/g, "-")
            .replace(/[^a-z0-9-]/g, "");
            
        // Format artist name for URL matching
        const formattedArtistForUrl = normalizedArtist
            .toLowerCase()
            .replace(/\s+/g, "-")
            .replace(/[^a-z0-9-]/g, "");

        // Genius username/channel patterns that indicate translations
        const translationChannelPatterns = [
            /genius-brasil/i,
            /genius-english-translations/i,
            /genius-traducciones/i,
            /genius-deutsche/i,
            /genius-polska/i,
            /genius-italia/i,
            /genius-france/i,
            /genius-turkce/i,
            /genius-translations/i,
            /genius-espanol/i,
            /genius-russian/i
        ];
        
        // Translation keyword patterns to detect in URLs
        const translationKeywordPatterns = [
            /traducoes/i,
            /traducao/i,
            /traducción/i,
            /traduccion/i,
            /translation/i,
            /ubersetzung/i,
            /terjemahan/i,
            /traduzione/i,
            /vertaling/i,
            /traduction/i,
            /oversattelse/i,
            /prijevod/i,
            /oversættelse/i,
            /prevod/i,
            /perkthim/i,
            /forditas/i,
            /fordítás/i,
            /tlumaczenie/i,
            /tłumaczenie/i,
            /tradução/i,
            /perevod/i,
            /çeviri/i,
            /ceviri/i,
            /turkce/i,
            /türkçe/i
        ];
        
        // Translation language indicator patterns
        const translationLanguagePatterns = [
            /-em-portugues/i,
            /-en-ingles/i,
            /-en-espanol/i,
            /-en-español/i,
            /-in-english/i,
            /-на-русском/i,
            /-em-português/i,
            /-en-français/i,
            /-auf-deutsch/i,
            /-in-italiano/i,
            /-in-het-nederlands/i,
            /-на-български/i,
            /-po-polsku/i,
            /-turkce-ceviri/i,
            /-letra-y-traduccion/i
        ];

        console.log(`🔍 Found ${data.response.hits.length} hits for: ${song} by ${artist}`);

        // First, strictly filter out ANY translation URLs
        const nonTranslationHits = data.response.hits
            .filter(hit => hit.type === "song")
            .filter(hit => {
                const url = hit.result.url.toLowerCase();
                const urlPath = new URL(url).pathname;
                
                // Check for translation channel patterns
                for (const pattern of translationChannelPatterns) {
                    if (pattern.test(urlPath)) {
                        console.log(`❌ Rejected translation channel URL: ${url}`);
                        return false;
                    }
                }
                
                // Check for translation keyword patterns
                for (const pattern of translationKeywordPatterns) {
                    if (pattern.test(urlPath)) {
                        console.log(`❌ Rejected translation keyword URL: ${url}`);
                        return false;
                    }
                }
                
                // Check for language indicator patterns
                for (const pattern of translationLanguagePatterns) {
                    if (pattern.test(urlPath)) {
                        console.log(`❌ Rejected language indicator URL: ${url}`);
                        return false;
                    }
                }
                
                return true;
            });
        
        console.log(`✅ Found ${nonTranslationHits.length} non-translation hits`);
        
        // If no non-translation hits, try to find original lyrics by domain-specific heuristics
        if (nonTranslationHits.length === 0) {
            console.log(`⚠️ No non-translation hits found, attempting fallback strategy...`);
            
            // Look specifically for the simplest URL that might be original lyrics
            const possibleOriginal = data.response.hits
                .filter(hit => hit.type === "song")
                .find(hit => {
                    const url = hit.result.url.toLowerCase();
                    // Simplest Genius URL structure is often: domain/artist-name-song-title-lyrics
                    return url.split('/').length <= 4 && url.endsWith('-lyrics');
                });
                
            if (possibleOriginal) {
                console.log(`🔍 Found possible original lyrics URL: ${possibleOriginal.result.url}`);
                return possibleOriginal.result.url;
            }
            
            console.error(`❌ Could not find any suitable lyrics URL for: ${song} by ${artist}`);
            return null;
        }
                
        // Now rank and score the non-translation hits
        const rankedHits = nonTranslationHits
            .map(hit => {
                const url = hit.result.url.toLowerCase();
                const urlPath = new URL(url).pathname;
                
                // Scoring system: Higher is better
                let score = 0;
                
                // Basic match for both artist and song in URL path
                if (urlPath.includes(formattedArtistForUrl) && urlPath.includes(formattedSongForUrl)) {
                    score += 50;
                }
                
                // URL contains song name formatted properly (highest priority)
                if (urlPath.includes(formattedSongForUrl)) {
                    score += 30;
                }
                
                // URL contains artist name formatted properly
                if (urlPath.includes(formattedArtistForUrl)) {
                    score += 20;
                }
                
                // Prefer simpler URL structures (fewer path segments)
                const pathSegments = urlPath.split('/').length;
                if (pathSegments <= 3) score += 15;
                else if (pathSegments <= 4) score += 10;
                else score += 5;
                
                // Prefer URLs that don't have hyphens beyond those needed for artist and song name
                const hyphenCount = (urlPath.match(/-/g) || []).length;
                const expectedHyphens = formattedArtistForUrl.split('-').length + 
                                       formattedSongForUrl.split('-').length;
                if (hyphenCount <= expectedHyphens + 1) score += 10;
                
                return { hit, score };
            })
            .sort((a, b) => b.score - a.score); // Sort by descending score

        // Log information about top hit
        const bestHit = rankedHits[0].hit;
        console.log(`✅ Found original lyrics URL: ${bestHit.result.url} (Score: ${rankedHits[0].score})`);
        
        // Double-check the URL one more time
        const finalUrl = bestHit.result.url.toLowerCase();
        
        // Final safety check for any translation indicators we might have missed
        if (finalUrl.includes('traducao') || 
            finalUrl.includes('traducción') || 
            finalUrl.includes('translation') ||
            finalUrl.includes('tradução')) {
            console.error(`⚠️ Potential translation URL detected in final check: ${bestHit.result.url}`);
            
            // If we have other hits, try the next best one
            if (rankedHits.length > 1) {
                const nextBestHit = rankedHits[1].hit;
                console.log(`🔄 Trying next best hit: ${nextBestHit.result.url}`);
                return nextBestHit.result.url;
            }
            
            return null;
        }
        
        return bestHit.result.url;
    } catch (error) {
        console.error("❌ Error fetching lyrics URL:", error.message);
        return null;
    }
};

/**
 * Scrape lyrics from a Genius lyrics URL with improved HTML handling
 */
const scrapeLyrics = async (lyricsUrl) => {
    try {
        const { data } = await axios.get(lyricsUrl);
        const $ = cheerio.load(data);
        
        let lyrics = "";
        
        // Select the lyrics container with data-lyrics-container attribute
        const lyricsContainer = $('[data-lyrics-container="true"]');
        
        // Process each element in the lyrics container
        lyricsContainer.each((_, container) => {
            // First replace all <br> tags with newlines for proper line breaks
            $(container).find('br').replaceWith('\n');
            
            // Process the HTML content of the container
            const html = $(container).html();
            if (!html) return;
            
            // Convert HTML to text with proper line breaks
            // This ensures we capture all text, including text within tags like <i>
            let processedText = html
                // Replace closing tags followed by quotes with line breaks
                .replace(/<\/[^>]+>"([^<])/g, '"\n$1')
                // Replace opening quotes with line breaks when appropriate
                .replace(/"([^"]+)"/g, '\n"$1"')
                // Handle other tag closures with line breaks when needed
                .replace(/<\/[^>]+>([A-Z])/g, '\n$1')
                // Get text content while preserving line breaks
                .replace(/<[^>]+>/g, '');
            
            // Clean up multiple consecutive newlines and add to lyrics
            processedText = processedText
                .replace(/\n\s*\n\s*\n+/g, '\n\n')
                .trim();
                
            lyrics += processedText + '\n';
        });
        
        // Process the lyrics text for optimal song structure
        lyrics = lyrics
            // Remove section markers like [Verse], [Chorus], etc. if needed
            // .replace(/\[.*?\]\n?/g, "")
            // Keep section markers for now, they'll be filtered later
            
            // Clean up multiple consecutive newlines
            .replace(/\n\s*\n\s*\n+/g, '\n\n')
            // Ensure each line is properly separated
            .split('\n')
            .map(line => line.trim())
            .join('\n')
            .trim();
        
        return lyrics;
    } catch (error) {
        console.error("❌ Error scraping lyrics:", error.message);
        return null;
    }
};

module.exports = { fetchLyricsUrl, scrapeLyrics };