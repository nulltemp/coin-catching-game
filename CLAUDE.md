# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Running the Game

This project uses Vite. Install dependencies first:
```
npm install
```

Then start the dev server (with HMR):
```
npm run dev
```

Other scripts:
- `npm run build` — production build to `dist/`
- `npm run preview` — serve the built `dist/` output locally

There are no tests and no linter configured.

## Architecture

This is a single-file Phaser 4 browser game bundled with Vite. All game logic lives in `src/main.js`.

- **`index.html`** — Vite entry point; loads `src/main.js` via `<script type="module">`
- **`src/main.js`** — the entire game: imports Phaser as an ES module (`import Phaser from "phaser"`), Phaser config, and three lifecycle functions (`preload`, `create`, `update`) plus helpers
- **`public/assets/`** — static assets (`player.png`, `coin.png`) served as-is by Vite at `/assets/...`

### Game Structure

The game uses Phaser's arcade physics. Key globals in `main.js`:
- `player` — a blue rectangle (80×20) at the bottom; moves left/right with arrow keys, gravity disabled, immovable
- `coins` — a physics group; coins spawn at random X positions at the top every 1 second via a timer event and fall due to gravity
- `score` / `scoreText` — incremented when `player` overlaps a coin (`collectCoin`)

Coins are created using `coins.create(x, 0, "coin")` and destroyed when they go below y=600 or are caught. The `generateCoin` function is called both by the timer and inside `collectCoin` to immediately replace a caught coin.

Asset loading (`assets/player.png`, `assets/coin.png`) in `preload` resolves against `public/assets/`, which Vite serves at the same relative path in both dev and build.
