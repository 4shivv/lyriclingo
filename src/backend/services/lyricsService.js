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
 * Scrape lyrics from a Genius lyrics URL
 */
const scrapeLyrics = async (lyricsUrl) => {
    try {
        const { data } = await axios.get(lyricsUrl);
        const $ = cheerio.load(data);

        let lyrics = "";
        $("div[data-lyrics-container='true']").each((_, element) => {
            lyrics += $(element).text() + "\n";
        });

        return lyrics.trim();
    } catch (error) {
        console.error("❌ Error scraping lyrics:", error.message);
        return null;
    }
};

module.exports = { fetchLyricsUrl, scrapeLyrics };