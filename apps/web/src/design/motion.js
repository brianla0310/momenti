// ─────────────────────────────────────────────────────────────
//  Momenti · motion tokens
//
//  FUTURE SOURCE OF TRUTH for named animations.
//
//  Momenti's motion vocabulary is tactile and sticker-like:
//    peel · stick · puff · bob · stamp · pageFlip · tear
//
//  IMPORTANT: only some of these exist in App.jsx today. The prototype
//  currently defines @keyframes cp-bob, cp-pop, cp-wiggle, cp-dash,
//  cp-fadeup, cp-steam. The names below are the *intended* system and
//  are NOT all wired into App.jsx yet — durations/easings are defined
//  here so future components can adopt them without a big refactor now.
// ─────────────────────────────────────────────────────────────

export const EASING = {
  // springy overshoot — used by App.jsx `.cp-pop`
  pop: "cubic-bezier(.34,1.56,.64,1)",
  standard: "ease",
  inOut: "ease-in-out",
};

// durations are in milliseconds.
export const MOTION = {
  peel:     { duration: 320,  easing: EASING.standard, status: "planned" },
  stick:    { duration: 450,  easing: EASING.pop,      status: "implemented (cp-pop)" },
  puff:     { duration: 1200, easing: EASING.standard, status: "partial (cp-balloon-fading)" },
  bob:      { duration: 3200, easing: EASING.inOut,    status: "implemented (cp-bob)" },
  stamp:    { duration: 250,  easing: EASING.pop,      status: "planned" },
  pageFlip: { duration: 500,  easing: EASING.standard, status: "planned" },
  tear:     { duration: 360,  easing: EASING.standard, status: "planned" },
};
