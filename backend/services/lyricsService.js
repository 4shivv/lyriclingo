const axios = require("axios");
const cheerio = require("cheerio");

/**
 * Fetch the Genius lyrics URL for a given song & artist
 */
const fetchLyricsUrl = async (song, artist) => {
    const searchQuery = `${artist} ${song}`.replace(/ /g, "%20");
    const searchUrl = `https://genius.com/api/search?q=${searchQuery}`;

    try {
        const { data } = await axios.get(searchUrl);
        const firstHit = data.response.hits[0];

        if (!firstHit) return null;
        
        return firstHit.result.url; // ✅ This should return the Genius lyrics page URL
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
