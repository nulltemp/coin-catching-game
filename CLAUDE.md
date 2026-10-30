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
- `npm run typecheck` — type-check with `tsc --noEmit`

There are no tests and no linter configured. Run `npm run typecheck` and `npm run build` to validate changes.

## Architecture

This is a Phaser 4 browser game written in TypeScript and bundled with Vite. All game logic lives in `src/main.ts`; user-facing text lives in `src/i18n.ts`.

- **`index.html`** — Vite entry point; loads `src/main.ts` via `<script type="module">`. Also contains Google Analytics (loaded only on the production hostname), SEO/OGP meta tags, JSON-LD structured data, a visually hidden game description, and a privacy policy link.
- **`src/main.ts`** — the entire game: imports Phaser as an ES module (`import Phaser from "phaser"`), Phaser config, and three lifecycle functions (`preload`, `create`, `update`) plus helpers
- **`src/i18n.ts`** — Japanese and English messages (`t`), language detection from `localStorage` / `navigator.language`, and `toggleLanguage`. Add new on-screen text here instead of hard-coding it. Page metadata and the hidden description in `index.html` stay Japanese on purpose: crawlers often render in English, so rewriting them at runtime could hurt Japanese search results.
- **`public/assets/`** — static assets (`player.png`, `coin.png`) served as-is by Vite at `/assets/...`
- **`public/`** — also holds `og-image.png`, `robots.txt`, and `sitemap.xml`
- **`ROADMAP.md`** — monetization assessment and TODO list (in Japanese)

### Game Structure

The game uses Phaser's arcade physics on a logical 800×600 canvas (`GAME_WIDTH` / `GAME_HEIGHT`), scaled to the window with `Phaser.Scale.FIT`. Use these constants (and `CENTER_X`, `HUD_MARGIN`) instead of hard-coded coordinates.

- `player` — a sprite near the bottom; moves left/right with arrow keys, or toward the pointer while touching / holding the mouse. Gravity disabled, immovable.
- `coins` — a physics group; `scheduleSpawn` spawns coins at random X positions at the top and reschedules itself, with the delay shrinking as `level` rises. Coins fall under the world gravity (`GRAVITY_Y`) plus an initial velocity that grows with `level`.
- `level` — derived from elapsed time in `updateLevel` (every `LEVEL_DURATION` seconds).
- `score` / `scoreText` — incremented when `player` overlaps a coin (`collectCoin`), which also spawns a replacement coin via `generateCoin`.
- `remainingTime` — counts down from `TIME_LIMIT` (20s); at 0, `endGame` stops timers, pauses physics, saves the high score, and after `RESTART_PROMPT_DELAY` shows a restart button (Space / Enter also restart).
- `highScore` — persisted in `localStorage` (`loadHighScore` / `saveHighScore`, wrapped in try/catch).

- Start screen — `showStartScreen` is shown only on the first `create` (`hasSeenStartScreen`). `startGame` begins the spawn and countdown timers; restarts call it directly. `isPlaying` gates `update` and `endGame`.

Coins are destroyed when they go below `GAME_HEIGHT` or are caught. `create` resets all state so `scene.restart()` works.

Asset loading (`assets/player.png`, `assets/coin.png`) in `preload` resolves against `public/assets/`, which Vite serves at the same relative path in both dev and build.
