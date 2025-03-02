const axios = require("axios");
const cheerio = require("cheerio");

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

        // Translation keyword patterns to detect in URLs
        const translationPatterns = [
            /translation/i,
            /traduccion/i,
            /traducción/i,
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
            /türkçe/i,
            /letra-de-.*?-en-/i, // Common pattern for translated lyrics
            /-en-ingles/i,
            /-en-espanol/i,
            /-en-español/i,
            /-in-english/i
        ];

        // Rank and sort hits by relevance
        const rankedHits = data.response.hits
            .filter(hit => hit.type === "song")
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
                
                // Check for any translation pattern indicators (negative score)
                for (const pattern of translationPatterns) {
                    if (pattern.test(url)) {
                        score -= 100; // Heavy penalty for translation indicators
                        break;
                    }
                }
                
                // Genius annotation URLs are preferred
                if (!url.includes("genius-annotated")) {
                    score -= 5;
                }
                
                // Shorter URLs likely indicate original content
                score -= urlPath.split("/").length;
                
                return { hit, score };
            })
            .sort((a, b) => b.score - a.score); // Sort by descending score

        // Check if we have any valid non-translation hits
        if (rankedHits.length === 0) {
            console.error(`❌ No valid hits found for: ${song} by ${artist}`);
            return null;
        }

        // Log information about top hit
        const bestHit = rankedHits[0].hit;
        console.log(`✅ Found URL: ${bestHit.result.url} (Score: ${rankedHits[0].score})`);
        
        return bestHit.result.url;
    } catch (error) {
        console.error("❌ Error fetching lyrics URL:", error.message);
        return null;
    }
};

/**
 * Scrape lyrics from a Genius lyrics URL with improved line break handling
 */
const scrapeLyrics = async (lyricsUrl) => {
    try {
        const { data } = await axios.get(lyricsUrl);
        const $ = cheerio.load(data);
        
        let lyrics = "";
        
        // Select the lyrics container
        const lyricsContainer = $('[data-lyrics-container="true"]');
        
        // Process each element in the lyrics container
        lyricsContainer.each((_, container) => {
            $(container).find('br').replaceWith('\n'); // Replace <br> tags with newlines
            
            // Process each direct child of the lyrics container
            $(container).contents().each((_, node) => {
                if (node.type === 'text') {
                    // Add text nodes directly
                    lyrics += $(node).text();
                } else if (node.name === 'a' || node.name === 'span' || node.name === 'i') {
                    // Handle inline elements that contain lyrics
                    lyrics += $(node).text();
                } else if (node.name === 'div') {
                    // New line for div elements (usually line breaks in Genius)
                    if (lyrics && !lyrics.endsWith('\n')) {
                        lyrics += '\n';
                    }
                    lyrics += $(node).text() + '\n';
                }
            });
            
            // Add a newline after each container
            if (!lyrics.endsWith('\n')) {
                lyrics += '\n';
            }
        });
        
        // Remove section markers like [Verse], [Chorus], etc.
        lyrics = lyrics.replace(/\[.*?\]\n?/g, "");
        
        // Clean up multiple consecutive newlines
        lyrics = lyrics.replace(/\n\s*\n\s*\n+/g, "\n\n");
        
        // Process each line for optimal translation
        lyrics = lyrics.split('\n')
                       .map(line => {
                          // Trim whitespace
                          line = line.trim();
                          
                          // Handle lines with apostrophes (common in Spanish lyrics with elisions)
                          // e.g., "e'" becomes "es", "pa'" becomes "para"
                          line = line.replace(/ e'(\s|$)/g, " es$1")
                                     .replace(/ pa'(\s|$)/g, " para$1")
                                     .replace(/ to'(\s|$)/g, " todo$1")
                                     .replace(/ na'(\s|$)/g, " nada$1")
                                     .replace(/ 'ta(\s|$)/g, " esta$1")
                                     .replace(/ 'toy /g, " estoy ")
                                     .replace(/ da'(\s|$)/g, " dar$1");
                                     
                          return line;
                       })
                       // Only filter out truly empty lines
                       .filter(line => line.length > 0 && /[a-zA-Z0-9áéíóúüñÁÉÍÓÚÜÑ]/.test(line))
                       .join('\n')
                       .trim();
        
        return lyrics;
    } catch (error) {
        console.error("❌ Error scraping lyrics:", error.message);
        return null;
    }
};

module.exports = { fetchLyricsUrl, scrapeLyrics };