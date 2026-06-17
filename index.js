const express = require('express');
const app = express();
const PORT = process.env.PORT || 3000;

app.use((req, res, next) => {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    if (req.method === 'OPTIONS') return res.sendStatus(200);
    next();
});

// Endpoint 1: Outputs the exact Cineby home catalog block
app.get('/api/home', (req, res) => {
    const staticList = [
        { title: "Pressure", path: "1134433" },           // Direct TMDB IDs mapped to paths
        { title: "Your Fault: London", path: "1351119" },
        { title: "Toy Story 5", path: "1071233" },
        { title: "Deep Water", path: "1151624" },
        { title: "Michael", path: "1022789" }
    ];
    res.json({ success: true, results: staticList });
});

// Endpoint 2: Instantly creates the perfect ad-free embed frame URL
app.get('/api/stream', (req, res) => {
    const tmdbId = req.query.path;
    if (!tmdbId) return res.status(400).json({ error: "Missing ID reference" });

    // Directly passes the safe embed stream link to the layout
    const finalEmbedUrl = `https://vidsrc.me/embed/movie?tmdb=${tmdbId}`;
    res.json({ success: true, embedUrl: finalEmbedUrl });
});

app.listen(PORT, () => console.log('Proxy Network Stable'));
