# CLAUDE.md

## Product direction

Momenti is not a coffee passport app, and it is not a coffee/gelato app.
Momenti is a **photo-cutout sticker diary**: turn any photo into a sticker, decorate your days, and keep your diaries on a shelf like little books.

Coffee/gelato is **one optional theme, never the identity**.

The product feeling is:
Korean diary deco (다꾸) × tactile paper/sticker UI. (Italian bar/gelato is just one optional theme.)

Two core pillars:
- **Sticker system** — photo → sticker in **two styles from day one: polaroid (no cutout, white border + rounded corners) + die-cut (on-device cutout)**; user-made stickers; packs; paper/glitter texture; creator marketplace (later). Photos live in IndexedDB, resized to 1080px on import.
- **Diary decorating** — tactile 다꾸: month/week calendar (week = **navigation only**), full-screen **3:4** day pages, minimal text boxes, fonts, **3 fixed 속지 presets** (daily / travel / moodboard — no template engine in v1), day thumbnails, multiple diaries as books

**v1 is locked** — see `docs/product.md` → "★ v1 Locked Decisions (D1–D15)". Design philosophy: **"Analog soul, digital superpowers"** — obsessively mimic the physics/materiality of real paper (behavior over ornament; a paper page-turn on every nav; interactions <100ms, animations 60fps or simplified; prefers-reduced-motion always respected), while adding digital superpowers (infinite reuse, undo, everything backed up). **No consumable per-use sticker counts, ever** — the 100-asset limit is a created-asset storage/business cap only.

Social is a **future, backend-gated layer** (after Supabase), not a current pillar: friends, diary sharing, guestbook (방명록), exchange diary (교환일기), and a **friends-only Moments Map** (the live bubble map returns here — friend density solves cold start).

Core tabs (after cleanup):
- Diary
- Bookshelf (책장 — diary covers on a shelf; replaces the old Stickerbook/collection tab)
- `+` (add a photo/sticker to today)

Avoid:
- Coffee Passport / passport language; coffee/gelato as the identity
- star ratings
- permanent review database
- follower/following counts as identity
- Instagram-like public profile grid
- Google Maps / fintech / utility-map look
- game-economy / currency-heavy UI
- consumable per-use sticker counts ("×N uses") — every asset is infinitely reusable
- kitsch fake textures (fake leather) — mimic paper's behavior, not surface skins

## Current state (on main — JSX-first prototype)

Implemented and merged:
1. Vite + React web app (JSX-first; TypeScript migration intentionally deferred).
2. Old Coffee Passport / Passaporto language removed from the UI.
3. Design token foundation in `apps/web/src/design/` (tokens, typography, shadows, motion).
4. Stickerbook overlay: tray + pagination, tap-to-place stickers on the Diary page.
5. localStorage persistence — single `momenti.v1` key, now **version 3** (v1→v2→v3 migration).
6. StickerAsset / StickerInstance data models.
7. User-created stickers (emoji mock) + free 100-asset limit; paper/glitter texture.
8. Glitter rendering (holographic sheen) via a shared `StickerVisual` component.
9. Peel-back: press-and-hold to lift, drag to move, drop on a return zone to send back to the Stickerbook (tap still opens the action menu).
10. De-scope to the sticker-diary core (PR #10): removed the Map tab + bubbles, neighborhood stamps, badges/keepsakes, drink log flow; caffe/gelato mode toggle → month/week toggle (week = navigation only); Bookshelf placeholder tab; Beans UI removed from view (data kept).
11. Full-screen day pages (PR #12): tap a day → 3:4 portrait page with a paper page-turn open/close; the unified **`PageElement`** model (`sticker` / `text`); one shared element layer drives stickers on both the monthly spread and day pages; storage schema **v3** (`diaries[]` + pages keyed by `(diaryId, date)`) with v2→v3 migration.
12. Minimal text boxes + undo/redo on day pages (PR #13): tap-to-edit text with a tiny font/color/size/delete toolbar (D6 minimal spec — no bold/italic/align); hold to lift-drag; per-session snapshot undo/redo (button + Ctrl/Cmd+Z).
13. Bookshelf visibility toggle removed — the local-first app has no public/private toggle (sharing returns with the backend layer).
14. Day thumbnails in calendar cells: each month cell and week-strip day previews its day page's top sticker (or a small pen mark for a text-only day), reusing the shared `StickerVisual`. Read-only and **derived live** from the day page each render via `pickDayThumbnail` — no thumbnail field, no separate persistence.

Still mock / not built: real photo upload + two sticker styles (emoji stand in), 3 속지 presets, multiple diaries, image export, any backend.

## Next (local-first, no backend)

1. De-scope (done, PR #10).
2. Full-screen day deco mode MVP (done, PR #12/#13) — 3:4 page, stickers + minimal text boxes, unified `PageElement` model, undo/redo, storage v3.
3. Day thumbnails in calendar cells (done) — top sticker / text-only mark, derived live, no new persistence.
4. **Photo upload + two sticker styles** (polaroid + die-cut cutout), IndexedDB, 1080px ← next. The heart of the product. Replaces the emoji creator; the 100-limit is revisited as a storage-based cap.
5. **3 fixed 속지 presets** (daily / travel / moodboard, no engine) + fonts + **Moka default sticker pack** assets.
6. Image export + **Moka corner mark** (1080×1440, optional 9:16) = **🚩 V1 LAUNCH LINE**.
7. Multiple diaries + Bookshelf expansion (acceptable as **v1.1**).

Backend-gated (needs Supabase/accounts): 8) Supabase + accounts, 9) friends + diary sharing + guestbook + exchange diary, 10) friends-only Moments Map, 11) creator marketplace (stickers + 속지 templates) + IAP, 12) Moka features, AR experiments.

**Removed in the de-scope (PR #10):** Map tab + bubble system; neighborhood stamps + badges/keepsakes; drink log flow (hearts / cafe chips / drink picker); caffe/gelato mode toggle; Beans currency UI (dormant — data kept); public/private flag UI (returns with sharing/backend).

**Keep unchanged:** Moka mascot worldview; tactile / anti-utilitarian principles (no ratings, no follower counts as identity, no fintech/utility-map look); the avoid-list; JSX-first prototype approach; small-PR workflow.

## Sources of truth & working style

- **`docs/product.md`** is the source of truth for product scope, the v1 Locked Decisions (D1–D15), and the roadmap. Confirm a task is in scope there before building.
- **`DESIGN.md`** (repo root) is the source of truth for visual & interaction design. **Read it before any UI work.**
- Don't redesign existing systems unprompted — reuse existing components, patterns, and design tokens; make the minimum change the task needs.
- Don't mix in unrequested features or refactors. If you spot an out-of-scope issue, report it as a follow-up candidate rather than fixing it inline.
- Prefer small PRs with clear manual verification.

## Engineering rules

- Never push directly to main after the initial setup.
- Always work on feature branches.
- Keep PRs small.
- Run npm run build before committing when a real app project exists.
- Do not add real API keys.
- Do not edit .env files.
- Do not add Google Maps, Supabase, IAP, AR, or real image upload unless explicitly requested.
- Keep the app working as a local prototype.
- Preserve the warm paper / sticker / tape / Moka visual identity; respect prefers-reduced-motion.
