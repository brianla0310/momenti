// ─────────────────────────────────────────────────────────────
//  Momenti · shadow tokens
//
//  FUTURE SOURCE OF TRUTH for shadows.
//
//  Momenti shadows are warm — tinted with espresso (#33211A =
//  rgb(51,33,26)) rather than neutral black — to keep the "paper on
//  a warm table" feeling.
//
//  NOTE: App.jsx still inlines these rgba(51,33,26,.xx) box-shadows
//  and the .cp-sticker / .cp-sticker-sm drop-shadow filters. Values
//  here are copied 1:1 and are not yet wired back into App.jsx.
// ─────────────────────────────────────────────────────────────

// espresso ink, as an rgb triplet for building translucent shadows.
// Kept as a raw string so it matches App.jsx exactly. Equals COLORS.espresso.
const INK = "51,33,26";

export const SHADOWS = {
  // soft warm elevation for cards / sheets (App.jsx uses .08–.14)
  cardSoft: `0 2px 8px rgba(${INK},.08)`,
  card: `0 3px 12px rgba(${INK},.09)`,
  raised: `0 6px 18px rgba(${INK},.3)`,

  // tactile die-cut sticker: 4-way white halo + warm drop shadow.
  // Assign to CSS `filter`. Matches .cp-sticker in App.jsx.
  sticker: [
    "drop-shadow(2px 0 0 #fff)",
    "drop-shadow(-2px 0 0 #fff)",
    "drop-shadow(0 2px 0 #fff)",
    "drop-shadow(0 -2px 0 #fff)",
    `drop-shadow(0 4px 6px rgba(${INK},.22))`,
  ].join(" "),

  // smaller sticker variant. Matches .cp-sticker-sm in App.jsx.
  stickerSm: [
    "drop-shadow(1.2px 0 0 #fff)",
    "drop-shadow(-1.2px 0 0 #fff)",
    "drop-shadow(0 1.2px 0 #fff)",
    "drop-shadow(0 -1.2px 0 #fff)",
    `drop-shadow(0 2px 3px rgba(${INK},.20))`,
  ].join(" "),

  // the warm drop-shadow color on its own, for ad hoc use.
  warm: `rgba(${INK},.22)`,
};
