document.addEventListener('DOMContentLoaded', () => {
    const greeting = document.getElementById('greeting');
    const time = document.getElementById('time');
    const retroGamesContainer = document.getElementById('retro-games-container');
    const gameOverlay = document.getElementById('game-overlay');
    const gameFrame = document.getElementById('game-frame');

    // Static list of games with localStorage persistence
    const savedGames = localStorage.getItem('games');
    const games = savedGames ? JSON.parse(savedGames) : [];

    // Update time and greeting
    function updateTime() {
        const now = new Date();
        const hours = now.getHours();
        const minutes = now.getMinutes().toString().padStart(2, '0');
        time.textContent = `${hours}:${minutes}`;
        greeting.textContent = `Good ${hours < 12 ? 'morning' : hours < 18 ? 'afternoon' : 'evening'}!`;
    }

    function updatePing() {
        const ping = Math.floor(Math.random() * 100);
        const pingElement = document.getElementById('ping');
        pingElement.textContent = `Ping: ${ping}ms`;
    }

    // Create game cards
    async function createGameCards() {
        retroGamesContainer.innerHTML = '';
        
        // Load AI-generated games from localStorage
        games.forEach(game => {
            const card = document.createElement('div');
            card.classList.add('game-card');

            const icon = document.createElement('div');
            icon.className = 'game-icon';
            
            const img = document.createElement('img');
            if (game.image) {
                img.src = game.image.startsWith('data:') ? game.image : `images/${game.image}`;
            } else {
                img.src = 'images/ai-game.svg';
            }
            img.alt = game.title;
            
            img.onerror = () => {
                img.src = 'images/ai-game.svg';
            };
            
            const info = document.createElement('div');
            info.classList.add('game-info');
            const title = document.createElement('h3');
            title.textContent = game.title;
            info.appendChild(title);
            
            icon.appendChild(img);
            card.appendChild(icon);
            card.appendChild(info);
            
            card.addEventListener('click', () => {
                if (game.url) {
                    gameFrame.src = game.url;
                    gameOverlay.classList.add('active');
                } else {
                    console.error('Game URL is missing:', game);
                    showCustomAlert('This game cannot be loaded');
                }
            });
            
            retroGamesContainer.appendChild(card);
        });

        // Load pre-made games from server
        try {
            const response = await fetch('/api/games/list');
            const gameFiles = await response.json();
            
            gameFiles.forEach(file => {
                if (!file.endsWith('.html')) return;

                const gameName = file.replace('.html', '');
                const title = gameName
                    .replace(/-/g, ' ')
                    .replace(/(^\w|\s\w)/g, m => m.toUpperCase());
                
                const card = document.createElement('div');
                card.classList.add('game-card');

                const icon = document.createElement('div');
                icon.className = 'game-icon';
                
                const img = document.createElement('img');
                img.src = `images/${gameName}.svg`;
                img.alt = title;
                
                img.onerror = () => {
                    img.src = 'images/ai-game.svg';
                };
                
                const info = document.createElement('div');
                info.classList.add('game-info');
                const titleElement = document.createElement('h3');
                titleElement.textContent = title;
                info.appendChild(titleElement);
                
                icon.appendChild(img);
                card.appendChild(icon);
                card.appendChild(info);
                
                card.addEventListener('click', () => {
                    gameFrame.src = `games/${file}`;
                    gameOverlay.classList.add('active');
                });
                
                retroGamesContainer.appendChild(card);
            });
        } catch (error) {
            console.error('Error loading pre-made games:', error);
        }
    }

    // Close overlay
    window.closeOverlay = function() {
        gameOverlay.classList.remove('active');
        gameFrame.src = '';
    }

    // Initialize
    updateTime();
    updatePing();
    createGameCards();

    // Set up intervals
    setInterval(updateTime, 60000);
    setInterval(updatePing, 5000);

    // AI Game Creation
    const aiButton = document.getElementById('ai-button');
    const aiPanel = document.querySelector('.ai-panel');
    const closeAi = document.querySelector('.close-ai');
    const aiInput = document.getElementById('ai-input');
    const sendAiRequest = document.getElementById('send-ai-request');
    const loadingOverlay = document.querySelector('.loading-overlay');

    // Show/hide AI panel
    aiButton.addEventListener('click', () => {
        aiPanel.classList.add('active');
    });

    closeAi.addEventListener('click', () => {
        aiPanel.classList.remove('active');
    });

    // Update the loading message function
    function updateLoadingMessage(message) {
        const loadingText = document.querySelector('.loading-overlay p');
        loadingText.textContent = message;
    }

    // Update the AI request handler
    sendAiRequest.addEventListener('click', async () => {
        const apiKey = 'AIzaSyDbQystMPivkfuLiRM3j-Zn7lm4JcpSZW0';
        const userPrompt = aiInput.value.trim();
        if (!userPrompt) return;

        loadingOverlay.classList.add('active');
        updateLoadingMessage('🎮 Crafting your epic game...');

        try {
            // Step 1: Generate game code
            const gamePrompt = `Create a complete HTML5 game using css javascript tailwind etc.. based on this description: "${userPrompt}"

            
                    // Must include:
                    //     graphics
                    // - Touch and keyboard controls
                    // - Score system
                    // - Sound effects
                    // - Game states (menu, playing, game over)
                    // - Collision detection
                    // - Animation system
                    // - Particle effects
            

            Important:
            - All code must be in one HTML file
            - No external libraries or assets
            - Must be responsive
            - Include comments
            - Use ES6+ JavaScript
            - Handle window resize
            - Save high scores in localStorage

            Return ONLY the complete HTML file content.`;

            updateLoadingMessage('🚀 Writing amazing game code...');
            const gameCode = await callGeminiAPI(gamePrompt, apiKey);

            // Step 2: Generate title
            const titlePrompt = `Generate a short, catchy game title (2-3 words maximum) for this game description: "${userPrompt}"
            Rules:
            - Must be 2-3 words only
            - Be creative and catchy
            - Reflect the game's theme
            - NO quotes or explanations
            - NO punctuation
            Return ONLY the title text.`;

            updateLoadingMessage('🎯 Creating a catchy title...');
            let gameTitle = await callGeminiAPI(titlePrompt, apiKey);
            
            // Debug log
            console.log('Raw title from API:', gameTitle);
            
            // Clean and validate title
            gameTitle = gameTitle
                .replace(/^["']+|["']+$/g, '') // Remove surrounding quotes
                .replace(/[^a-zA-Z0-9\s-]/g, '') // Allow letters, numbers, spaces, hyphens
                .replace(/\s{2,}/g, ' ') // Replace multiple spaces with single
                .trim()
                .substring(0, 25); // Reasonable length limit

            // If title is empty after cleaning, use fallback
            if (!gameTitle) {
                const words = userPrompt.split(' ').slice(0, 3);
                gameTitle = words.join(' ') || `New Game ${Date.now().toString().slice(-4)}`;
            }

            // Debug log
            console.log('Cleaned title:', gameTitle);
            
            if (!gameTitle || gameTitle.length < 2) {
                gameTitle = "New Game " + Math.floor(Math.random() * 1000); // Fallback title
                console.log('Using fallback title:', gameTitle);
            }

            // Force string type and additional cleanup
            gameTitle = String(gameTitle).trim();
            console.log('Final title to be used:', gameTitle);

            // Verify title is set before proceeding
            if (!gameTitle) {
                throw new Error('Failed to generate valid title');
            }

            // Step 3: Show image upload dialog
            updateLoadingMessage('🎨 Time to add your game artwork!');
            
            // Create and show the image upload dialog
            const uploadDialog = document.createElement('div');
            uploadDialog.className = 'upload-dialog';
            uploadDialog.innerHTML = `
                <div class="upload-content">
                    <h2>Game Image</h2>
                    <p>Choose an image for "${gameTitle}"</p>
                    <input type="file" id="gameImage" accept="image/*">
                    <div class="upload-preview">
                        <img id="imagePreview" src="images/ai-game.svg" alt="Preview">
                    </div>
                    <div class="upload-buttons">
                        <button id="confirmUpload">Save with Custom Image</button>
                        <button id="useDefault">Use Default Image</button>
                    </div>
                </div>
            `;

            document.body.appendChild(uploadDialog);

            // Handle image preview
            const imageInput = uploadDialog.querySelector('#gameImage');
            const imagePreview = uploadDialog.querySelector('#imagePreview');
            
            imageInput.addEventListener('change', (e) => {
                const file = e.target.files[0];
                if (file) {
                    const reader = new FileReader();
                    reader.onload = (e) => {
                        imagePreview.src = e.target.result;
                    };
                    reader.readAsDataURL(file);
                }
            });

            // Handle save with uploaded image
            const confirmButton = uploadDialog.querySelector('#confirmUpload');
            confirmButton.addEventListener('click', async () => {
                const file = imageInput.files[0];
                if (!file) {
                    showCustomAlert('Please select an image first!');
                    return;
                }

                try {
                    const imageDataUrl = await new Promise((resolve) => {
                        const reader = new FileReader();
                        reader.onload = (e) => resolve(e.target.result);
                        reader.readAsDataURL(file);
                    });

                    saveNewGame(gameTitle, gameCode, imageDataUrl, userPrompt);
                    uploadDialog.remove();
                    aiPanel.classList.remove('active');
                    showCustomAlert(`Game "${gameTitle}" created successfully!`);
                } catch (error) {
                    console.error('Error saving game:', error);
                    showCustomAlert('Error saving game: ' + error.message);
                }
            });

            // Handle save with default image
            const defaultButton = uploadDialog.querySelector('#useDefault');
            defaultButton.addEventListener('click', () => {
                saveNewGame(gameTitle, gameCode, 'images/ai-game.svg', userPrompt);
                uploadDialog.remove();
                aiPanel.classList.remove('active');
                showCustomAlert(`Game "${gameTitle}" created successfully!`);
            });

        } catch (error) {
            console.error('Error:', error);
            showCustomAlert('Failed to create game: ' + error.message);
        } finally {
            loadingOverlay.classList.remove('active');
            aiInput.value = '';
        }
    });

    // Helper function to generate AI images
    async function generateAIImage(description, apiKey) {
        try {
            const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-pro-vision:generateContent?key=${apiKey}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    contents: [{
                        parts: [{
                            text: `Create a pixel art game thumbnail based on this description: ${description}
                            Must be:
                            - 512x512 pixels
                            - Pixel art style
                            - Game-appropriate visuals
                            - Clear focal point
                            - Professional quality
                            Return the image as base64 data.`
                        }]
                    }]
                })
            });

            if (!response.ok) {
                throw new Error('Failed to generate image');
            }

            const data = await response.json();
            return data.candidates?.[0]?.content?.parts?.[0]?.text || null;

        } catch (error) {
            console.error('Image generation failed:', error);
            return null;
        }
    }

    // Enhanced image generation
    function generateGameImage(title, description = '') {
        try {
            const canvas = document.createElement('canvas');
            canvas.width = 200;
            canvas.height = 200;
            const ctx = canvas.getContext('2d');

            // Create dynamic color scheme based on description
            const colors = getColorScheme(description);
            
            // Background gradient
            const gradient = ctx.createLinearGradient(0, 0, 200, 200);
            gradient.addColorStop(0, colors.primary);
            gradient.addColorStop(1, colors.secondary);
            ctx.fillStyle = gradient;
            ctx.fillRect(0, 0, 200, 200);

            // Add game-themed elements
            addGameElements(ctx, description);

            // Add title with style
            addStylizedTitle(ctx, title);

            return canvas.toDataURL('image/png');
        } catch (error) {
            console.error('Failed to generate image:', error);
            // Return a simple colored rectangle with text as absolute fallback
            const canvas = document.createElement('canvas');
            canvas.width = 200;
            canvas.height = 200;
            const ctx = canvas.getContext('2d');
            ctx.fillStyle = '#4facfe';
            ctx.fillRect(0, 0, 200, 200);
            ctx.fillStyle = 'white';
            ctx.font = 'bold 20px Arial';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(title || 'Game', 100, 100);
            return canvas.toDataURL('image/png');
        }
    }

    // Helper functions for image generation
    function getColorScheme(description) {
        // Generate colors based on game description
        const keywords = {
            space: ['#4A2FBD', '#6B4CF5'],
            fantasy: ['#2E8B57', '#98FB98'],
            action: ['#DC143C', '#FF4500'],
            puzzle: ['#4169E1', '#87CEEB'],
            default: ['#4facfe', '#00f2fe']
        };

        const theme = Object.keys(keywords).find(key => 
            description.toLowerCase().includes(key)
        ) || 'default';

        return {
            primary: keywords[theme][0],
            secondary: keywords[theme][1]
        };
    }

    function addGameElements(ctx, description) {
        // Add themed visual elements
        ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
        
        // Generate different patterns based on game type
        if (description.toLowerCase().includes('space')) {
            // Add stars
            for (let i = 0; i < 50; i++) {
                const x = Math.random() * 200;
                const y = Math.random() * 200;
                const size = Math.random() * 3;
                ctx.beginPath();
                ctx.arc(x, y, size, 0, Math.PI * 2);
                ctx.fill();
            }
        } else if (description.toLowerCase().includes('puzzle')) {
            // Add geometric shapes
            for (let i = 0; i < 5; i++) {
                ctx.save();
                ctx.translate(Math.random() * 200, Math.random() * 200);
                ctx.rotate(Math.random() * Math.PI);
                ctx.fillRect(-15, -15, 30, 30);
                ctx.restore();
            }
        } else {
            // Default pattern
            for (let i = 0; i < 5; i++) {
                ctx.beginPath();
                ctx.arc(
                    Math.random() * 200,
                    Math.random() * 200,
                    Math.random() * 30 + 10,
                    0,
                    Math.PI * 2
                );
                ctx.fill();
            }
        }
    }

    function addStylizedTitle(ctx, title) {
        ctx.save();
        
        // Add shadow for depth
        ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
        ctx.shadowBlur = 4;
        
        // Main title
        ctx.font = 'bold 24px Arial';
        ctx.fillStyle = 'white';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        
        // Word wrap
        const words = title.split(' ');
        let lines = [];
        let currentLine = words[0];
        
        for (let i = 1; i < words.length; i++) {
            if (currentLine.length + words[i].length < 15) {
                currentLine += ' ' + words[i];
            } else {
                lines.push(currentLine);
                currentLine = words[i];
            }
        }
        lines.push(currentLine);

        // Draw each line
        lines.forEach((line, i) => {
            const y = 100 + (i - lines.length/2) * 30;
            ctx.fillText(line, 100, y);
        });

        ctx.restore();
    }

    function showCustomAlert(message) {
        const alertOverlay = document.createElement('div');
        alertOverlay.className = 'custom-alert-overlay';
        
        const alertBox = document.createElement('div');
        alertBox.className = 'custom-alert';
        
        const messageText = document.createElement('p');
        messageText.textContent = message;
        
        const okButton = document.createElement('button');
        okButton.textContent = 'OK';
        okButton.onclick = () => {
            alertOverlay.classList.add('fade-out');
            setTimeout(() => alertOverlay.remove(), 300);
        };
        
        alertBox.appendChild(messageText);
        alertBox.appendChild(okButton);
        alertOverlay.appendChild(alertBox);
        document.body.appendChild(alertOverlay);
        
        setTimeout(() => alertOverlay.classList.add('active'), 10);
    }

    // Remove the API key input elements from HTML
    document.querySelector('.api-key-container')?.remove();

    // Add this helper function for API calls
    async function callGeminiAPI(prompt, apiKey) {
        try {
            const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    contents: [{
                        parts: [{
                            text: prompt
                        }]
                    }]
                })
            });

            if (!response.ok) {
                throw new Error(`API request failed: ${response.status}`);
            }

            const data = await response.json();
            if (data.candidates && data.candidates[0]?.content?.parts?.[0]?.text) {
                return data.candidates[0].content.parts[0].text;
            } else {
                throw new Error('Invalid response format from API');
            }
        } catch (error) {
            console.error('Error calling Gemini API:', error);
            throw new Error('Failed to generate content: ' + error.message);
        }
    }

    // Update the saveNewGame function to ensure title is properly handled
    function saveNewGame(title, code, image, description) {
        console.log('Saving game with title:', title);
        
        // Ensure title is valid
        let finalTitle = String(title).trim();
        if (!finalTitle) {
            finalTitle = `Game ${Date.now().toString().slice(-4)}`;
            console.warn('Invalid title, using fallback:', finalTitle);
        }

        const timestamp = Date.now();
        const newGame = {
            title: finalTitle, // Use validated title
            code: code,
            url: `data:text/html;charset=utf-8,${encodeURIComponent(code)}`,
            image: image,
            timestamp: timestamp,
            description: description
        };

        console.log('New game object:', newGame);
        games.push(newGame);
        localStorage.setItem('games', JSON.stringify(games));
        createGameCards(); // Refresh the game cards display
    }

    // Add this near the top with other element selections
    const settingsButton = document.querySelector('.settings-button');
    const settingsPanel = document.querySelector('.settings-panel');
    const closeSettings = document.querySelector('.close-settings');

    // Add settings event listeners
    if (settingsButton && settingsPanel && closeSettings) {
        // Add theme button selections
        const themeButtons = document.querySelectorAll('.theme-btn');
        
        // Load saved theme preference
        const savedTheme = localStorage.getItem('theme') || 'dark';
        document.body.className = savedTheme;
        
        // Update active state of theme buttons
        themeButtons.forEach(btn => {
            if (btn.dataset.theme === savedTheme) {
                btn.classList.add('active');
            } else {
                btn.classList.remove('active');
            }
        });

        // Add click handlers for theme buttons
        themeButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                // Remove active class from all buttons
                themeButtons.forEach(b => b.classList.remove('active'));
                
                // Add active class to clicked button
                btn.classList.add('active');
                
                // Set theme
                const theme = btn.dataset.theme;
                document.body.className = theme;
                localStorage.setItem('theme', theme);

                // If a game is loaded, send theme to iframe
                const gameFrame = document.getElementById('game-frame');
                if (gameFrame && gameFrame.contentWindow) {
                    gameFrame.contentWindow.postMessage({
                        type: 'theme',
                        theme: theme
                    }, '*');
                }
            });
        });

        settingsButton.addEventListener('click', () => {
            settingsPanel.classList.add('active');
        });

        closeSettings.addEventListener('click', () => {
            settingsPanel.classList.remove('active');
        });

        // Close settings when clicking outside
        document.addEventListener('click', (e) => {
            if (e.target !== settingsButton && 
                !settingsButton.contains(e.target) && 
                !settingsPanel.contains(e.target)) {
                settingsPanel.classList.remove('active');
            }
        });

        // Prevent clicks inside panel from closing it
        settingsPanel.addEventListener('click', (e) => {
            e.stopPropagation();
        });
    }
});