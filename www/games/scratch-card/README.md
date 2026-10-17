# Scratch & Match

A scratch-to-reveal memory matching game for children. Twelve tiles hide six pairs of cartoon pictures. All artwork is embedded in `app.js` as inline SVG data URIs, so the game works completely offline.

## How to Play

- Scratch a tile with a finger or the mouse: drag across the surface to rub it off. Roughly one third of the tile must be scratched before it is counted as revealed.
- Revealed tiles stay visible, so the board can be used to train memory.
- Find each matching pair. Every matched pair adds 20 coins to the counter at the top of the screen.
- When all six pairs are found, a celebration animation plays and the board is reshuffled for a new round.

## Files

- `index.html` - page structure: board, coin counter, instructions
- `app.js` - tile creation, scratch canvas handling, matching logic
- `style.css` - board, tile and animation styles
