# 🫧 Momenti

**A photo-cutout sticker diary** — turn any photo into a sticker, decorate your days, and keep your diaries on a shelf like little books.

Design philosophy: **"Analog soul, digital superpowers."** Momenti mimics the physics and materiality of real paper — peeling, tilting, page-turns — while adding digital superpowers (infinite reuse, undo, everything backed up). It's a mobile 다꾸 (diary-deco) experience, not a SaaS dashboard. Coffee/gelato is one optional theme, never the identity.

> Photos and on-device cutout are the roadmap heart but **not built yet** — emoji stickers stand in for real photo stickers today.

## Where the app lives

The web app is at [`apps/web`](apps/web) — a Vite + React (JSX-first) prototype. It runs fully local: all data is stored in the browser's `localStorage`, no backend/accounts.

## Implemented today

- **Monthly / weekly diary** — a decoratable monthly spread + a week strip for navigation, following the browser's current local month
- **Full-screen day pages** — tap a day → a 3:4 portrait page that opens with a paper page-turn
- **Day thumbnails** — each calendar cell (month + week strip) previews its day's top sticker, or a small mark for a text-only day — derived live from the page, never stored
- **Stickers** — place emoji stickers on a page, then move / duplicate / peel them back with hold-lift-drag physics and a return zone
- **Text elements** — minimal text boxes on day pages (a few fonts, an ink palette, three sizes)
- **Undo / redo** — per day-page session (button + Ctrl/Cmd+Z)
- **Unified `PageElement` model** — one model for every surface element (`sticker`, `text`), stored per page
- **localStorage persistence** — a single versioned blob (storage schema v3) with v1→v2→v3 migration
- **Bookshelf** — placeholder shelf showing the current diary as a book cover

## Getting started

```bash
cd apps/web
npm install
npm run dev      # start the local dev server (Vite prints the localhost URL)
```

Other commands (run from `apps/web`):

```bash
npm run build    # production build (runs tsc -b then vite build)
npm run lint     # eslint
```

See [`apps/web/README.md`](apps/web/README.md) for web-app dev details.

## Docs

- [`docs/product.md`](docs/product.md) — **source of truth** for product scope, the v1 Locked Decisions, and the roadmap
- [`DESIGN.md`](DESIGN.md) — **source of truth** for visual & interaction design principles (read before any UI work)
- [`CLAUDE.md`](CLAUDE.md) — guidance for AI coding agents working in this repo

## What's next

The next roadmap item is **photo upload + two sticker styles** (polaroid + die-cut cutout, stored in IndexedDB, resized to 1080px) — the heart of the product, which replaces the emoji stand-in. After that: 3 속지 presets and image export. See [`docs/product.md`](docs/product.md) for the full roadmap.
