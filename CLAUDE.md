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
- `npm test` — run the unit tests once (Vitest, `vitest run`)

`vite.config.ts` sets `build.assetsDir: "bundle"` (hashed JS goes to `dist/bundle/`, so `dist/assets/` holds only the unhashed images from `public/assets/` and only hashed files get the immutable cache header), raises `build.chunkSizeWarningLimit` (most of the ~1.38MB bundle is Phaser itself, so splitting would not avoid the 500KB warning) and adds the `sitemap` plugin that writes `dist/sitemap.xml` (see `public/` below).

Unit tests use Vitest (no config file; Vite's defaults pick up `src/**/*.test.ts`). They cover only pure logic kept free of Phaser: `src/difficulty.test.ts` tests `src/difficulty.ts` (level from elapsed time, spawn delay with its `MIN_SPAWN_DELAY` floor, coin initial velocity), and `src/share.test.ts` tests `src/share.ts`. Put new game-rule calculations in such a module and test them there rather than inlining them in a scene. Test files are never imported by `src/main.ts`, so they stay out of the bundle (`tsc` still type-checks them). There is no linter configured. Run `npm run typecheck`, `npm test` and `npm run build` to validate changes. GitHub Actions (`.github/workflows/ci.yml`) runs `npm ci`, `npm run typecheck`, `npm test`, and `npm run build` on Node 24 (read from `.node-version`, which the Cloudflare Pages build also reads) on pushes to `master` and on pull requests. Dependabot (`.github/dependabot.yml`) opens monthly update PRs for npm (minor/patch grouped; Phaser major updates ignored, upgrade those by hand after testing) and GitHub Actions; merge them only after CI passes.

## Architecture

This is a Phaser 4 browser game written in TypeScript and bundled with Vite. Game logic is split into Phaser `Scene` classes under `src/scenes/`; user-facing text lives in `src/i18n.ts`.

- **`index.html`** — Vite entry point; loads `src/main.ts` via `<script type="module">`. Also contains Google Analytics (loaded only on the production hostname), SEO/OGP meta tags, JSON-LD structured data, a visually hidden game description, a privacy policy link, and a loading message (`#loading`, removed at the start of `PlayScene.create`). `touch-action: none` is set on the canvas only, so pinch zoom still works outside the game area.
- **`src/main.ts`** — Phaser config only (`scene: [PlayScene, TitleScene, ResultScene]`); only the first scene auto-starts, and later scenes in the list render on top.
- **`src/scenes/PlayScene.ts`** — the play field: player, coins, HUD, timers, and all game state as instance fields. `preload` loads the assets. `create(data)` resets the state and either launches `TitleScene` over itself (`showTitle` not `false`, i.e. the first boot and language switches on the start screen) or calls `startGame` right away (restarts). `endGame` pauses physics, saves the high score, and launches `ResultScene`. `refreshHud()` rewrites the HUD in the current language.
- **`src/scenes/TitleScene.ts`** — the start screen, overlaid on the waiting `PlayScene`; Start stops it and calls `PlayScene.startGame`, a language switch restarts `PlayScene` with `{ showTitle: true }`.
- **`src/scenes/ResultScene.ts`** — the result screen, overlaid on the stopped `PlayScene` (dark overlay, result text, restart button after `RESTART_PROMPT_DELAY`, shown together with the share button); restart starts `PlayScene` with `{ showTitle: false }`, a language switch rewrites its own text and calls `PlayScene.refreshHud`. The bottom-right share button (or S key) opens X's post intent (`shareUrl` in `src/share.ts`, text `t.shareText(score)` in the current language) in a new tab.
- **`src/constants.ts`** — layout, difficulty, and timing constants and the scene keys. **`src/ui.ts`** — `addActionPrompt` (button plus Space / Enter) and `addLanguageButton` (button plus L key), shared by the overlay scenes, and `addShareButton` (bottom-right button plus S key; opens on `pointerup`, since mobile browsers block a popup opened from a touch `pointerdown`). **`src/share.ts`** — `SITE_URL` (the canonical URL) and the pure `shareUrl(text, url?)` (X Web Intent URL), tested in `src/share.test.ts`. **`src/highScore.ts`** — `loadHighScore` / `saveHighScore` (`localStorage`, wrapped in try/catch). **`src/difficulty.ts`** — pure difficulty calculations (`levelAt`, `spawnDelay`, `coinInitialVelocity`) used by `PlayScene`, tested in `src/difficulty.test.ts`.
- **`src/i18n.ts`** — Japanese and English messages (`t`), language detection from `localStorage` / `navigator.language`, and `toggleLanguage`. Add new on-screen text here instead of hard-coding it. Page metadata and the hidden description in `index.html` stay Japanese on purpose: crawlers often render in English, so rewriting them at runtime could hurt Japanese search results.
- **`public/assets/`** — static assets (`player.png`, `coin.png`) served as-is by Vite at `/assets/...`
- **`public/`** — also holds `apple-touch-icon.png` (180px, `coin.png` upscaled with nearest-neighbor on black), `og-image-v2.png` (the OGP image: a mid-play screenshot centered on black under the title; renamed from `og-image.png` so SNS caches refetch it — rename again when replacing it), `robots.txt`, `404.html` (a static Japanese/English not-found page with `noindex` and a link to `/`; with it Cloudflare Pages returns 404 for unknown paths instead of serving `index.html` with 200, where the relative image paths in `PlayScene.preload` would also break — keep those paths relative, #25), and `_headers` (Cloudflare Pages response headers: `nosniff` and `Referrer-Policy` on every path, and a one-year immutable `Cache-Control` on the hashed `/bundle/*` only — not on `/assets/*`, whose images are unhashed; no `X-Frame-Options`/CSP yet, pending how the game is put on portals, #25). Both are copied as-is into `dist/`. `sitemap.xml` is not in `public/`: the `sitemap` plugin in `vite.config.ts` writes it into `dist/` at build time with `<lastmod>` set to the last commit's date (`git log -1 --format=%cs`; the build date without git)
- **`ROADMAP.md`** — monetization assessment and completed TODOs (in Japanese). Known issues and open TODOs are tracked as GitHub Issues, not in this file

### Game Structure

The game uses Phaser's arcade physics on a logical 800×600 canvas (`GAME_WIDTH` / `GAME_HEIGHT`), scaled to the window with `Phaser.Scale.FIT`. Use these constants (and `CENTER_X`, `HUD_MARGIN`, and the layout constants such as `HIGH_SCORE_Y`, `TITLE_Y`, `RESULT_Y`, `ACTION_BUTTON_Y`) instead of hard-coded coordinates. Every `this.add.text` passes `fontFamily: FONT_FAMILY` (a system Japanese font stack, so kana/kanji and digits share one typeface; no web font is loaded). `tsconfig.json` has `noUnusedLocals`, so unused variables fail `npm run typecheck`.

- `player` — a sprite near the bottom; moves left/right with arrow keys, or toward the pointer while touching / holding the mouse. Gravity disabled, immovable.
- `coins` — a physics group; `scheduleSpawn` spawns coins at random X positions at the top and reschedules itself, with the delay (`spawnDelay` in `src/difficulty.ts`) shrinking as `level` rises. Coins fall under the world gravity (`GRAVITY_Y`) plus an initial velocity (`coinInitialVelocity`) that grows with `level`.
- `level` — derived from elapsed time in `updateLevel` via `levelAt` (`src/difficulty.ts`; every `LEVEL_DURATION` seconds).
- `score` / `scoreText` — incremented when `player` overlaps a coin (`collectCoin`), which also spawns a replacement coin via `generateCoin`.
- `remainingTime` — counts down from `TIME_LIMIT` (20s); at 0, `endGame` stops timers, pauses physics, saves the high score, and after `RESTART_PROMPT_DELAY` shows a restart button (Space / Enter also restart).
- `highScore` — persisted in `localStorage` (`src/highScore.ts`).

- Start screen — `TitleScene` is shown only on the first boot (and after switching language on it). `startGame` begins the spawn and countdown timers; restarts call it directly. `isPlaying` gates `update` and `endGame`.

Coins are destroyed when they go below `GAME_HEIGHT` or are caught. `create` resets all state so `scene.restart()` works.

Asset loading (`assets/player.png`, `assets/coin.png`) in `PlayScene.preload` resolves against `public/assets/`, which Vite serves at the same relative path in both dev and build.
