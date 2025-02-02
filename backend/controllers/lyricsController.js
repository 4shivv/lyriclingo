const { fetchLyricsUrl, scrapeLyrics } = require("../services/lyricsService");

/**
 * Get Genius lyrics URL
 */
const getLyricsUrl = async (req, res) => {
    try {
        const { song, artist } = req.query;

        if (!song || !artist) {
            return res.status(400).json({ error: "Song and artist are required" });
        }

        const lyricsUrl = await fetchLyricsUrl(song, artist);

        if (!lyricsUrl) {
            return res.status(404).json({ error: "Lyrics URL not found" });
        }

        res.json({ lyricsUrl });
    } catch (error) {
        console.error("❌ Error fetching lyrics URL:", error);
        res.status(500).json({ error: "Failed to fetch lyrics URL." });
    }
};

/**
 * Fetch and return the actual lyrics
 */
const fetchLyrics = async (req, res) => {
    try {
        const { lyricsUrl } = req.query;

        if (!lyricsUrl) {
            return res.status(400).json({ error: "lyricsUrl is required" });
        }

        const lyrics = await scrapeLyrics(lyricsUrl);

        if (!lyrics) {
            return res.status(500).json({ error: "Failed to scrape lyrics" });
        }

        res.json({ lyrics });
    } catch (error) {
        console.error("❌ Error fetching lyrics:", error);
        res.status(500).json({ error: "Failed to fetch lyrics." });
    }
};

module.exports = { getLyricsUrl, fetchLyrics };
