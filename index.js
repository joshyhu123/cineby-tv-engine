const express = require('express');
const axios = require('axios');
const cheerio = require('cheerio'); // Parses the cineby HTML structure
const app = express();
const PORT = process.env.PORT || 3000;

app.use((req, res, next) => {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    next();
});

// Endpoint: https://your-render-app.onrender.com/api/cineby?search=avatar
app.get('/api/cineby', async (req, res) => {
    const searchQuery = req.query.search;
    if (!searchQuery) return res.status(400).json({ error: "Search term required" });

    try {
        // 1. Scrape the native search page of cineby.at
        const searchUrl = `https://cineby.at/search?q=${encodeURIComponent(searchQuery)}`;
        const searchResponse = await axios.get(searchUrl, {
            headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' }
        });

        const $ = cheerio.load(searchResponse.data);
        
        // 2. Locate the first movie/show link result from their custom grid layout
        const firstResultPath = $('.movie-grid-item a').first().attr('href'); 
        if (!firstResultPath) return res.json({ success: false, message: "No match found on cineby.at" });

        const watchPageUrl = `https://cineby.at${firstResultPath}`;

        // 3. Load the actual video watch page
        const watchResponse = await axios.get(watchPageUrl, {
            headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)', 'Referer': 'https://cineby.at/' }
        });

        // 4. Custom Regex parser targeting cineby's encrypted stream engine bundle
        const watchHtml = watchResponse.data;
        const streamRegex = /"file":"([^"]+)"/;;
        const match = watchHtml.match(streamRegex);

        if (match) {
            // Clean up backslashes and pull out the high-speed .m3u8 streaming file link
            let directStreamUrl = match[1].replace(/\\/g, '');
            return res.json({ success: true, title: searchQuery, m3u8Url: directStreamUrl });
        }

        res.json({ success: false, message: "Stream link protection could not be parsed." });

    } catch (error) {
        res.status(500).json({ success: false, message: "Cineby connection error: " + error.message });
    }
});

app.listen(PORT, () => console.log(`Cineby TV Proxy active on port ${PORT}`));
