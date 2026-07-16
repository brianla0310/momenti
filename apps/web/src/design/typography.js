// ─────────────────────────────────────────────────────────────
//  Momenti · typography tokens
//
//  FUTURE SOURCE OF TRUTH for fonts.
//
//  display = Fredoka  (rounded, sticker-label / wordmark feel)
//  body    = Nunito   (friendly, readable diary text)
//
//  NOTE: App.jsx's GlobalStyle still declares these font stacks and
//  the Google Fonts @import inline. The `stack` strings below are
//  copied verbatim from App.jsx so importing them changes nothing.
// ─────────────────────────────────────────────────────────────

// Google Fonts import used by App.jsx GlobalStyle (kept here for reuse).
export const FONT_IMPORT_URL =
  "https://fonts.googleapis.com/css2?family=Fredoka:wght@400;500;600;700&family=Nunito:wght@400;600;700;800&display=swap";

export const FONTS = {
  display: {
    name: "Fredoka",
    // matches App.jsx `.cp-display { font-family: ... }`
    stack: "'Fredoka', 'Nunito', ui-rounded, sans-serif",
    weights: [400, 500, 600, 700],
  },
  body: {
    name: "Nunito",
    // matches App.jsx `.cp-root { font-family: ... }`
    stack: "'Nunito', ui-rounded, -apple-system, sans-serif",
    weights: [400, 600, 700, 800],
  },
};

// convenience alias
export const TYPOGRAPHY = FONTS;
