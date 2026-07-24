# Momenti — web app

The Momenti web app: a Vite + React (JSX-first) prototype. All state lives in the
browser's `localStorage` — there is no backend, no accounts, no build-time secrets.

TypeScript migration is intentionally deferred; the code is JSX with JSDoc types.

## Commands

Run all commands **from this `apps/web` folder**:

```bash
npm install      # install dependencies (first time / after lockfile changes)
npm run dev      # start the dev server — Vite prints the localhost URL in the terminal
npm run lint     # run eslint
npm run build    # production build (runs `tsc -b` then `vite build`)
```

- Stop the dev server with **Ctrl + C** in its terminal.
- There is no test script in `package.json` yet.

## Local data

The app persists a single blob under the `localStorage` key `momenti.v1`
(storage schema **v3**). **Clearing site data / localStorage deletes your local
diary** (placed stickers, text, pages). Old blobs migrate forward (v1→v2→v3) on
load. A blob the app can't read safely — a schema **newer than v3**, an unknown
version, corrupt JSON, or a broken top-level shape — is **left untouched**: the
app shows a recovery notice and won't save over it, rather than silently starting
empty (see `src/data/persistence.js`).

## Manual test checklist

After changes, sanity-check in the browser:

- **Diary:** month/week toggle; a day cell opens the full-screen day page (past/today only; future days disabled).
- **Day page:** opens with a paper page-turn; the 3:4 canvas is centered/letterboxed; the close button returns to the calendar.
- **Stickers:** "Add stickers" opens the Stickerbook overlay; picking a sticker → tap the page to place it; hold-lift-drag to move; drop on the return zone to send it back.
- **Text:** "Text" adds a note; tap to edit (font / color / size / delete toolbar); hold to move; empty notes disappear on blur.
- **Undo/redo:** the day-page undo/redo buttons and Ctrl/Cmd+Z reflect add / move / delete / text edits instantly.
- **Persistence:** reload the page — placements and text survive.
- **Bookshelf tab** and the **`+`** button still work.
- **Reduced motion:** with `prefers-reduced-motion`, the page-turn simplifies to a fade and everything still works.

## Structure

```
src/
  App.jsx                 # the whole app (JSX-first prototype)
  data/
    stickers.js           # StickerAsset model + seed
    pageElements.js       # unified PageElement model (sticker / text)
  components/
    StickerVisual.jsx     # shared sticker renderer (paper / glitter)
  design/                 # design tokens: tokens, typography, shadows, motion
```
