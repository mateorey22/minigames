document.addEventListener('DOMContentLoaded', () => {
    // Elements
    const greeting = document.getElementById('greeting');
    const time = document.getElementById('time');
    const ping = document.getElementById('ping');
    const retroGamesContainer = document.getElementById('retro-games-container');
    const aiButton = document.getElementById('ai-button');
    const aiPanel = document.querySelector('.ai-panel');
    const closeAi = document.querySelector('.close-ai');
    const aiInput = document.getElementById('ai-input');
    const sendAiRequest = document.getElementById('send-ai-request');
    const loadingOverlay = document.querySelector('.loading-overlay');
    const geminiKeyInput = document.getElementById('gemini-key');
    const saveApiKeyButton = document.getElementById('save-api-key');
    const settingsButton = document.querySelector('.settings-button');
    const settingsPanel = document.querySelector('.settings-panel');
    const closeSettings = document.querySelector('.close-settings');
    const aiModelSelect = document.getElementById('ai-model');

    // Load saved games from localStorage
    const savedGames = localStorage.getItem('games');
    const games = savedGames ? JSON.parse(savedGames) : [];

    // Load saved model preference
    const savedModel = localStorage.getItem('aiModel') || 'gemini-2.0-flash';
    aiModelSelect.value = savedModel;

    // Update time and greeting
    function updateTime() {
        const now = new Date();
        const hours = now.getHours();
        const minutes = now.getMinutes().toString().padStart(2, '0');
        time.textContent = `${hours}:${minutes}`;
        
        let greetingText = 'Good ';
        if (hours < 12) greetingText += 'morning';
        else if (hours < 18) greetingText += 'afternoon';
        else greetingText += 'evening';
        greetingText += '!';
        
        greeting.textContent = greetingText;
    }

    // Update network status
    function updatePing() {
        const pingValue = Math.floor(Math.random() * 100) + 10;
        ping.textContent = `Ping: ${pingValue}ms`;
    }

    // Initialize
    updateTime();
    updatePing();
    setInterval(updateTime, 60000);
    setInterval(updatePing, 5000);

    // AI Panel Toggle
    aiButton.addEventListener('click', () => {
        aiPanel.classList.add('active');
    });

    closeAi.addEventListener('click', () => {
        aiPanel.classList.remove('active');
    });

    // Settings Panel Toggle
    settingsButton.addEventListener('click', () => {
        settingsPanel.classList.add('active');
    });

    closeSettings.addEventListener('click', () => {
        settingsPanel.classList.remove('active');
    });

    // Theme Toggle
    const themeButtons = document.querySelectorAll('.theme-btn');
    const savedTheme = localStorage.getItem('theme') || 'dark';
    document.body.className = savedTheme;

    themeButtons.forEach(btn => {
        if (btn.dataset.theme === savedTheme) {
            btn.classList.add('active');
        }

        btn.addEventListener('click', () => {
            themeButtons.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            const theme = btn.dataset.theme;
            document.body.className = theme;
            localStorage.setItem('theme', theme);
        });
    });

    // API Key Management
    const apiKey = localStorage.getItem('geminiApiKey');
    if (apiKey) {
        geminiKeyInput.value = apiKey;
    }

    saveApiKeyButton.addEventListener('click', () => {
        const key = geminiKeyInput.value.trim();
        if (key) {
            localStorage.setItem('geminiApiKey', key);
            showCustomAlert('API Key saved successfully!');
        } else {
            showCustomAlert('Please enter a valid API key');
        }
    });

    aiModelSelect.addEventListener('change', () => {
        localStorage.setItem('aiModel', aiModelSelect.value);
    });

    // Game Creation
    sendAiRequest.addEventListener('click', async () => {
        const userPrompt = aiInput.value.trim();
        if (!userPrompt) {
            showCustomAlert('Please enter a game description');
            return;
        }

        const apiKey = geminiKeyInput.value.trim();
        if (!apiKey) {
            showCustomAlert('Please enter your Gemini API key');
            return;
        }

        loadingOverlay.classList.add('active');
        updateLoadingMessage('Creating your game...');

        try {
            const selectedModel = aiModelSelect.value;
            
            // Step 1: Generate detailed game description with thinking model
            const detailPrompt = `Create a detailed Game Boy game based on this idea: "${userPrompt}"
Focus on mechanics that work well with Game Boy's hardware limitations:
- 160x144 pixel screen
- 4 shades of gray
- 2 sound channels
- D-pad and 4 buttons (A, B, Start, Select)
Do not include any code in your response, only the description.`;

            const detailedDescription = await callGeminiAPI(detailPrompt, apiKey, 0.75, 'gemini-2.0-flash-thinking-exp-01-21');
            
            // Step 2: Generate Game Boy assembly code
            const gamePrompt = `Create a complete Game Boy game in RGBDS assembly based on this description:

${detailedDescription}

Follow these Game Boy programming guidelines:
1. Include proper section declarations (SECTION, ROM0, WRAM0)
2. Include all necessary hardware registers ($FF00-$FFFF)
3. Include proper ROM header with Nintendo logo data
4. Handle VBlank and LCD interrupts
5. Initialize hardware properly
6. Use proper RGBDS syntax for labels and constants

Your response MUST contain these THREE sections with EXACT markers:
[MAIN]
(main game code here)

[HEADER]
(header code here)

[GRAPHICS]
(graphics data here)

Each section must contain valid RGBDS assembly code.`;

            const gameCode = await callGeminiAPI(gamePrompt, apiKey, 0.33, selectedModel);
            if (!gameCode) throw new Error('Failed to generate game code');

            // More robust section parsing
            const sections = {};
            let currentSection = null;
            let sectionContent = [];
            
            // Split into lines and process each line
            const lines = gameCode.split('\n');
            
            for (let line of lines) {
                const trimmedLine = line.trim();
                
                // Check for section markers
                const sectionMatch = trimmedLine.match(/^\[(MAIN|HEADER|GRAPHICS)\]$/);
                
                if (sectionMatch) {
                    // If we were processing a previous section, save it
                    if (currentSection) {
                        sections[currentSection] = sectionContent.join('\n');
                    }
                    
                    // Start new section
                    currentSection = sectionMatch[1];
                    sectionContent = [];
                } else if (currentSection && trimmedLine) {
                    // Add non-empty lines to current section
                    sectionContent.push(line);
                }
            }
            
            // Save the last section
            if (currentSection && sectionContent.length > 0) {
                sections[currentSection] = sectionContent.join('\n');
            }

            // Validate all required sections are present and non-empty
            const requiredSections = ['MAIN', 'HEADER', 'GRAPHICS'];
            const missingSections = requiredSections.filter(section => !sections[section] || !sections[section].trim());
            
            if (missingSections.length > 0) {
                throw new Error(`Missing or empty required sections: ${missingSections.join(', ')}. Please try again.`);
            }

            // Step 3: Generate title with low temperature
            const titlePrompt = `Create a short title for this Game Boy game: ${detailedDescription}
Return only the title text without any quotes, brackets, or formatting.`;

            let gameTitle = await callGeminiAPI(titlePrompt, apiKey, 0.33, selectedModel);
            gameTitle = gameTitle.replace(/[^a-zA-Z0-9\s-]/g, '').trim();
            const folderName = gameTitle.toLowerCase().replace(/\s+/g, '-');

            // Load RGBDS WebAssembly
            updateLoadingMessage('Loading compiler...');
            
            const rgbdsWasm = await loadRGBDS();
            
            updateLoadingMessage('Compiling game...');
            
            try {
                // Create virtual filesystem for RGBDS
                const fs = new rgbdsWasm.FS();
                
                // Write source files to virtual filesystem
                fs.writeFile('main.asm', sections.MAIN);
                fs.writeFile('header.asm', sections.HEADER);
                fs.writeFile('graphics.asm', sections.GRAPHICS);
                fs.writeFile('hardware.inc', hardwareIncContent);
                fs.writeFile('constants.asm', hardwareConstantsContent);

                // Compile assembly files
                await rgbdsWasm.rgbasm('main.asm', 'main.o');
                await rgbdsWasm.rgbasm('header.asm', 'header.o');
                await rgbdsWasm.rgbasm('graphics.asm', 'graphics.o');

                // Link object files
                await rgbdsWasm.rgblink(['main.o', 'header.o', 'graphics.o'], `${folderName}.gb`);

                // Fix ROM header
                await rgbdsWasm.rgbfix(`${folderName}.gb`, {
                    title: gameTitle,
                    gameId: '01',
                    newLicensee: '01',
                    sgbFlag: 0x00,
                    cartridgeType: 0x00,
                    romSize: 0x00,
                    ramSize: 0x00,
                    destinationCode: 0x01,
                    oldLicensee: 0x33,
                    maskRomVersion: 0x00
                });

                // Read compiled ROM
                const romData = fs.readFile(`${folderName}.gb`);
                
                // Create zip file with ROM and source
                const zip = new JSZip();
                const gameFolder = zip.folder(folderName);
                
                // Add ROM file
                gameFolder.file(`${folderName}.gb`, romData);
                
                // Add source files
                gameFolder.file('main.asm', sections.MAIN.trim());
                gameFolder.file('header.asm', sections.HEADER.trim());
                gameFolder.file('graphics.asm', sections.GRAPHICS.trim());
                gameFolder.file('constants.asm', hardwareConstantsContent);
                gameFolder.file('hardware.inc', hardwareIncContent);
                
                // Add README
                gameFolder.file('README.md', readmeContent);

                // Generate and download zip file
                const zipBlob = await zip.generateAsync({type: 'blob'});
                const downloadUrl = URL.createObjectURL(zipBlob);
                
                const downloadLink = document.createElement('a');
                downloadLink.href = downloadUrl;
                downloadLink.download = `${folderName}.zip`;
                document.body.appendChild(downloadLink);
                downloadLink.click();
                document.body.removeChild(downloadLink);
                URL.revokeObjectURL(downloadUrl);

                showCustomAlert('Game compiled and downloaded successfully!');
                aiInput.value = '';
                aiPanel.classList.remove('active');

            } catch (error) {
                console.error('Compilation error:', error);
                throw new Error(`Failed to compile game: ${error.message}`);
            }

        } catch (error) {
            console.error('Error:', error);
            showCustomAlert('Failed to create game: ' + error.message);
        } finally {
            loadingOverlay.classList.remove('active');
        }
    });

    // Updated API call function with model selection
    async function callGeminiAPI(prompt, apiKey, temperature = 0.7, model = 'gemini-pro') {
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`, {
                method: 'POST',
            headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    contents: [{
                    parts: [{ text: prompt }]
                }],
                generationConfig: {
                    temperature: temperature,
                    topK: 40,
                    topP: 0.95,
                    maxOutputTokens: 8192
                }
                })
            });

            if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error?.message || `HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
        return data.candidates?.[0]?.content?.parts?.[0]?.text;
    }

    function updateLoadingMessage(message) {
        const loadingText = document.querySelector('.loading-overlay p');
        if (loadingText) loadingText.textContent = message;
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

    // Updated game code wrapper with more features
    function wrapGameCode(code, title) {
        const cleanCode = code
            .replace(/&lt;/g, '<')
            .replace(/&gt;/g, '>')
            .replace(/&amp;/g, '&')
            .replace(/&quot;/g, '"')
            .replace(/&#39;/g, "'");

        // Split code into sections
        const sections = cleanCode.split(/STYLES:|HTML:|JAVASCRIPT:/).filter(Boolean);
        if (sections.length !== 3) {
            throw new Error('Invalid code format - missing sections');
        }

        const [styles, html, javascript] = sections.map(s => s.trim());

        return `<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta name="theme-color" content="#1a1a1a">
    <meta name="apple-mobile-web-app-capable" content="yes">
    <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
    <title>${title}</title>
    <link rel="manifest" href="data:application/json;base64,${btoa(JSON.stringify({
        name: title,
        short_name: title,
        start_url: '.',
        display: 'standalone',
        background_color: '#1a1a1a',
        theme_color: '#1a1a1a',
        icons: [{
            src: 'data:image/svg+xml,' + encodeURIComponent(`<svg width="512" height="512" viewBox="0 0 512 512" fill="none" xmlns="http://www.w3.org/2000/svg"><rect width="512" height="512" rx="128" fill="#4facfe"/></svg>`),
            sizes: '512x512',
            type: 'image/svg+xml',
            purpose: 'any maskable'
        }]
    }))}">
    <script src="https://cdn.tailwindcss.com"></script>
    <style>
        body {
            margin: 0;
            padding: 0;
            width: 100vw;
            height: 100vh;
            display: flex;
            justify-content: center;
            align-items: center;
            background: #1a1a1a;
            overflow: hidden;
            font-family: Arial, sans-serif;
            color: white;
        }
        #game {
            position: relative;
            width: 100%;
            height: 100%;
            display: flex;
            justify-content: center;
            align-items: center;
            background: transparent;
        }
        canvas {
            background: #000;
            max-width: 100%;
            max-height: 100%;
            object-fit: contain;
        }
        .game-ui {
            position: absolute;
            color: white;
            font-size: 24px;
            text-shadow: 2px 2px 4px rgba(0,0,0,0.5);
            z-index: 100;
        }
        #instructions {
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            text-align: center;
            font-size: 24px;
            background: rgba(0, 0, 0, 0.8);
            padding: 20px;
            border-radius: 10px;
            z-index: 1000;
            animation: fadeIn 0.5s ease-out;
        }
        #gameOverScreen {
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            text-align: center;
            display: none;
            background: rgba(0, 0, 0, 0.8);
            padding: 20px;
            border-radius: 10px;
            z-index: 1000;
            animation: scaleIn 0.3s ease-out;
        }
        .add-to-home {
            position: fixed;
            bottom: 20px;
            left: 50%;
            transform: translateX(-50%);
            background: rgba(255, 255, 255, 0.1);
            backdrop-filter: blur(10px);
            padding: 15px 25px;
            border-radius: 15px;
            display: none;
            align-items: center;
            gap: 10px;
            z-index: 2000;
            animation: slideUp 0.5s ease-out;
        }
        @keyframes fadeIn {
            from { opacity: 0; }
            to { opacity: 1; }
        }
        @keyframes scaleIn {
            from { transform: translate(-50%, -50%) scale(0.8); opacity: 0; }
            to { transform: translate(-50%, -50%) scale(1); opacity: 1; }
        }
        @keyframes slideUp {
            from { transform: translate(-50%, 100%); }
            to { transform: translate(-50%, 0); }
        }
        button {
            background: #4facfe;
            color: white;
            border: none;
            padding: 10px 20px;
            border-radius: 5px;
            cursor: pointer;
            font-size: 18px;
            margin-top: 10px;
            transition: all 0.3s ease;
        }
        button:hover {
            background: #00f2fe;
            transform: translateY(-2px);
        }
        .particles {
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            pointer-events: none;
            z-index: 1;
        }
        ${styles}
    </style>
</head>
<body>
    <div id="game">
        ${html}
    </div>
    <div class="add-to-home">
        <span>Add to Home Screen</span>
        <button id="addToHome">Add</button>
    </div>
    <script>
        // Add to Home Screen functionality
        let deferredPrompt;
        window.addEventListener('beforeinstallprompt', (e) => {
            e.preventDefault();
            deferredPrompt = e;
            document.querySelector('.add-to-home').style.display = 'flex';
        });

        document.getElementById('addToHome').addEventListener('click', async () => {
            if (deferredPrompt) {
                deferredPrompt.prompt();
                const { outcome } = await deferredPrompt.userChoice;
                if (outcome === 'accepted') {
                    document.querySelector('.add-to-home').style.display = 'none';
                }
                deferredPrompt = null;
            }
        });

        // Game Code
        ${javascript}
    </script>
</body>
</html>`;
    }

    // Add RGBDS WebAssembly loader
    async function loadRGBDS() {
        const wasmUrl = 'https://cdn.jsdelivr.net/npm/rgbds-live@latest/dist/rgbds.wasm';
        const jsUrl = 'https://cdn.jsdelivr.net/npm/rgbds-live@latest/dist/rgbds.js';

        // Load RGBDS JavaScript
        await new Promise((resolve, reject) => {
            const script = document.createElement('script');
            script.src = jsUrl;
            script.onload = resolve;
            script.onerror = reject;
            document.head.appendChild(script);
        });

        // Initialize RGBDS WebAssembly
        return await window.RGBDS.init({
            locateFile: (path) => {
                if (path.endsWith('.wasm')) {
                    return wasmUrl;
                }
                return path;
            }
        });
    }
});