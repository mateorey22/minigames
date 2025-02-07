const express = require('express');
const fs = require('fs').promises;
const path = require('path');

const app = express();

// Serve static files from correct directories
app.use(express.static(path.join(__dirname, 'website')));
app.use('/games', express.static(path.join(__dirname, 'website', 'games')));
app.use('/images', express.static(path.join(__dirname, 'website', 'images')));

// API endpoint to list game files
app.get('/api/games/list', async (req, res) => {
    try {
        const gamesPath = path.join(__dirname, 'website', 'games');
        const files = await fs.readdir(gamesPath);
        
        const gameFiles = files.filter(file => file.endsWith('.html'));
        console.log('Serving games:', gameFiles);
        res.json(gameFiles);
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ error: 'Failed to list games' });
    }
});

app.listen(3000, () => {
    console.log('Server running on http://localhost:3000');
}); 