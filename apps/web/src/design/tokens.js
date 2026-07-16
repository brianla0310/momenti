// ─────────────────────────────────────────────────────────────
//  Momenti · design tokens (colors, radii, sticker styling)
//
//  FUTURE SOURCE OF TRUTH.
//  New and refactored UI should import design values from this
//  folder instead of hardcoding them.
//
//  NOTE: App.jsx is still a JSX-first prototype and continues to
//  inline most of these values (see `THEMES`, `tiltFor`, `.cp-sticker`).
//  These tokens intentionally *duplicate* those values for now — the
//  large refactor of App.jsx has not been done yet. Values here are
//  copied 1:1 from App.jsx so both stay visually identical.
// ─────────────────────────────────────────────────────────────

/* ---------- colors ---------- */
// Korean diary deco × Italian bar / gelato palette.
// Hex values match App.jsx `THEMES.caffe` / `THEMES.gelato`.
export const COLORS = {
  // surfaces
  paper: "#FFFBF2",       // sticker paper white (THEMES.*.paper)
  cream: "#F8EFDD",       // crema background (THEMES.caffe.bg)

  // ink / text
  espresso: "#33211A",    // primary ink (THEMES.caffe.ink) = rgb(51,33,26)

  // caffè accents — Italian bar
  bialettiRed: "#C8331B", // moka red (THEMES.caffe.accent)
  pistacchio: "#7C9A4E",  // pistachio green (THEMES.caffe.green)
  azzurro: "#6FA8C9",     // sky blue (THEMES.caffe.blue)

  // gelato / dolce accents
  amarena: "#E85D8A",     // amarena pink (THEMES.gelato.accent)
  fragolaMilk: "#FBE9F0", // latte di fragola (THEMES.gelato.bg)
};

// alias — some specs call the gelato background "gelatoPink"
export const GELATO_PINK = COLORS.fragolaMilk;

/* ---------- radii ---------- */
// App.jsx uses 16–22 for cards, 16 for stickers, 999 for pills/FAB.
export const RADII = {
  card: 20,     // page cards / sheets (base; App uses 16–22)
  sticker: 16,  // sticker cards & cutouts
  pill: 999,    // pills, toggles, FAB
};

/* ---------- sticker styling ---------- */
// The tactile "die-cut sticker" look: a white halo border around the
// emoji/photo plus a warm drop shadow, and a small playful rotation.
// The full drop-shadow filter strings live in ./shadows (SHADOWS.sticker).
export const STICKER = {
  whiteBorder: "#fff",     // die-cut halo color (see .cp-sticker in App.jsx)
  whiteBorderWidth: 2,     // px halo offset for large stickers (sm variant ≈ 1.2)
  rotationRange: [-8, 8],  // degrees; App.jsx tiltFor() = ((i*47)%17)-8 → -8..8
};
