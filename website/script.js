document.addEventListener('DOMContentLoaded', async () => {
    const greeting = document.getElementById('greeting');
    const time = document.getElementById('time');
    const retroGamesContainer = document.getElementById('retro-games-container');
    const gameOverlay = document.getElementById('game-overlay');
    const gameFrame = document.getElementById('game-frame');
    const statusIcons = document.querySelector('.status-icons');

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
    function createGameCards(gamesList) {
        console.log('Creating cards for games:', gamesList);
        retroGamesContainer.innerHTML = '';

        gamesList.forEach(game => {
            const card = document.createElement('div');
            card.classList.add('game-card');

            const icon = document.createElement('div');
            icon.className = 'game-icon';
            
            const img = document.createElement('img');
            img.src = game.image;
            img.alt = game.title;
            icon.appendChild(img);
            
            const info = document.createElement('div');
            info.classList.add('game-info');
            const title = document.createElement('h3');
            title.textContent = game.title;
            info.appendChild(title);
            
            card.appendChild(icon);
            card.appendChild(info);
            
            card.addEventListener('click', () => {
                gameFrame.src = game.url;
                gameOverlay.classList.add('active');
            });
            
            retroGamesContainer.appendChild(card);
        });
    }

    // Close overlay
    window.closeOverlay = function() {
        gameOverlay.classList.remove('active');
        gameFrame.src = '';
    }

    // Load games
    async function loadGames() {
        try {
            const response = await fetch('/api/games/list');
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const files = await response.json();
            console.log('Found game files:', files);

            return files.map(file => {
                const gameName = file.replace('.html', '');
                return {
                    title: gameName.split('-').map(word => 
                        word.charAt(0).toUpperCase() + word.slice(1)
                    ).join(' '),
                    image: `/images/${gameName}.png`,
                    url: `/games/${file}`
                };
            });
        } catch (error) {
            console.error('Failed to load games:', error);
            return [];
        }
    }

    // Initialize everything
    async function init() {
        updateTime();
        updatePing();

        // Load and create game cards
        const gamesList = await loadGames();
        console.log('Loaded games:', gamesList);
        createGameCards(gamesList);

        // Set up intervals
        setInterval(updateTime, 60000);
        setInterval(updatePing, 5000);
    }

    // Start initialization
    init();
});