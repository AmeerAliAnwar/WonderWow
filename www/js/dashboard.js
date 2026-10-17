// ========================================
// WONDERWOW - DASHBOARD JAVASCRIPT
// ========================================

// Game mapping - maps game IDs to their file paths
const GAMES = {
    'achi-game': {
        name: 'Realm Guardians',
        path: 'games/achi-game/index.html'
    },
    'animal-game': {
        name: 'Jungle Animals',
        path: 'games/animal-game/index.html'
    },
    'coloring': {
        name: 'Coloring World',
        path: 'games/coloring/index.html'
    },
    'passing-game': {
        name: "Pip's Adventure",
        path: 'games/passing-game/index.html'
    },
    'scratch-card': {
        name: 'Scratch & Match',
        path: 'games/scratch-card/index.html'
    },
    'puzzle-game': {
        name: 'Puzzle Fun',
        path: 'games/puzzle-game/puzzle_standalone.html'
    }
};

// DOM Elements
const dashboard = document.getElementById('dashboard');
const gameContainer = document.getElementById('game-container');
const gameFrame = document.getElementById('game-frame');
const loadingScreen = document.getElementById('loading-screen');

// Track current game
let currentGame = null;

/**
 * Load a game by its ID
 */
function loadGame(gameId) {
    if (!GAMES[gameId]) {
        console.error('Game not found:', gameId);
        return;
    }

    currentGame = gameId;
    const game = GAMES[gameId];

    // Show loading screen
    showLoading();

    // Play tap sound (if available)
    playSound('tap');

    // Push state for browser back button support
    if (window.history && window.history.pushState) {
        window.history.pushState({ game: gameId }, game.name, '#' + gameId);
    }

    // Hide dashboard, show game container
    dashboard.classList.remove('active');
    gameContainer.classList.add('active');

    // Load the game in iframe
    gameFrame.src = game.path;

    // Hide loading when game loads
    gameFrame.onload = () => {
        hideLoading();
    };

    // Fallback: hide loading after 3 seconds
    setTimeout(hideLoading, 3000);
}

/**
 * Go back to the home dashboard
 */
function goHome() {
    // Play tap sound
    playSound('tap');

    // Unload the game
    gameFrame.src = '';
    currentGame = null;

    // Update URL
    if (window.history && window.history.pushState) {
        window.history.pushState({ home: true }, 'WonderWow', window.location.pathname);
    }

    // Hide game container, show dashboard
    gameContainer.classList.remove('active');
    dashboard.classList.add('active');
    
    // Scroll dashboard to top
    dashboard.scrollTop = 0;
}

/**
 * Show loading screen
 */
function showLoading() {
    loadingScreen.classList.add('active');
}

/**
 * Hide loading screen
 */
function hideLoading() {
    loadingScreen.classList.remove('active');
}

/**
 * Play a sound effect
 */
function playSound(type) {
    // Sound effects can be added here
    // For now, we use vibration on Android if available
    if (navigator.vibrate) {
        navigator.vibrate(50);
    }
}

/**
 * Handle Android back button - Primary navigation method
 */
function handleBackButton(e) {
    if (e) {
        e.preventDefault();
    }
    
    if (currentGame) {
        // Return from game to dashboard
        goHome();
    } else {
        // On dashboard - exit app
        if (navigator.app && navigator.app.exitApp) {
            navigator.app.exitApp();
        } else if (window.navigator && window.navigator.app && window.navigator.app.exitApp) {
            window.navigator.app.exitApp();
        }
    }
}

/**
 * Initialize the app
 */
function init() {
    // Wait for device ready (Cordova)
    document.addEventListener('deviceready', onDeviceReady, false);

    // Also initialize for browser testing
    if (!window.cordova) {
        onDeviceReady();
    }
    
    // Handle browser back button as well
    window.addEventListener('popstate', function(e) {
        if (currentGame) {
            e.preventDefault();
            goHome();
        }
    });
}

/**
 * Device ready handler (Cordova)
 */
function onDeviceReady() {
    console.log('WonderWow initialized!');

    // Handle Android back button - this is the primary navigation
    document.addEventListener('backbutton', handleBackButton, false);

    // Add entrance animations to cards
    animateCards();
    
    // Set status bar style if available
    if (window.StatusBar) {
        StatusBar.styleDefault();
        StatusBar.backgroundColorByHexString('#667eea');
    }
}

/**
 * Animate game cards on load
 */
function animateCards() {
    const cards = document.querySelectorAll('.game-card');
    cards.forEach((card, index) => {
        card.style.opacity = '0';
        card.style.transform = 'translateY(30px)';
        
        setTimeout(() => {
            card.style.transition = 'all 0.5s cubic-bezier(0.34, 1.56, 0.64, 1)';
            card.style.opacity = '1';
            card.style.transform = 'translateY(0)';
        }, 100 + (index * 100));
    });
}

/**
 * Message handler for communication with games
 */
window.addEventListener('message', function(event) {
    if (event.data === 'goHome' || event.data.action === 'goHome') {
        goHome();
    }
});

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', init);
