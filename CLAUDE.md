# CLAUDE.md

## Product direction

Momenti is not a coffee passport app.
Momenti is a sticker diary and live bubble map.

The product feeling is:
Korean diary deco × Italian bar/gelato culture × tactile sticker UI.

Core tabs:
- Diary
- Studio
- Map
- Stickerbook

Avoid:
- Coffee Passport language
- Passport as the primary metaphor
- Passaporto as a main screen
- star ratings
- permanent review database
- follower/following social graph
- Instagram-like public profile grid
- Google Maps-looking utility UI

## Current implementation priorities

Done:

1. Converted the prototype to a Vite + React web app (JSX-first; TypeScript migration intentionally deferred).
2. Removed old Coffee Passport / Passaporto language from visible UI.
3. Created the design token foundation in `apps/web/src/design/` (tokens, typography, shadows, motion).
4. First minimal Stickerbook overlay: tray + pagination, tap-to-place stickers on the Diary page.
5. First Return to Stickerbook behavior (removes the placed instance, keeps the asset), plus Duplicate and Remove from page.

Next:

1. Add localStorage persistence.
2. Formalize StickerAsset and StickerInstance data models.
3. Add free 100 sticker asset limit.
4. Continue replacing inline styles with design tokens.
5. Improve mock Live Bubble Map.
6. Add Moka Trails.

## Engineering rules

- Never push directly to main after the initial setup.
- Always work on feature branches.
- Keep PRs small.
- Run npm run build before committing when a real app project exists.
- Do not add real API keys.
- Do not edit .env files.
- Do not add Google Maps, Supabase, IAP, AR, or real image upload unless explicitly requested.
- Keep the app working as a local prototype.