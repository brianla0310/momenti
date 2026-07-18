# CLAUDE.md

## Product direction

Momenti is not a coffee passport app, and it is not a coffee/gelato app.
Momenti is a **photo-cutout sticker diary**: turn any photo into a sticker, decorate your days, and keep your diaries on a shelf like little books.

Coffee/gelato is **one optional theme, never the identity**.

The product feeling is:
Korean diary deco (다꾸) × tactile paper/sticker UI. (Italian bar/gelato is just one optional theme.)

Two core pillars:
- **Sticker system** — photo → on-device cutout → sticker; user-made stickers; packs; paper/glitter texture; creator marketplace (later)
- **Diary decorating** — tactile 다꾸: calendar (month/week), full-screen day pages, text boxes, fonts, inner-paper templates (속지), day thumbnails, multiple diaries as books

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

## Current state (on main — JSX-first prototype)

Implemented and merged:
1. Vite + React web app (JSX-first; TypeScript migration intentionally deferred).
2. Old Coffee Passport / Passaporto language removed from the UI.
3. Design token foundation in `apps/web/src/design/` (tokens, typography, shadows, motion).
4. Stickerbook overlay: tray + pagination, tap-to-place stickers on the Diary page.
5. localStorage persistence — single `momenti.v1` key, version 2, with v1→v2 migration.
6. StickerAsset / StickerInstance data models.
7. User-created stickers (emoji mock) + free 100-asset limit; paper/glitter texture.
8. Glitter rendering (holographic sheen) via a shared `StickerVisual` component.
9. Peel-back: press-and-hold to lift, drag to move, drop on a return zone to send back to the Stickerbook (tap still opens the action menu).

Still mock / not built: real photo upload + on-device cutout (emoji stand in), full-screen day pages, multiple diaries, any backend.

## Next (local-first, no backend)

1. De-scope: remove the Map tab + bubble system, neighborhood stamps, badges/keepsakes, and the drink log flow (`+` becomes "add a photo/sticker to today"); replace the caffe/gelato mode toggle with a **month/week** toggle; make the **Beans UI dormant** (keep the data model, hide the currency counter + shop).
2. Full-screen day deco mode MVP (stickers + text boxes, free-form layout).
3. Day thumbnails in calendar cells.
4. Photo upload + on-device background removal (cutout) — the heart of the product.
5. 속지 template engine + fonts (categories are templates, not features).
6. Multiple diaries + Bookshelf tab (local).
7. Image export (day page / month view as a shareable image with a small "made with Momenti" mark).

Backend-gated (needs Supabase/accounts): 8) Supabase + accounts, 9) friends + diary sharing + guestbook + exchange diary, 10) friends-only Moments Map, 11) creator marketplace (stickers + 속지 templates) + IAP, 12) Moka features, AR experiments.

**To remove in upcoming code work** (document only — do not remove code preemptively): Map tab + bubble system; neighborhood stamps + badges/keepsakes; drink log flow (hearts / cafe chips / drink picker); caffe/gelato mode toggle; Beans currency UI (dormant).

**Keep unchanged:** Moka mascot worldview; tactile / anti-utilitarian principles (no ratings, no follower counts as identity, no fintech/utility-map look); the avoid-list; JSX-first prototype approach; small-PR workflow.

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
