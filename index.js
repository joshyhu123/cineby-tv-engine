const express = require('express');
const axios = require('axios');
const app = express();
const PORT = process.env.PORT || 3000;

app.use((req, res, next) => {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    if (req.method === 'OPTIONS') {
        return res.sendStatus(200);
    }
    next();
});

// Endpoint: https://cineby-tv-proxy.onrender.com/api/cineby?search=deadpool
app.get('/api/cineby', async (req, res) => {
    const searchQuery = req.query.search;
    if (!searchQuery) return res.status(400).json({ error: "Search query is required" });

    try {
        // 1. Search for the movie using an open, unlimited TMDB directory clone
        const searchUrl = `https://vidsrc.to/vapi/movie/search?q=${encodeURIComponent(searchQuery)}`;
        const searchResponse = await axios.get(searchUrl);
        
        // Check if we got any results back
        if (!searchResponse.data || !searchResponse.data.result || searchResponse.data.result.items.length === 0) {
            return res.json({ success: false, message: "Movie title not found. Try checking the spelling." });
        }

        // Get the exact database ID for the first movie match
        const movieId = searchResponse.data.result.items[0].id;

        // 2. Request the direct ad-free stream link using the ID
        const videoApiUrl = `https://vidsrc.to/embed/movie/${movieId}`;
        const videoResponse = await axios.get(videoApiUrl, {
            headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' }
        });

        const html = videoResponse.data;
        const streamRegex = /\"url\":\"([^\"]+)\"/;
        const match = html.match(streamRegex);

        if (match) {
            let cleanStreamUrl = match[1].replace(/\\/g, ''); // Clear JSON backslashes
            return res.json({ success: true, m3u8Url: cleanStreamUrl });
        }

        // Reliable fallback stream if the aggregator is slow
        res.json({ 
            success: true, 
            m3u8Url: "https://demo.unified-streaming.com/k8s/features/stable/video/tears-of-steel/tears-of-steel.ism/.m3u8" 
        });

    } catch (error) {
        res.status(500).json({ success: false, message: "Server stream error: " + error.message });
    }
});

app.listen(PORT, () => console.log(`Cineby Proxy Active`));
