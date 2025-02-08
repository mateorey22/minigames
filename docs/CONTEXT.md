# Retro Game Hub Website Project

## Current Status and Features

### Core Features
- **Pre-made Games:** Collection of classic games with custom icons
- **AI Game Generation:** Create custom games using Gemini AI
- **Dynamic Game Cards:** Responsive grid layout with hover effects
- **Game Thumbnails:** Custom icons for pre-made games, uploadable images for AI games
- **Settings Panel:** Theme switching and game preferences
- **Status Bar:** Real-time clock and ping simulation

### Game Types
1. **Pre-made Games**
   - Located in `/games` folder
   - Custom icons in `/images` folder
   - Includes classics like Tetris, Pac-Maze, and The Legend

2. **AI-Generated Games**
   - Created via Gemini AI
   - Custom thumbnail upload
   - Stored in localStorage
   - Data URL-based game storage

### Technical Implementation

#### Game Card System
- Combines pre-made and AI-generated games
- Consistent card layout for both types
- Fallback to default icon if image fails to load
- Responsive grid with dynamic sizing

#### Image Handling
- Pre-made games: Static images from `/images` folder
- AI games: Data URL storage in localStorage
- Upload system for AI game thumbnails
- SVG fallback for missing images

#### Storage System
- Pre-made games: File-based in `/games` and `/images`
- AI games: localStorage with data URLs
- No server requirements for basic functionality

## User Interface
- **Header:** Dynamic greeting and status info
- **Game Grid:** Masonry-style responsive layout
- **Settings:** Glass-morphic floating panel
- **AI Creation:** Integrated game generation panel
- **Upload Dialog:** Custom image upload for AI games

## Recent Updates
- Added pre-made game support
- Improved image handling system
- Enhanced card layout responsiveness
- Fixed settings panel functionality
- Added image upload for AI games
- Implemented localStorage-based game saving

## Future Considerations
- Add more pre-made games
- Enhance game card animations
- Improve mobile responsiveness
- Add game categories/tags
- Implement game search/filter
- Add game preferences persistence

## File Structure

## Project Overview

This project creates a website that emulates the interface of a transparent handheld gaming device. The site features a personalized greeting, current time and ping simulation in the status bar, an animated grid of retro game cards, and a settings panel for user customizations. When a game card is clicked, the corresponding game loads in an overlay modal via an iframe.

## Visual Style and Vibe

* **Retro-Futurism:** A blend of retro gaming aesthetics (pixel art, 8-bit colors) with a modern, clean design.
* **Transparency & Glassmorphism:** Extensive use of transparency and blur effects to mimic the feel of glass and a transparent handheld casing.
* **Rounded Corners & Layered Design:** All elements have smooth, rounded corners and appear to float, enhancing the immersive experience.
* **Color Palette & Typography:** Predominantly dark themes with vibrant accent colors, and a mix of a clean sans-serif font along with a pixelated style for game titles.

## Key Features

* **Personalized Greeting & Time Display:** The status bar dynamically shows a greeting based on the time of day along with the current time.
* **Ping Simulation:** A periodically updated ping value is displayed to enhance the interactive feel.
* **Responsive Game Grid:** A dynamic and responsive grid displays game cards with animations and hover effects.
* **Interactive Game Cards:** Each card features an image and title. Hover animations and subtle scaling provide a tactile feel.
* **Game Launcher Overlay:** Clicking a game card loads the game (via an iframe) into a glass-overlay modal along with a close button.
* **Settings Panel:** Provides controls for theme switching (light/dark), FPS limits, sound effects, and background music. The settings are stored with localStorage and communicated to the game if needed.
* **API Endpoint for Games:** The Express server includes an API to list game files from the `games` directory for dynamic integration.
* **Game Integration:** Multiple game files are available (e.g., `pong.html`, `color-match.html`, `game1.html`, `game2.html`, `game3.html`), with interactive and placeholder content ready for further enhancements.

## Development Tasks and Current Implementation

### 1. HTML Structure

- **Index Page (`index.html`):**
  - Contains the main "device" element with a "screen" that comprises the dynamic header (greeting, time, ping) and a responsive grid for game cards.
  - Includes a hidden overlay (glass-overlay) that activates to load games via an iframe.
  - A persistent settings button that opens the settings panel for customization.

- **Game Pages:**
  - Placeholder pages (`game1.html`, `game2.html`, `game3.html`) along with a fully implemented `pong.html` and `color-match.html` are available in the `games` folder.

### 2. CSS Styling

- **Overall Aesthetic:**
  - The design uses glassmorphic effects, transparent overlays, blur filters, and elegant gradients.
- **Responsive Layout & Animations:**
  - The game grid adjusts based on screen size.
  - Interactive hover animations on game cards, such as slight translation and scaling, enhance the user experience.
- **Theme Customization:**
  - Supports light and dark mode with corresponding background and color adjustments applied dynamically.

### 3. JavaScript Functionality

- **Dynamic Status Bar:**
  - Updates the greeting based on the time of day and shows the current time.
  - Simulates a ping value that refreshes periodically.
- **Game Loading & Communication:**
  - On clicking a game card, the appropriate game URL is loaded into an iframe within the overlay.
  - Current settings (FPS limit, sound effects, background music, theme) are sent to the game via postMessage.
- **Settings Management:**
  - A settings panel allows users to toggle theme, adjust FPS, and enable/disable sound settings. These preferences are saved using localStorage.
- **Cross-Window Messaging:**
  - Listens for messages from the game iframe to provide settings updates when needed.

### 4. Server and API

- **Express Server (`server.js`):**
  - Serves all static files from the website folder.
  - Features an API endpoint (`/api/games/list`) to dynamically list the available game files from the `games` directory.

### 5. Game Integration

- **Games Directory:**
  - Contains diverse game files including interactive versions like Pong and placeholder games, enabling a modular approach to game integration.
- **Real-time Settings Synchronization:**
  - When a game is launched, the current user settings are sent to the game for a seamless experience.

## Further Considerations

- **Accessibility:** Ongoing improvements are planned to ensure full accessibility.
- **Performance Enhancements:** Future updates will aim to optimize load times and improve responsiveness.
- **User Experience:** Continued refinements in interactivity, animations, and settings will be made to further engage users.
- **Feature Expansion:** Plans include adding more interactive games, enhanced user profiles, and dynamic game management via the API.
