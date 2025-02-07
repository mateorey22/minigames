const express = require('express');
const fs = require('fs').promises;
const path = require('path');

const app = express();

// Serve static files from the website directory
app.use(express.static(path.join(__dirname, 'website')));

// API endpoint to list game files
app.get('/api/games/list', async (req, res) => {
    try {
        // Use correct path to games directory
        const gamesPath = path.join(__dirname, 'website', 'games');
        const files = await fs.readdir(gamesPath);
        
        // Log files found for debugging
        console.log('Found game files:', files);
        
        res.json(files);
    } catch (error) {
        console.error('Error reading games directory:', error);
        res.status(500).json({ error: 'Failed to list games' });
    }
});

app.listen(3000, () => {
    console.log('Server running on port 3000');
}); 