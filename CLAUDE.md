# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Running the Game

There is no build step. Open `index.html` directly in a browser. Phaser is loaded from `node_modules/phaser/dist/phaser.min.js`, so `node_modules` must be present.

To install dependencies:
```
npm install
```

There are no tests and no linter configured.

## Architecture

This is a single-file Phaser 4 browser game. All game logic lives in `src/main.js`.

- **`index.html`** — loads Phaser from `node_modules` and `src/main.js` as a plain script (no bundler)
- **`src/main.js`** — the entire game: Phaser config, and three lifecycle functions (`preload`, `create`, `update`) plus helpers

### Game Structure

The game uses Phaser's arcade physics. Key globals in `main.js`:
- `player` — a blue rectangle (80×20) at the bottom; moves left/right with arrow keys, gravity disabled, immovable
- `coins` — a physics group; coins spawn at random X positions at the top every 1 second via a timer event and fall due to gravity
- `score` / `scoreText` — incremented when `player` overlaps a coin (`collectCoin`)

Coins are created using `coins.create(x, 0, "coin")` and destroyed when they go below y=600 or are caught. The `generateCoin` function is called both by the timer and inside `collectCoin` to immediately replace a caught coin.

Asset loading (`assets/player.png`, `assets/coin.png`) is present in `preload` but the game currently uses rectangle/tint fallbacks — the `assets/` directory does not exist yet.
