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

1. Convert the existing prototype to Vite + React + TypeScript.
2. Remove old Coffee Passport / Passaporto language.
3. Create reusable design tokens.
4. Add Stickerbook as the replacement for Passport.
5. Add StickerAsset and StickerInstance data models.
6. Add free 100 sticker asset limit.
7. Add Return to Stickerbook behavior.
8. Add localStorage persistence.
9. Improve mock Live Bubble Map.
10. Add Moka Trails.

## Engineering rules

- Never push directly to main after the initial setup.
- Always work on feature branches.
- Keep PRs small.
- Run npm run build before committing when a real app project exists.
- Do not add real API keys.
- Do not edit .env files.
- Do not add Google Maps, Supabase, IAP, AR, or real image upload unless explicitly requested.
- Keep the app working as a local prototype.