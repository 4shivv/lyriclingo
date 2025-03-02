const axios = require("axios");
const cheerio = require("cheerio");

const fetchLyricsUrl = async (song, artist) => {
    // ✅ Normalize accents (e.g., "Qué" → "Que") for better matching
    const normalizedSong = song.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    const normalizedArtist = artist.normalize("NFD").replace(/[\u0300-\u036f]/g, "");

    // ✅ Encode search query properly
    const searchQuery = encodeURIComponent(`${normalizedArtist} ${normalizedSong}`);
    const searchUrl = `https://genius.com/api/search?q=${searchQuery}`;

    try {
        const { data } = await axios.get(searchUrl);

        // ✅ Format song title the way Genius does in URLs (replace spaces with dashes)
        const formattedSongForUrl = normalizedSong
            .toLowerCase()
            .replace(/\s+/g, "-") // Replace spaces with dashes
            .replace(/[^a-z0-9-]/g, ""); // Remove special characters

        // 🔍 Find valid song that matches Genius URL formatting
        const validHit = data.response.hits.find(hit => 
            hit.type === "song" &&
            !hit.result.url.includes("genius-english-translations") &&  // ❌ Exclude translations
            !hit.result.url.includes("traduccion") &&
            !hit.result.url.includes("deutsche-ubersetzungen") && // ❌ Exclude German translations
            !hit.result.url.includes("traducción") &&
            !hit.result.url.includes("portugues") && // ❌ Exclude Portuguese translations
            !hit.result.url.includes("francais") &&  // ❌ Exclude French translations
            !hit.result.url.includes("translation") &&
            !hit.result.url.includes("turkce-ceviri") &&  // ❌ Exclude Turkish translations
            hit.result.url.toLowerCase().includes(formattedSongForUrl) // ✅ Ensure correct song match in URL
        );

        if (!validHit) {
            console.error(`❌ No valid Spanish lyrics found for: ${song} ${artist}`);
            return null;
        }

        console.log(`✅ Found Spanish Lyrics URL: ${validHit.result.url}`);
        return validHit.result.url; // ✅ Returns correct Spanish lyrics URL

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