const axios = require("axios");

const GENIUS_ACCESS_TOKEN = process.env.GENIUS_ACCESS_TOKEN;

/**
 * 🔍 Search for lyrics URL on Genius using API
 */
const fetchLyricsUrl = async (song, artist) => {
  try {
    const response = await axios.get("https://api.genius.com/search", {
      headers: { Authorization: `Bearer ${GENIUS_ACCESS_TOKEN}` },
      params: { q: `${song} ${artist}` },
    });

    const hits = response.data.response.hits;
    if (hits.length === 0) return null;

    // ✅ Extract the first result's URL
    return hits[0].result.url;
  } catch (error) {
    console.error("❌ Failed to fetch lyrics URL:", error.response?.data || error.message);
    return null;
  }
};

/**
 * 📝 Fetch lyrics from Genius API
 */
const getLyricsFromGenius = async (song, artist) => {
  try {
    console.log(`🔍 Fetching lyrics for: ${song} by ${artist}`);

    // ✅ First, fetch the song's Genius URL
    const lyricsUrl = await fetchLyricsUrl(song, artist);
    if (!lyricsUrl) throw new Error("Lyrics URL not found.");

    console.log(`✅ Found Genius URL: ${lyricsUrl}`);

    // ✅ Fetch page source from Genius
    const response = await axios.get(lyricsUrl);
    const html = response.data;

    // ✅ Extract lyrics (updated Genius structure)
    const lyricsMatch = html.match(/"lyrics":\s*"([\s\S]*?)"/);
    if (!lyricsMatch) throw new Error("Lyrics not found on Genius.");

    const lyrics = JSON.parse(`"${lyricsMatch[1]}"`); // Decode escaped JSON string

    console.log("✅ Successfully retrieved lyrics!");
    return lyrics;
  } catch (error) {
    console.error("❌ Failed to fetch Genius lyrics:", error.message);
    return null;
  }
};

module.exports = { fetchLyricsUrl, getLyricsFromGenius };
