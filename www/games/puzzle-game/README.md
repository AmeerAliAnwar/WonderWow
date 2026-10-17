# Puzzle Fun

A 3x3 sliding puzzle for children. The board is shuffled at the start with 15 random valid moves, and the player slides the tiles until they are back in order. The game runs entirely offline.

## How to Play

- A "How to Play" overlay appears the first time the game is opened.
- Tap (or click) a tile that is next to the empty space. The tile slides into the empty spot.
- Arrange all tiles in order to solve the puzzle. A victory sound plays and the result is shown together with the number of moves taken.
- Use the device back button to return to the dashboard.

## Files

- `puzzle_standalone.html` - the complete game: structure, styles and logic in a single self-contained page. This is the file loaded by the app dashboard.
- `main.js` and `style.css` - an earlier drag-and-drop jigsaw prototype, kept for reference. It is not loaded by the dashboard.
- `assets/` - artwork and audio placeholder files for the prototype. The active game synthesises its sounds with the Web Audio API and does not depend on these files.
