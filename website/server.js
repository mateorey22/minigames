const express = require('express');
const fs = require('fs').promises;
const path = require('path');
const fetch = require('node-fetch');
const multer = require('multer');

const app = express();

// Serve static files from the root directory
app.use(express.static(path.join(__dirname, 'website')));
app.use('/images', express.static(path.join(__dirname, 'website', 'images')));
app.use('/games', express.static(path.join(__dirname, 'website', 'games')));

// Configure multer for file uploads
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        // Determine destination folder based on file type
        const folder = file.fieldname === 'gameFile' ? 'games' : 'images';
        const destPath = path.join(__dirname, folder);
        
        // Create directory if it doesn't exist
        fs.mkdir(destPath, { recursive: true })
            .then(() => cb(null, destPath))
            .catch(err => cb(err));
    },
    filename: function (req, file, cb) {
        cb(null, file.originalname);
    }
});

const upload = multer({ storage: storage });

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

app.post('/api/create-game', async (req, res) => {
    const { prompt, apiKey } = req.body;

    try {
        // The AI prompt template for game creation
        const aiPrompt = `Create a simple HTML5 game based on this description: "${prompt}". 
        The game should:
        1. Be contained in a single HTML file
        2. Use vanilla JavaScript (no external libraries)
        3. Have basic gameplay mechanics
        4. Include simple graphics or shapes
        5. Have a clean, minimal design
        6. Include basic sound effects (optional)
        7. Be responsive and work in an iframe
        
        Provide only the complete HTML file content with embedded CSS and JavaScript.`;

        // Call Gemini API (implementation depends on the specific API version)
        const geminiResponse = await fetch('GEMINI_API_ENDPOINT', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`
            },
            body: JSON.stringify({
                prompt: aiPrompt,
                // Add other required Gemini API parameters
            })
        });

        const gameCode = await geminiResponse.json();
        
        // Generate a unique filename
        const timestamp = Date.now();
        const filename = `ai-game-${timestamp}.html`;
        
        // Save the game file
        await fs.writeFile(
            path.join(__dirname, 'games', filename),
            gameCode.content
        );

        res.json({ success: true, filename });
    } catch (error) {
        console.error('Error creating game:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// Handle file uploads
app.post('/save-game-files', upload.fields([
    { name: 'gameFile', maxCount: 1 },
    { name: 'imageFile', maxCount: 1 }
]), async (req, res) => {
    try {
        if (!req.files) {
            throw new Error('No files uploaded');
        }

        // Files are automatically saved by multer
        res.json({ 
            success: true,
            message: 'Files saved successfully',
            files: req.files
        });
    } catch (error) {
        console.error('Error saving files:', error);
        res.status(500).json({ 
            success: false, 
            error: error.message 
        });
    }
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    console.log(`Serving files from: ${__dirname}`);
}); 