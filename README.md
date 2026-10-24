# HAPPIEST BIRTHDAY MARIYAMMMMMMM ✦

A custom, cinematic birthday website made with love by **MD (Makkar MD)**. The experience includes a liquid-glass interface, personal birthday letter, interactive wishes, a 10-second countdown, ten distinct storybook bursts, canvas fireworks, optional synthesized chimes, and a final birthday message.

## Run locally

This is a lightweight static HTML/CSS/JavaScript website with no required framework or external packages.

1. Install Node.js (only needed for local preview/build commands).
2. Open a terminal in this folder.
3. Run `npm install` (there are no runtime dependencies) and `npm run dev`.
4. Open the local address shown in the terminal.

You can also open `index.html` directly in a modern browser.

## Customize it

The visible birthday headline is intentionally set to **HAPPIEST BIRTHDAY MARIYAMMMMMMM**. To change the browser-tab birthday name, countdown duration, or default sound setting, edit `config.js`. The signature is set to MD (Makkar MD) in the page content.

Sound effects are synthesized in the browser after the visitor chooses to enable sound. No audio files or external services are required.

## Build

Run `npm run build`. The static production site is copied to `dist/`.

## Deploy on GitHub + Vercel

1. Create a GitHub repository.
2. Upload the contents of this project folder to the repository root: `index.html`, `styles.css`, `script.js`, `config.js`, `package.json`, `build.js`, `dev-server.js`, and `vercel.json`.
3. Import the repository in Vercel.
4. Choose **Other** as the framework preset if needed.
5. Use build command `npm run build` and output directory `dist`.
6. Deploy and share the public link.

No database, environment variables, paid API, or backend is needed.

## Project files

- `index.html` — birthday experience content and original SVG book illustrations.
- `styles.css` — liquid-glass theme, layouts, and animations.
- `script.js` — stage navigation, wish interactions, countdown, book bursts, fireworks, optional chimes, and canvas sky.
- `config.js` — browser-tab title, countdown, and default sound settings.
- `build.js` — copies the static site into `dist/`.
- `dev-server.js` — local preview server.

The page respects reduced-motion preferences, cleans up timers and canvas animation when the tab is hidden, and adapts to phone, tablet, and desktop layouts.
