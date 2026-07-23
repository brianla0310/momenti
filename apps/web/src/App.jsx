// ─────────────────────────────────────────────────────────────
//  MOMENTI · photo-cutout sticker diary (JSX-first prototype)
//  Screens: Diary (sticker calendar, month/week) · Bookshelf.
//  "+" opens the Stickerbook overlay. Emoji stand in for real
//  photo-cutout stickers. Coffee/gelato is just an optional theme.
// ─────────────────────────────────────────────────────────────
import { useState, useEffect, useRef } from "react";
import { BookOpen, Library, Plus, X, Undo2, Redo2 } from "lucide-react";
// Design tokens (future source of truth). App.jsx is still JSX-first and mostly
// inlines its own values; this wires in the font stacks, sticker rotation range,
// and the warm ink palette for text elements.
import { FONTS } from "./design/typography";
import { STICKER, COLORS } from "./design/tokens";
import { createStickerAsset, createStickerInstance, seedStickerAssets, FREE_ASSET_LIMIT } from "./data/stickers";
import { createPageElement } from "./data/pageElements";
import StickerVisual from "./components/StickerVisual";
import DayThumbnail from "./components/DayThumbnail";
import MonthNavigation from "./components/MonthNavigation";
import MonthPickerSheet from "./components/MonthPickerSheet";
import {
  createCalendarContext, createMonthContext, isFutureLocalDay,
  isFutureMonth, compareYearMonth, addMonths, clampDayToMonth, clampDescriptorToToday, dayKeyOf,
  addDaysLocal, getLocalWeekDays, isSameLocalWeek,
} from "./calendar/dateUtils";

/* ---------- theme tokens ---------- */
/* single warm palette (the old caffe theme); gelato branch removed in the
   de-scope. Coffee/gelato returns later only as an optional theme. */
const THEME = {
  bg: "#F8EFDD",          // crema
  paper: "#FFFBF2",
  ink: "#33211A",         // espresso
  sub: "#8A6F5C",
  accent: "#C8331B",      // bialetti red
  accentSoft: "#F6D7C9",
  green: "#7C9A4E",       // pistacchio
  greenSoft: "#E4ECD2",
  blue: "#6FA8C9",        // azzurro
  tape: "rgba(200,51,27,.18)",
};

/* ---------- content data ---------- */
const DRINKS = {
  caffe: [
    { emoji: "☕", name: "Espresso", tag: "€1.20 · al banco" },
    { emoji: "🥛", name: "Macchiato", tag: "schiuma perfetta" },
    { emoji: "🍫", name: "Marocchino", tag: "cacao + amore" },
    { emoji: "🍸", name: "Shakerato", tag: "estate mood" },
    { emoji: "🥐", name: "Cornetto", tag: "colazione!" },
    { emoji: "🍨", name: "Affogato", tag: "metà caffè metà gelato" },
  ],
  gelato: [
    { emoji: "🍦", name: "Fior di latte", tag: "il classico" },
    { emoji: "🍨", name: "Pistacchio", tag: "verde spento = vero" },
    { emoji: "🍋", name: "Sorbetto limone", tag: "fresco fresco" },
    { emoji: "🍓", name: "Fragola", tag: "di stagione" },
    { emoji: "🍒", name: "Amarena", tag: "con panna, dai" },
    { emoji: "🍧", name: "Granita", tag: "quasi Sicilia" },
  ],
};

const DECOS = ["✨", "💛", "🌼", "⭐", "🇮🇹"];

/* Stickerbook assets: reusable StickerAsset designs seeded from the built-in
   drink + deco emoji (see ./data/stickers). Placed stickers on the diary page
   are separate StickerInstances that reference an asset by id, so
   returning/removing an instance never touches the asset. No uploads/backend. */
/* a tasteful few base decos ship as glitter so the effect shows without
   making a user sticker: ✨ Sparkle (deco-0) and ⭐ Stella (deco-3). */
const GLITTER_BASE_IDS = new Set(["deco-0", "deco-3"]);
const STICKER_ASSETS = seedStickerAssets({
  caffe: DRINKS.caffe,
  gelato: DRINKS.gelato,
  decos: DECOS,
  decoNames: ["Sparkle", "Cuore", "Margherita", "Stella", "Italia"],
}).map((a) => (GLITTER_BASE_IDS.has(a.id) ? { ...a, texture: "glitter" } : a));
const ASSET_BY_ID = Object.fromEntries(STICKER_ASSETS.map((a) => [a.id, a]));
/* Single diary until the multiple-diaries PR (§D4) — structure is v3-ready.
   Surfaces are keyed pages: the monthly spread is "YYYY-MM" (e.g. "2026-07")
   and each day page is "YYYY-MM-DD" (e.g. "2026-07-15"). */
const DIARY_ID = "diary-1";
/* live calendar frame from the browser's LOCAL date, captured once at load
   (a stable session snapshot — no midnight auto-roll; that's a later item).
   Injectable base date + all date math live in ./calendar/dateUtils. */
const CAL = createCalendarContext();
/* legacy monthly-spread key: pre-local-date data (v1/v2) was placed on the
   fixed 2026-07 spread. Migrations preserve that historical key verbatim —
   they never move old placements onto the current local month. */
const LEGACY_MONTH_KEY = "2026-07";
/* dayKeyFor moved INTO the app shell — day keys derive from the VISIBLE month
   (past-month navigation), not a fixed module-level month. See Momenti(). */
const BOOK_PAGE_SIZE = 8;

/* text elements (day pages only, §D6 — deliberately minimal, nothing more):
   3 fonts × 5 warm inks × 3 sizes. No bold/italic, no alignment, no links. */
const TEXT_FONTS = {
  hand: { label: "Hand", stack: "'Caveat', 'Fredoka', cursive" },        // cute handwriting default
  round: { label: "Round", stack: FONTS.display.stack },                  // Fredoka (design token)
  clean: { label: "Clean", stack: FONTS.body.stack },                     // Nunito (design token)
};
const TEXT_COLORS = [COLORS.espresso, COLORS.bialettiRed, COLORS.pistacchio, COLORS.azzurro, COLORS.amarena];
const TEXT_SIZES = { S: 14, M: 19, L: 26 };
const UNDO_CAP = 50;

/* mock "make a sticker" creator: curated fun emoji + cute default names.
   No real image upload — emoji content only for now. */
const CREATOR_EMOJI = ["🌈", "⭐", "💖", "🔥", "🌸", "🍀", "🦋", "🐱", "🌙", "☁️", "🍩", "🧁", "🎀", "👑", "💎", "🍭", "🌵", "🐳", "🍄", "⚡"];
const CUTE_NAMES = ["Cutie", "Dolce", "Bubbly", "Ciao", "Amore", "Sparkle", "Momento"];

const PACKS = [
  { id: "dolce", name: "Dolce vita", items: ["🎀", "💌", "🫶"], price: 10 },
  { id: "estate", name: "Estate italiana", items: ["🍉", "🌊", "⛱️"], price: 8 },
  { id: "ferra", name: "Ferragosto · limitata!", items: ["🌞", "🍑", "🎆"], price: 20, limited: true },
];

/* calendar frame (today, days-in-month, Monday-first offset of the 1st) is
   derived from the local date in CAL — see ./calendar/dateUtils. */

/* random helpers (deterministic-ish tilt per index) */
const tiltFor = (i) => ((i * 47) % 17) - 8;
/* free tilt for newly placed stickers, within the token rotation range */
const randomTilt = () => {
  const [min, max] = STICKER.rotationRange;
  return min + Math.random() * (max - min);
};

/* ---------- global css ---------- */
const GlobalStyle = ({ t }) => (
  <style>{`
    @import url('https://fonts.googleapis.com/css2?family=Fredoka:wght@400;500;600;700&family=Nunito:wght@400;600;700;800&family=Caveat:wght@500;600&display=swap');

    .cp-root { font-family: ${FONTS.body.stack}; }
    .cp-display { font-family: ${FONTS.display.stack}; }

    .cp-sticker {
      display: inline-block; line-height: 1;
      filter:
        drop-shadow(2px 0 0 #fff) drop-shadow(-2px 0 0 #fff)
        drop-shadow(0 2px 0 #fff) drop-shadow(0 -2px 0 #fff)
        drop-shadow(0 4px 6px rgba(51,33,26,.22));
    }
    .cp-sticker-sm {
      display: inline-block; line-height: 1;
      filter:
        drop-shadow(1.2px 0 0 #fff) drop-shadow(-1.2px 0 0 #fff)
        drop-shadow(0 1.2px 0 #fff) drop-shadow(0 -1.2px 0 #fff)
        drop-shadow(0 2px 3px rgba(51,33,26,.20));
    }
    /* glitter: slightly thicker white die-cut edge than paper */
    .cp-sticker-glit {
      display: inline-block; line-height: 1;
      filter:
        drop-shadow(3px 0 0 #fff) drop-shadow(-3px 0 0 #fff)
        drop-shadow(0 3px 0 #fff) drop-shadow(0 -3px 0 #fff)
        drop-shadow(0 4px 7px rgba(51,33,26,.24));
    }

    @keyframes cp-bob { 0%,100% { transform: translateY(0); } 50% { transform: translateY(-7px); } }
    @keyframes cp-pop { 0% { transform: scale(.3) rotate(-12deg); opacity: 0; } 70% { transform: scale(1.12) rotate(3deg); } 100% { transform: scale(1) rotate(0); opacity: 1; } }
    @keyframes cp-wiggle { 0%,100% { transform: rotate(-6deg); } 50% { transform: rotate(8deg); } }
    @keyframes cp-dash { to { stroke-dashoffset: -40; } }
    @keyframes cp-fadeup { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
    @keyframes cp-steam { 0% { opacity:0; transform: translateY(4px) scale(.8);} 40% {opacity:.7;} 100% { opacity:0; transform: translateY(-14px) scale(1.15);} }

    .cp-pop { animation: cp-pop .45s cubic-bezier(.34,1.56,.64,1) both; }
    .cp-fadeup { animation: cp-fadeup .35s ease both; }
    .cp-bob { animation: cp-bob 3.2s ease-in-out infinite; }

    /* holographic sheen sweeping across a glitter sticker */
    @keyframes cp-glit { from { background-position: -120% 0; } to { background-position: 220% 0; } }
    .cp-glitter-sheen {
      position: absolute; inset: 0; border-radius: 22%; pointer-events: none;
      background: linear-gradient(115deg, transparent 32%, rgba(255,90,200,.55) 44%, rgba(120,200,255,.6) 50%, rgba(190,255,140,.55) 56%, transparent 68%);
      background-size: 220% 100%;
      mix-blend-mode: screen;
      animation: cp-glit 2.6s linear infinite;
    }

    .cp-balloon-fading { opacity: .35; transform: scale(.85); transition: all 1.2s ease; }

    /* peel-back: smooth lift / settle / fly-out for placed stickers */
    .cp-drag-settle { transition: transform .24s cubic-bezier(.34,1.56,.64,1), opacity .2s ease; }

    /* day page: paper page-turn from the left spine (3D rotate + traveling
       shadow, compositor-only: transform + opacity → holds 60fps) */
    @keyframes cp-pageturn-in  { from { transform: perspective(1400px) rotateY(-70deg); } to { transform: perspective(1400px) rotateY(0deg); } }
    @keyframes cp-pageturn-out { from { transform: perspective(1400px) rotateY(0deg); } to { transform: perspective(1400px) rotateY(-70deg); } }
    .cp-pageturn-in  { transform-origin: left center; animation: cp-pageturn-in .46s cubic-bezier(.22,.9,.3,1) both; will-change: transform; }
    .cp-pageturn-out { transform-origin: left center; animation: cp-pageturn-out .36s cubic-bezier(.55,.06,.68,.19) both; will-change: transform; }
    @keyframes cp-pageshade-in  { from { opacity: .38; } to { opacity: 0; } }
    @keyframes cp-pageshade-out { from { opacity: 0; } to { opacity: .38; } }
    .cp-pageshade-in  { animation: cp-pageshade-in .46s ease-out both; }
    .cp-pageshade-out { animation: cp-pageshade-out .36s ease-in both; }
    @keyframes cp-dayfade { from { opacity: 0; } to { opacity: 1; } }

    .cp-scroll { scrollbar-width: none; }
    .cp-scroll::-webkit-scrollbar { display: none; }

    button { font-family: inherit; }
    input { font-family: inherit; }
    input:focus, button:focus-visible { outline: 2px solid ${t.accent}; outline-offset: 2px; }

    @media (prefers-reduced-motion: reduce) {
      .cp-bob, .cp-pop, .cp-fadeup { animation: none !important; }
      .cp-glitter-sheen { animation: none !important; } /* static sheen */
      .cp-drag-settle { transition: none !important; } /* instant lift/settle */
      /* page turn simplifies to a fade — function never breaks (§D14) */
      .cp-pageturn-in  { animation: cp-dayfade .18s ease both !important; }
      .cp-pageturn-out { animation: cp-dayfade .18s ease both reverse !important; }
      .cp-pageshade-in, .cp-pageshade-out { animation: none !important; opacity: 0 !important; }
    }
  `}</style>
);

/* ═══════════════ shared bits ═══════════════ */

const Tape = ({ t, rot = -3, w = 74 }) => (
  <div style={{
    position: "absolute", top: -9, left: "50%",
    transform: `translateX(-50%) rotate(${rot}deg)`,
    width: w, height: 18, background: t.tape,
    borderLeft: "1px dashed rgba(0,0,0,.08)", borderRight: "1px dashed rgba(0,0,0,.08)",
    borderRadius: 2, pointerEvents: "none",
  }} />
);

/* ═══════════════ 1 · DIARY ═══════════════ */

/* drop target shown while a placed sticker is lifted; highlights on hover */
function ReturnZone({ t, active, innerRef }) {
  return (
    <div
      ref={innerRef}
      aria-hidden
      className="cp-display cp-fadeup"
      style={{
        position: "fixed", left: "50%", bottom: 96, zIndex: 70,
        transform: `translateX(-50%) scale(${active ? 1.06 : 1})`,
        display: "flex", alignItems: "center", gap: 8,
        padding: "12px 20px", borderRadius: 999, pointerEvents: "none",
        background: active ? t.accent : t.paper,
        color: active ? "#fff" : t.ink,
        border: `2px dashed ${active ? "#fff" : t.accent}`,
        boxShadow: "0 10px 24px rgba(51,33,26,.3)",
        fontSize: 13, fontWeight: 700, whiteSpace: "nowrap",
        transition: "background .15s ease, color .15s ease, transform .15s ease",
      }}
    >
      <BookOpen size={16} /> {active ? "Release to return" : "Return to stickerbook"}
    </div>
  );
}

const HOLD_MS = 300;       // press-and-hold to lift
const MOVE_CANCEL = 8;     // px of movement that cancels a tap / promotes to drag

/* hint chip shown while a peeled sticker waits for a tap on the surface */
function PlacingHint({ t, placing, onCancel, style }) {
  return (
    <div className="cp-pop" style={{ background: t.accentSoft, borderRadius: 14, padding: "9px 12px", display: "flex", alignItems: "center", gap: 9, border: `1.5px dashed ${t.accent}`, ...style }}>
      <span className="cp-bob" style={{ display: "inline-block" }}><StickerVisual asset={placing} size={22} /></span>
      <span className="cp-display" style={{ flex: 1, fontSize: 12.5, fontWeight: 600, color: t.ink }}>tap the page to stick it ✨</span>
      <button onClick={onCancel} className="cp-display" style={{ border: "none", background: t.paper, borderRadius: 999, padding: "5px 11px", fontSize: 11.5, fontWeight: 700, color: t.sub, cursor: "pointer" }}>cancel</button>
    </div>
  );
}

/* ═══ ElementLayer — THE shared deco-surface renderer (§D2·D3) ═══
   Renders one surface's PageElements with the full sticker physics:
   tilt, thud/settle, press-hold lift, drag, return zone, action menu,
   and the tap-to-place capture layer. Both deco surfaces (monthly
   spread + day pages) render through this — never fork it.
   Mount INSIDE a position:relative surface container; pass its ref. */
function ElementLayer({ t, surfaceRef, elements, resolveAsset, placing, onPlaceAt, onMove, onReturn, onDuplicate, onRemove, onUpdate = () => {}, editingTextId = null, onEditText = () => {}, stickerSize = 30, radius = 20 }) {
  const [menuFor, setMenuFor] = useState(null); // element id with open action menu
  const [drag, setDrag] = useState(null);       // { id, phase: pressing|lifted|returning, sx, sy, cx, cy, over, flyDx, flyDy }
  const dragRef = useRef(null);                  // mirror of `drag` for synchronous logic (StrictMode-safe)
  const holdTimer = useRef(null);
  const returnRef = useRef(null);                // return zone → hit-test on drop
  const textRef = useRef(null);                  // textarea of the text editor (uncontrolled draft)

  // update ref + state together; `next` may be a value or (prev)=>value
  const putDrag = (next) => {
    const value = typeof next === "function" ? next(dragRef.current) : next;
    dragRef.current = value;
    setDrag(value);
  };
  const clearHold = () => { if (holdTimer.current) { clearTimeout(holdTimer.current); holdTimer.current = null; } };

  const onStickerDown = (e, s) => {
    if (placing) return;                         // don't drag while placing a new sticker
    try { e.currentTarget.setPointerCapture(e.pointerId); } catch { /* capture unsupported */ }
    setMenuFor(null);
    const cx = e.clientX, cy = e.clientY;
    putDrag({ id: s.id, phase: "pressing", sx: cx, sy: cy, cx, cy, over: false });
    clearHold();
    holdTimer.current = setTimeout(() => {
      const d = dragRef.current;
      if (d && d.id === s.id && d.phase === "pressing") putDrag({ ...d, phase: "lifted" });
    }, HOLD_MS);
  };

  const onStickerMove = (e) => {
    const d = dragRef.current;
    if (!d) return;
    const cx = e.clientX, cy = e.clientY;
    if (d.phase === "pressing") {
      if (Math.hypot(cx - d.sx, cy - d.sy) > MOVE_CANCEL) { clearHold(); putDrag({ ...d, phase: "lifted", cx, cy }); } // moved before hold → lift & drag
      else putDrag({ ...d, cx, cy });
    } else if (d.phase === "lifted") {
      const zr = returnRef.current?.getBoundingClientRect();
      const pad = 24;
      const over = !!zr && cx >= zr.left - pad && cx <= zr.right + pad && cy >= zr.top - pad && cy <= zr.bottom + pad;
      putDrag({ ...d, cx, cy, over });
    }
  };

  const onStickerUp = (e, s) => {
    clearHold();
    try { e.currentTarget.releasePointerCapture(e.pointerId); } catch { /* already released */ }
    const d = dragRef.current;
    if (!d || d.id !== s.id) return;
    if (d.phase === "pressing") {                // quick tap → text edits, stickers get the action menu
      if (s.type === "text") onEditText(s.id);
      else setMenuFor(s.id);
      putDrag(null);
      return;
    }
    if (d.phase === "lifted") {
      if (d.over) {                              // dropped on return zone → fly-out then remove
        const zr = returnRef.current?.getBoundingClientRect();
        const flyDx = zr ? zr.left + zr.width / 2 - d.cx : 0;
        const flyDy = zr ? zr.top + zr.height / 2 - d.cy : 0;
        putDrag({ ...d, phase: "returning", flyDx, flyDy });
        setTimeout(() => { onReturn(s.id); putDrag(null); }, 200);
        return;
      }
      const rect = surfaceRef.current?.getBoundingClientRect();
      if (rect) {                                // dropped on the surface → move to new x/y
        const x = ((d.cx - rect.left) / rect.width) * 100;
        const y = ((d.cy - rect.top) / rect.height) * 100;
        if (x >= 0 && x <= 100 && y >= 0 && y <= 100) {
          onMove(s.id, Math.min(95, Math.max(5, x)), Math.min(93, Math.max(7, y)));
        }
      }
      putDrag(null);                             // outside surface & zone → just settle back
    }
  };

  const sorted = [...elements].sort((a, b) => (a.z ?? 0) - (b.z ?? 0));

  return (
    <>
      {/* placed elements — press-hold to lift & drag; tap = menu (sticker) / edit (text) */}
      {sorted.map((s) => {
        let inner = null;
        let label = "";
        if (s.type === "sticker") {
          const asset = resolveAsset(s.assetId);
          if (!asset) return null;               // unknown/removed asset → skip (stays safe on load)
          inner = <StickerVisual asset={asset} size={stickerSize} />;
          label = `placed sticker ${asset.name}`;
        } else if (s.type === "text") {
          if (s.id === editingTextId) return null; // the editor replaces the idle box
          inner = (
            <span style={{
              display: "inline-block", maxWidth: 220, whiteSpace: "pre-wrap", textAlign: "left",
              fontFamily: TEXT_FONTS[s.font]?.stack ?? TEXT_FONTS.hand.stack,
              color: s.color, fontSize: TEXT_SIZES[s.sizeLevel] ?? TEXT_SIZES.M,
              lineHeight: 1.25, fontWeight: 600,
            }}>{s.content}</span>
          );
          label = "placed text note";
        } else {
          return null;                            // future types land here (§D3)
        }
        const d = drag && drag.id === s.id ? drag : null;
        const phase = d ? d.phase : "idle";
        const lifted = phase === "lifted";
        const returning = phase === "returning";
        const floating = lifted || returning;
        const rot = s.rotation + (lifted ? 3 : 0);
        const sc = returning ? 0.2 : lifted ? 1.15 : phase === "pressing" ? 0.96 : (s.scale ?? 1);
        const transform = returning
          ? `translate(-50%,-50%) translate(${d.flyDx}px, ${d.flyDy}px) rotate(${rot}deg) scale(${sc})`
          : `translate(-50%,-50%) rotate(${rot}deg) scale(${sc})`;
        return (
          <button
            key={s.id}
            onPointerDown={(e) => onStickerDown(e, s)}
            onPointerMove={onStickerMove}
            onPointerUp={(e) => onStickerUp(e, s)}
            onPointerCancel={(e) => onStickerUp(e, s)}
            aria-label={label}
            className="cp-drag-settle"
            style={{
              position: floating ? "fixed" : "absolute",
              left: floating ? d.cx : `${s.x}%`,
              top: floating ? d.cy : `${s.y}%`,
              transform,
              opacity: returning ? 0 : 1,
              zIndex: floating ? 80 : 7,
              filter: lifted ? "drop-shadow(0 14px 16px rgba(51,33,26,.32))" : "none",
              lineHeight: 1, padding: 0, border: "none", background: "transparent",
              cursor: "grab", touchAction: "none",
            }}
          >
            <span className="cp-pop" style={{ display: "inline-block", pointerEvents: "none" }}>
              {inner}
            </span>
          </button>
        );
      })}

      {/* action menu for a placed element */}
      {menuFor != null && (() => {
        const s = elements.find((p) => p.id === menuFor);
        if (!s) return null;
        const asset = resolveAsset(s.assetId);
        const below = s.y < 55; // open downward if the element sits high on the surface
        return (
          <>
            <div onClick={() => setMenuFor(null)} style={{ position: "absolute", inset: 0, zIndex: 8 }} />
            <div className="cp-pop" style={{
              position: "absolute", zIndex: 10, width: 176,
              left: `${Math.min(70, Math.max(30, s.x))}%`, top: `${s.y}%`,
              transform: below ? "translate(-50%, 20px)" : "translate(-50%, calc(-100% - 20px))",
              background: t.paper, borderRadius: 14, padding: 6,
              border: `1.5px solid ${t.accentSoft}`, boxShadow: "0 6px 18px rgba(51,33,26,.25)",
            }}>
              <div className="cp-display" style={{ fontSize: 11, fontWeight: 600, color: t.sub, padding: "3px 8px 5px" }}>{asset ? `${asset.content} ${asset.name}` : ""}</div>
              {[
                ["↩", "Return to Stickerbook", onReturn],
                ["⧉", "Duplicate", onDuplicate],
                ["✕", "Remove from page", onRemove],
              ].map(([icon, label, act]) => (
                <button
                  key={label}
                  onClick={() => { act(s.id); setMenuFor(null); }}
                  className="cp-display"
                  style={{
                    display: "flex", alignItems: "center", gap: 7, width: "100%",
                    border: "none", background: "transparent", borderRadius: 10,
                    padding: "7px 8px", cursor: "pointer", fontSize: 12, fontWeight: 600,
                    color: label === "Remove from page" ? t.accent : t.ink, textAlign: "left",
                  }}
                >
                  <span style={{ width: 14, textAlign: "center" }}>{icon}</span> {label}
                </button>
              ))}
            </div>
          </>
        );
      })()}

      {/* text editor: tap a text box → in-place textarea + minimal toolbar (§D6:
          3 fonts × 5 inks × 3 sizes + delete. no bold/italic/alignment/links) */}
      {editingTextId != null && (() => {
        const el = elements.find((p) => p.id === editingTextId && p.type === "text");
        if (!el) return null;
        const below = el.y < 50; // toolbar goes under the box when it sits high
        const commit = () => {
          const v = (textRef.current?.value ?? "").trim();
          if (!v) onRemove(el.id, true);                 // empty on close → removed quietly
          else if (v !== el.content) onUpdate(el.id, { content: v });
          onEditText(null);
        };
        const chip = (active) => ({
          border: active ? `2px solid ${t.accent}` : "2px solid transparent",
          background: t.bg, borderRadius: 9, padding: "3px 7px", cursor: "pointer",
          fontSize: 12, fontWeight: 700, color: t.ink, lineHeight: 1.2,
        });
        return (
          <>
            {/* commit-catcher: clicking anywhere else on the surface closes the editor */}
            <div onClick={commit} style={{ position: "absolute", inset: 0, zIndex: 13 }} />
            <div style={{ position: "absolute", zIndex: 14, left: `${Math.min(72, Math.max(28, el.x))}%`, top: `${el.y}%`, transform: "translate(-50%,-50%)" }}>
              <textarea
                ref={textRef}
                autoFocus
                defaultValue={el.content}
                rows={2}
                aria-label="edit text note"
                onBlur={(e) => { if (e.relatedTarget?.closest?.("[data-text-toolbar]")) return; commit(); }}
                onKeyDown={(e) => { if (e.key === "Escape") { e.preventDefault(); commit(); } }}
                style={{
                  width: 210, resize: "none", outlineOffset: 0,
                  fontFamily: TEXT_FONTS[el.font]?.stack ?? TEXT_FONTS.hand.stack,
                  color: el.color, fontSize: TEXT_SIZES[el.sizeLevel] ?? TEXT_SIZES.M,
                  lineHeight: 1.25, fontWeight: 600,
                  background: "rgba(255,251,242,.94)", border: `1.5px dashed ${t.accent}`,
                  borderRadius: 10, padding: "7px 9px",
                }}
              />
              {/* toolbar: pointerDown is prevented so taps never blur the textarea */}
              <div
                data-text-toolbar
                onPointerDown={(e) => e.preventDefault()}
                className="cp-pop"
                style={{
                  position: "absolute", left: "50%", ...(below ? { top: "100%", marginTop: 6 } : { bottom: "100%", marginBottom: 6 }),
                  transform: "translateX(-50%)",
                  background: t.paper, borderRadius: 12, padding: 6,
                  border: `1.5px solid ${t.accentSoft}`, boxShadow: "0 6px 18px rgba(51,33,26,.25)",
                  display: "flex", flexDirection: "column", gap: 5, width: 196,
                }}
              >
                <div style={{ display: "flex", gap: 4, justifyContent: "center" }}>
                  {Object.entries(TEXT_FONTS).map(([k, f]) => (
                    <button key={k} onClick={() => onUpdate(el.id, { font: k })} aria-label={`font ${f.label}`} style={{ ...chip(el.font === k), fontFamily: f.stack }}>{f.label}</button>
                  ))}
                </div>
                <div style={{ display: "flex", gap: 6, alignItems: "center", justifyContent: "center" }}>
                  {TEXT_COLORS.map((c) => (
                    <button key={c} onClick={() => onUpdate(el.id, { color: c })} aria-label={`ink ${c}`} style={{
                      width: 18, height: 18, borderRadius: "50%", background: c, cursor: "pointer",
                      border: el.color === c ? "2.5px solid #fff" : "2.5px solid transparent",
                      boxShadow: el.color === c ? `0 0 0 2px ${t.accent}` : "0 1px 3px rgba(51,33,26,.25)",
                    }} />
                  ))}
                </div>
                <div style={{ display: "flex", gap: 4, justifyContent: "center", alignItems: "center" }}>
                  {Object.keys(TEXT_SIZES).map((k) => (
                    <button key={k} onClick={() => onUpdate(el.id, { sizeLevel: k })} aria-label={`size ${k}`} style={chip(el.sizeLevel === k)}>{k}</button>
                  ))}
                  <span style={{ width: 1, height: 16, background: t.accentSoft, margin: "0 3px" }} />
                  <button onClick={() => { onRemove(el.id); onEditText(null); }} aria-label="delete text note" style={{ ...chip(false), color: t.accent }}>🗑</button>
                </div>
              </div>
            </div>
          </>
        );
      })()}

      {/* placement capture layer: only while a peeled sticker waits */}
      {placing && (
        <div
          onClick={(e) => {
            const r = e.currentTarget.getBoundingClientRect();
            const x = ((e.clientX - r.left) / r.width) * 100;
            const y = ((e.clientY - r.top) / r.height) * 100;
            onPlaceAt(Math.min(95, Math.max(5, x)), Math.min(93, Math.max(7, y)));
          }}
          aria-label="tap to place sticker"
          style={{ position: "absolute", inset: 0, zIndex: 12, cursor: "copy", borderRadius: radius, border: `2px dashed ${t.accent}`, background: "rgba(255,255,255,.12)" }}
        />
      )}

      {/* peel-back drop target, only while an element is lifted */}
      {drag && (drag.phase === "lifted" || drag.phase === "returning") && (
        <ReturnZone t={t} active={!!drag.over} innerRef={returnRef} />
      )}
    </>
  );
}

function Diary({ t, view, cal, weekCells, monthElements, dayElements, resolveAsset, onOpenBook, onOpenDay, onPrevMonth, onNextMonth, canGoNextMonth, onPrevWeek, onNextWeek, canGoNextWeek, isCurrentMonth, isCurrentWeek, onOpenMonthPicker, onToday, monthTitleRef, placing, onCancelPlacing, onPlaceAt, onMove, onReturn, onDuplicate, onRemove }) {
  const cardRef = useRef(null); // calendar card = the monthly-spread surface

  // month grid: leading blanks (null) up to the 1st's weekday, then its days.
  // `null` cells are alignment placeholders — rendered as neutral empty slots,
  // NEVER date buttons (see below); the week strip uses real dates from props.
  const cells = [];
  for (let i = 0; i < cal.firstWeekdayOffset; i++) cells.push(null);
  for (let d = 1; d <= cal.daysInMonth; d++) cells.push(d);

  const WEEKDAYS = ["LU", "MA", "ME", "GI", "VE", "SA", "DO"];
  // arrows + Oggi follow the active view: months in month view, weeks in week view
  const week = view === "week";
  const showOggi = week ? !isCurrentWeek : !isCurrentMonth;
  // subtitle names the surface. A PAST week has no honest fixed label (it isn't
  // "this week"), so hide it there — Oggi still offers the way back. The empty
  // string keeps the flex:1 spacer, so Oggi stays right-aligned.
  const subtitle = week
    ? (isCurrentWeek ? "this week · tap + to add stickers" : "")
    : "your sticker diary · tap + to add stickers";

  return (
    <div style={{ padding: "0 16px 110px" }}>
      {/* header card: month navigation (prev · title/picker · next) + Oggi */}
      <div style={{ position: "relative", marginTop: 18, background: t.paper, borderRadius: 20, padding: "14px 16px 12px", boxShadow: "0 3px 12px rgba(51,33,26,.09)" }}>
        <Tape t={t} rot={-3} />
        <MonthNavigation
          t={t} cal={cal}
          onPrev={week ? onPrevWeek : onPrevMonth}
          onNext={week ? onNextWeek : onNextMonth}
          canGoNext={week ? canGoNextWeek : canGoNextMonth}
          prevLabel={week ? "Previous week" : "Previous month"}
          nextLabel={week ? "Next week" : "Next month"}
          onOpenPicker={onOpenMonthPicker} titleRef={monthTitleRef}
        />
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, marginTop: 6 }}>
          <span style={{ flex: 1, minWidth: 0, fontSize: 12.5, color: t.sub, fontWeight: 700 }}>
            {subtitle}
          </span>
          {/* Oggi appears only while browsing away from today's month/week, in
              the decorative slot; on today it keeps the little bob book (§6) */}
          {showOggi ? (
            <button onClick={onToday} aria-label={week ? "Torna alla settimana corrente" : "Torna al mese corrente"} className="cp-display" style={{
              border: "none", background: t.accentSoft, color: t.accent, borderRadius: 999,
              padding: "7px 13px", fontSize: 12.5, fontWeight: 700, cursor: "pointer", flexShrink: 0,
            }}>Oggi</button>
          ) : (
            <span className="cp-sticker cp-bob" style={{ fontSize: 26, flexShrink: 0 }}>📖</span>
          )}
        </div>
      </div>

      {/* stickerbook opener */}
      <button onClick={onOpenBook} style={{ position: "relative", width: "100%", marginTop: 12, background: t.paper, border: "none", borderRadius: 16, padding: "11px 14px", display: "flex", alignItems: "center", gap: 11, boxShadow: "0 2px 8px rgba(51,33,26,.08)", cursor: "pointer", textAlign: "left" }}>
        <Tape t={t} rot={3} w={56} />
        <span className="cp-sticker-sm" style={{ fontSize: 24, transform: "rotate(-4deg)" }}>📒</span>
        <span style={{ flex: 1, minWidth: 0 }}>
          <span className="cp-display" style={{ display: "block", fontWeight: 600, fontSize: 14, color: t.ink }}>Stickerbook</span>
          <span style={{ display: "block", fontSize: 11, color: t.sub, fontWeight: 700 }}>
            {monthElements.length > 0 ? `${monthElements.length} stuck on this page · ` : ""}peel a sticker, decorate the page
          </span>
        </span>
        <span className="cp-display" style={{ fontSize: 11.5, fontWeight: 700, color: t.accent, background: t.accentSoft, borderRadius: 999, padding: "5px 11px", flexShrink: 0 }}>Open</span>
      </button>

      {/* placing hint */}
      {placing && <PlacingHint t={t} placing={placing} onCancel={onCancelPlacing} style={{ marginTop: 10 }} />}

      {/* calendar */}
      <div ref={cardRef} style={{ position: "relative", marginTop: 14, background: t.paper, borderRadius: 20, padding: "14px 10px 16px", boxShadow: "0 3px 12px rgba(51,33,26,.09)", backgroundImage: `radial-gradient(${t.accentSoft} 1px, transparent 1px)`, backgroundSize: "14px 14px" }}>
        {view === "month" ? (
          <>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", gap: 2, marginBottom: 6 }}>
              {WEEKDAYS.map((d, i) => (
                <div key={d} className="cp-display" style={{ textAlign: "center", fontSize: 10.5, fontWeight: 600, color: i >= 5 ? t.accent : t.sub }}>{d}</div>
              ))}
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", gap: 2 }}>
              {cells.map((d, i) => {
                // alignment placeholder (leading blank): a neutral empty grid
                // slot — never a date button, so no today/disabled styling can
                // land on it, no date/thumbnail, no click, not focusable. Keeps
                // the cell's footprint so the grid stays aligned.
                if (d == null) return <div key={i} aria-hidden style={{ aspectRatio: "1" }} />;
                const isToday = d === cal.todayDay;
                const future = isFutureLocalDay(cal.year, cal.monthIndex, d, cal.today);
                return (
                  <button
                    key={i}
                    onClick={() => !future && onOpenDay(cal.year, cal.monthIndex, d)}
                    disabled={future}
                    aria-label={`open day ${d}`}
                    style={{
                      aspectRatio: "1", borderRadius: 12, position: "relative", padding: 0,
                      border: "none", background: "transparent", cursor: future ? "default" : "pointer",
                      ...(isToday ? { background: t.accentSoft, boxShadow: `inset 0 0 0 2px ${t.accent}` } : {}),
                    }}
                  >
                    <span style={{
                      position: "absolute", top: 3, left: 5, fontSize: 9.5, fontWeight: 800,
                      color: future ? "rgba(0,0,0,.18)" : isToday ? t.accent : t.sub,
                    }}>{d}</span>
                    {/* read-only day preview: sits in the lower cell, clear of the
                        date number; pointer-events:none keeps the button clickable */}
                    <DayThumbnail
                      elements={dayElements(d)} resolveAsset={resolveAsset}
                      size={18} subColor={t.sub}
                      style={{ position: "absolute", left: 0, right: 0, top: "38%", bottom: 2, overflow: "hidden" }}
                    />
                  </button>
                );
              })}
            </div>
          </>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", gap: 4 }}>
            {weekCells.map((cell, i) => (
              <button
                key={cell.dayKey}
                onClick={() => !cell.isFuture && onOpenDay(cell.year, cell.monthIndex, cell.day)}
                disabled={cell.isFuture}
                aria-label={`open day ${cell.day}`}
                style={{
                  minHeight: 66, borderRadius: 12, position: "relative",
                  display: "flex", flexDirection: "column", alignItems: "center", paddingTop: 7,
                  border: "none", cursor: cell.isFuture ? "default" : "pointer",
                  background: cell.isToday ? t.accentSoft : "transparent",
                  boxShadow: cell.isToday ? `inset 0 0 0 2px ${t.accent}` : "none",
                }}
              >
                <span className="cp-display" style={{ fontSize: 10, fontWeight: 600, color: i >= 5 ? t.accent : t.sub }}>{WEEKDAYS[i]}</span>
                <span style={{ fontSize: 16, fontWeight: 800, marginTop: 5, color: cell.isFuture ? "rgba(0,0,0,.18)" : cell.isToday ? t.accent : t.ink }}>{cell.day}</span>
                {/* each cell uses its OWN real day key (cross-month days included);
                    strip stays navigation-only, same shared thumbnail rule */}
                <DayThumbnail
                  elements={cell.elements} resolveAsset={resolveAsset}
                  size={22} subColor={t.sub}
                  style={{ marginTop: 4, height: 26 }}
                />
              </button>
            ))}
          </div>
        )}

        {/* monthly spread = deco surface (a) — same shared layer as day pages */}
        <ElementLayer
          t={t} surfaceRef={cardRef} elements={monthElements} resolveAsset={resolveAsset}
          placing={placing} onPlaceAt={onPlaceAt} onMove={onMove}
          onReturn={onReturn} onDuplicate={onDuplicate} onRemove={onRemove}
        />
      </div>
    </div>
  );
}

/* ═══════════════ 2 · DAY PAGE (풀스크린 · 3:4, §D1) ═══════════════ */

const PAGE_TURN_MS = 480; // matches .cp-pageturn-* durations (+ small buffer)

function DayPage({ t, cal, day, elements, resolveAsset, placing, onCancelPlacing, onPlaceAt, onMove, onReturn, onDuplicate, onRemove, onUpdate, editingTextId, onEditText, onAddText, canUndo, onUndo, canRedo, onRedo, onOpenBook, onClose }) {
  const [phase, setPhase] = useState("opening"); // opening → open → closing
  const canvasRef = useRef(null);

  // after the page-turn finishes, drop the animation class so no ancestor
  // transform lingers (position:fixed children — lifted stickers, return
  // zone — must anchor to the viewport, not the turned page)
  const handleTurnEnd = (e) => { if (e.target === e.currentTarget && phase === "opening") setPhase("open"); };
  // belt-and-braces: hidden tabs / forced-off animations never fire
  // animationend, so a timer also advances the phase (§D14: motion may
  // simplify or skip, function never breaks)
  useEffect(() => {
    if (phase !== "opening") return;
    const id = setTimeout(() => setPhase((p) => (p === "opening" ? "open" : p)), PAGE_TURN_MS + 60);
    return () => clearTimeout(id);
  }, [phase]);

  const requestClose = () => {
    if (phase === "closing") return;
    if (placing) onCancelPlacing();  // leaving the page cancels a pending placement
    setPhase("closing");
    setTimeout(onClose, PAGE_TURN_MS - 100);
  };

  const turnClass = phase === "opening" ? "cp-pageturn-in" : phase === "closing" ? "cp-pageturn-out" : "";
  const shadeClass = phase === "opening" ? "cp-pageshade-in" : phase === "closing" ? "cp-pageshade-out" : "";

  return (
    <div style={{ position: "absolute", inset: 0, zIndex: 38, background: "rgba(51,33,26,.25)" }}>
      {/* the turning page (3D rotate from the left spine + traveling shadow) */}
      <div className={turnClass} onAnimationEnd={handleTurnEnd} style={{ position: "absolute", inset: 0, background: t.bg, display: "flex", flexDirection: "column" }}>

        {/* date header + undo/redo */}
        <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "12px 16px 8px" }}>
          <button onClick={requestClose} aria-label="close day page" style={{ border: "none", background: t.paper, borderRadius: 12, width: 34, height: 34, cursor: "pointer", color: t.ink, boxShadow: "0 2px 6px rgba(51,33,26,.1)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <X size={17} />
          </button>
          <div style={{ flex: 1 }}>
            <div className="cp-display" style={{ fontSize: 19, fontWeight: 700, color: t.ink, lineHeight: 1.1 }}>{day} {cal.monthName}</div>
            <div style={{ fontSize: 10.5, color: t.sub, fontWeight: 700 }}>{cal.monthYearCap} · day page</div>
          </div>
          {[
            ["undo", Undo2, canUndo, onUndo],
            ["redo", Redo2, canRedo, onRedo],
          ].map(([label, Icon, can, act]) => (
            <button key={label} onClick={act} disabled={!can} aria-label={label} style={{
              border: "none", background: t.paper, borderRadius: 12, width: 34, height: 34,
              cursor: can ? "pointer" : "default", color: can ? t.ink : "rgba(0,0,0,.22)",
              boxShadow: can ? "0 2px 6px rgba(51,33,26,.1)" : "none",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <Icon size={16} />
            </button>
          ))}
        </div>

        {/* 3:4 canvas, centered/letterboxed (§D1) */}
        <div style={{ flex: 1, minHeight: 0, display: "flex", alignItems: "center", justifyContent: "center", padding: "4px 18px" }}>
          <div
            ref={canvasRef}
            style={{
              aspectRatio: "3 / 4",
              width: "min(100%, calc((100vh - 170px) * 0.75))",
              position: "relative",
              background: t.paper, borderRadius: 18,
              backgroundImage: `radial-gradient(${t.accentSoft} 1px, transparent 1px)`,
              backgroundSize: "14px 14px",
              boxShadow: "0 10px 30px rgba(51,33,26,.18), 0 2px 8px rgba(51,33,26,.1)",
            }}
          >
            {elements.length === 0 && !placing && (
              <div className="cp-display" style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 6, color: t.sub, fontWeight: 600, fontSize: 13, pointerEvents: "none" }}>
                <span style={{ fontSize: 30 }}>🫧</span>
                an empty page… stick something cute
              </div>
            )}
            {/* day page = deco surface (b) — same shared layer as the monthly spread */}
            <ElementLayer
              t={t} surfaceRef={canvasRef} elements={elements} resolveAsset={resolveAsset}
              placing={placing} onPlaceAt={onPlaceAt} onMove={onMove}
              onReturn={onReturn} onDuplicate={onDuplicate} onRemove={onRemove}
              onUpdate={onUpdate} editingTextId={editingTextId} onEditText={onEditText}
              stickerSize={40} radius={18}
            />
          </div>
        </div>

        {/* footer: sticker + text affordances targeting THIS page */}
        <div style={{ padding: "8px 18px 18px", display: "flex", flexDirection: "column", gap: 8 }}>
          {placing && <PlacingHint t={t} placing={placing} onCancel={onCancelPlacing} />}
          <div style={{ display: "flex", gap: 8 }}>
            <button onClick={onOpenBook} className="cp-display" style={{
              flex: 1.6, border: "none", borderRadius: 999, padding: "12px 0",
              background: t.accent, color: "#fff", fontSize: 14, fontWeight: 700, cursor: "pointer",
              boxShadow: "0 5px 14px rgba(200,51,27,.3)", display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
            }}>
              📒 Add stickers
            </button>
            <button onClick={onAddText} aria-label="add text note" className="cp-display" style={{
              flex: 1, border: `2px dashed ${t.accent}`, borderRadius: 999, padding: "10px 0",
              background: t.paper, color: t.accent, fontSize: 14, fontWeight: 700, cursor: "pointer",
              display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
            }}>
              ✏️ Text
            </button>
          </div>
        </div>

        {/* traveling shadow while the page turns */}
        {shadeClass && (
          <div aria-hidden className={shadeClass} style={{ position: "absolute", inset: 0, pointerEvents: "none", background: "linear-gradient(105deg, rgba(51,33,26,.5), rgba(51,33,26,0) 55%)" }} />
        )}
      </div>
    </div>
  );
}

/* ═══════════════ 3 · BOOKSHELF (책장) ═══════════════ */

/* Minimal shelf: one book cover for the current diary.
   The multiple-diaries PR will expand this. (Sharing/visibility returns with
   the backend layer — no visibility toggle in the local-first app.) */
function Bookshelf({ t, cal }) {
  return (
    <div style={{ padding: "0 16px 110px" }}>
      <div className="cp-display" style={{ margin: "18px 4px 12px", fontSize: 16, fontWeight: 700, color: t.ink }}>My bookshelf <span style={{ fontSize: 13, color: t.sub }}>책장</span></div>

      {/* one diary "book" on the shelf */}
      <div style={{ display: "flex", gap: 16, alignItems: "flex-end" }}>
        <div style={{
          width: 148, height: 196, flexShrink: 0,
          borderRadius: "5px 14px 14px 5px",
          background: `linear-gradient(150deg, ${t.accent}, #9c2814)`,
          boxShadow: "0 10px 22px rgba(51,33,26,.28)",
          position: "relative", overflow: "hidden", color: "#fff",
          padding: "18px 16px 16px 22px", display: "flex", flexDirection: "column", justifyContent: "space-between",
        }}>
          <div style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: 9, background: "rgba(0,0,0,.2)" }} />
          <div style={{ position: "absolute", inset: 9, left: 15, border: "1.5px solid rgba(255,255,255,.35)", borderRadius: 10, pointerEvents: "none" }} />
          <div className="cp-display" style={{ fontSize: 10, letterSpacing: 2, opacity: 0.85, fontWeight: 600 }}>MOMENTI</div>
          <div>
            <span className="cp-sticker" style={{ fontSize: 32 }}>📖</span>
            <div className="cp-display" style={{ fontSize: 19, fontWeight: 700, marginTop: 6 }}>My diary</div>
            <div style={{ fontSize: 11, opacity: 0.8, fontWeight: 700 }}>{cal.monthYearCap}</div>
          </div>
        </div>
        <div style={{ flex: 1 }}>
          <div className="cp-display" style={{ fontSize: 14, fontWeight: 700, color: t.ink }}>Current diary</div>
          <div style={{ fontSize: 11.5, color: t.sub, fontWeight: 700, marginTop: 3 }}>더 많은 다이어리는 곧 · more diaries coming soon</div>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════ STICKERBOOK OVERLAY (mock tray · pages) ═══════════════ */

function StickerbookSheet({ t, page, setPage, onPick, onClose, userAssets, onCreate }) {
  const [creatorOpen, setCreatorOpen] = useState(false);
  const pages = Math.ceil(STICKER_ASSETS.length / BOOK_PAGE_SIZE);
  const items = STICKER_ASSETS.slice(page * BOOK_PAGE_SIZE, page * BOOK_PAGE_SIZE + BOOK_PAGE_SIZE);
  const used = userAssets.length;
  const full = used >= FREE_ASSET_LIMIT;
  const pageBtn = (disabled) => ({
    border: "none", borderRadius: 999, width: 34, height: 34, fontSize: 17, fontWeight: 700,
    cursor: disabled ? "default" : "pointer",
    background: disabled ? "transparent" : t.paper,
    color: disabled ? "rgba(0,0,0,.2)" : t.ink,
    boxShadow: disabled ? "none" : "0 2px 6px rgba(51,33,26,.1)",
  });
  const tileBg = (tex) => tex === "glitter"
    ? "radial-gradient(circle at 30% 22%, #fff 0, rgba(255,255,255,0) 42%), linear-gradient(135deg, #FBE9F0, #E4ECD2)"
    : t.paper;
  const tile = (bg) => ({
    border: "none", background: bg, borderRadius: 16, padding: "12px 4px 9px",
    cursor: "pointer", boxShadow: "0 2px 8px rgba(51,33,26,.08)",
  });
  const label = (a) => (
    <span className="cp-display" style={{ display: "block", fontSize: 10, fontWeight: 600, color: t.ink, marginTop: 5, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{a.name}</span>
  );
  return (
    <>
      <div onClick={onClose} style={{ position: "absolute", inset: 0, background: "rgba(51,33,26,.35)", zIndex: 45, display: "flex", alignItems: "flex-end" }}>
        <div onClick={(e) => e.stopPropagation()} className="cp-fadeup" style={{ width: "100%", background: t.bg, borderRadius: "24px 24px 0 0", padding: "10px 18px 22px", maxHeight: "78%", overflowY: "auto", position: "relative" }}>
          <div style={{ width: 40, height: 5, background: t.accentSoft, borderRadius: 3, margin: "4px auto 12px" }} />
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div className="cp-display" style={{ fontSize: 19, fontWeight: 700, color: t.ink }}>Stickerbook 📒</div>
            <button onClick={onClose} aria-label="close stickerbook" style={{ border: "none", background: t.accentSoft, borderRadius: 10, width: 26, height: 26, cursor: "pointer", color: t.ink }}><X size={14} /></button>
          </div>
          <div style={{ fontSize: 11.5, color: t.sub, fontWeight: 700, marginBottom: 12 }}>tap a sticker to peel it, then stick it on this page</div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 10 }}>
            {items.map((a, i) => (
              <button key={a.id} onClick={() => onPick(a)} style={tile(t.paper)}>
                <span style={{ display: "inline-block", transform: `rotate(${tiltFor(i + page * BOOK_PAGE_SIZE)}deg)` }}><StickerVisual asset={a} size={28} /></span>
                {label(a)}
              </button>
            ))}
          </div>

          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 14, marginTop: 14 }}>
            <button onClick={() => setPage(page - 1)} disabled={page === 0} aria-label="previous page" className="cp-display" style={pageBtn(page === 0)}>‹</button>
            <span className="cp-display" style={{ fontSize: 12.5, fontWeight: 600, color: t.sub }}>Page {page + 1} / {pages}</span>
            <button onClick={() => setPage(page + 1)} disabled={page >= pages - 1} aria-label="next page" className="cp-display" style={pageBtn(page >= pages - 1)}>›</button>
          </div>

          {/* My stickers — user-created assets + create affordance */}
          <div style={{ marginTop: 18, paddingTop: 14, borderTop: `1.5px dashed ${t.accentSoft}`, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <span className="cp-display" style={{ fontSize: 14, fontWeight: 700, color: t.ink }}>My stickers ✏️</span>
            <span className="cp-display" style={{ fontSize: 11.5, fontWeight: 700, color: full ? t.accent : t.sub }}>{used}/{FREE_ASSET_LIMIT}</span>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 10, marginTop: 10 }}>
            {userAssets.map((a, i) => (
              <button key={a.id} onClick={() => onPick(a)} style={tile(tileBg(a.texture))}>
                <span style={{ display: "inline-block", transform: `rotate(${tiltFor(i + 2)}deg)` }}><StickerVisual asset={a} size={28} /></span>
                {label(a)}
              </button>
            ))}
            <button
              onClick={() => !full && setCreatorOpen(true)}
              disabled={full}
              aria-label="make a sticker"
              className="cp-display"
              style={{
                border: `2px dashed ${full ? "rgba(0,0,0,.18)" : t.accent}`, background: "transparent",
                borderRadius: 16, padding: "12px 4px 9px", cursor: full ? "default" : "pointer",
                color: full ? "rgba(0,0,0,.28)" : t.accent,
              }}
            >
              <span style={{ fontSize: 24, display: "block", lineHeight: 1 }}>＋</span>
              <span style={{ display: "block", fontSize: 10, fontWeight: 700, marginTop: 6 }}>{full ? "Full" : "Make"}</span>
            </button>
          </div>

          {full && (
            <div className="cp-display" style={{ marginTop: 10, fontSize: 11.5, fontWeight: 700, color: t.accent, textAlign: "center" }}>
              Your stickerbook is full — {FREE_ASSET_LIMIT}/{FREE_ASSET_LIMIT}
            </div>
          )}
        </div>
      </div>

      {creatorOpen && (
        <StickerCreatorSheet t={t} onClose={() => setCreatorOpen(false)} onCreate={(draft) => { onCreate(draft); setCreatorOpen(false); }} />
      )}
    </>
  );
}

/* minimal mock sticker creator — emoji content only, no image upload */
function StickerCreatorSheet({ t, onClose, onCreate }) {
  const [content, setContent] = useState(null);
  const [texture, setTexture] = useState("paper");
  const [name, setName] = useState("");
  const previewBg = texture === "glitter"
    ? "radial-gradient(circle at 32% 24%, #fff 0, rgba(255,255,255,0) 46%), linear-gradient(135deg, #FBE9F0, #E4ECD2)"
    : t.paper;
  return (
    <div onClick={onClose} style={{ position: "absolute", inset: 0, background: "rgba(51,33,26,.4)", zIndex: 55, display: "flex", alignItems: "flex-end" }}>
      <div onClick={(e) => e.stopPropagation()} className="cp-fadeup" style={{ width: "100%", background: t.bg, borderRadius: "24px 24px 0 0", padding: "10px 18px 24px", maxHeight: "82%", overflowY: "auto" }}>
        <div style={{ width: 40, height: 5, background: t.accentSoft, borderRadius: 3, margin: "4px auto 12px" }} />
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
          <div className="cp-display" style={{ fontSize: 18, fontWeight: 700, color: t.ink }}>Make a sticker ✨</div>
          <button onClick={onClose} aria-label="close creator" style={{ border: "none", background: t.accentSoft, borderRadius: 10, width: 26, height: 26, cursor: "pointer", color: t.ink }}><X size={14} /></button>
        </div>

        <div style={{ display: "flex", justifyContent: "center", marginBottom: 12 }}>
          <div style={{ width: 92, height: 92, borderRadius: 20, background: previewBg, boxShadow: "0 2px 10px rgba(51,33,26,.12)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            {content
              ? <StickerVisual asset={{ content, texture }} size={50} />
              : <span style={{ fontSize: 50, opacity: 0.3 }}>🙂</span>}
          </div>
        </div>

        <div className="cp-display" style={{ fontSize: 12.5, fontWeight: 600, color: t.sub, margin: "2px 2px 6px" }}>Pick an emoji</div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(5,1fr)", gap: 8 }}>
          {CREATOR_EMOJI.map((e) => (
            <button key={e} onClick={() => setContent(e)} aria-label={`emoji ${e}`} style={{
              fontSize: 24, padding: "8px 0", borderRadius: 12, cursor: "pointer",
              border: content === e ? `2.5px solid ${t.accent}` : "2.5px solid transparent",
              background: t.paper, boxShadow: "0 2px 6px rgba(51,33,26,.08)",
            }}>{e}</button>
          ))}
        </div>

        <div className="cp-display" style={{ fontSize: 12.5, fontWeight: 600, color: t.sub, margin: "14px 2px 6px" }}>Texture</div>
        <div style={{ display: "flex", gap: 8 }}>
          {["paper", "glitter"].map((tex) => (
            <button key={tex} onClick={() => setTexture(tex)} className="cp-display" style={{
              flex: 1, padding: "10px 0", borderRadius: 12, cursor: "pointer", fontSize: 13, fontWeight: 700,
              border: texture === tex ? `2.5px solid ${t.accent}` : "2.5px solid transparent",
              background: tex === "glitter" ? "linear-gradient(135deg, #FBE9F0, #E4ECD2)" : t.paper,
              color: t.ink, boxShadow: "0 2px 6px rgba(51,33,26,.08)",
            }}>{tex === "glitter" ? "✨ glitter" : "📄 paper"}</button>
          ))}
        </div>

        <div className="cp-display" style={{ fontSize: 12.5, fontWeight: 600, color: t.sub, margin: "14px 2px 6px" }}>Name <span style={{ fontWeight: 500 }}>(optional)</span></div>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          maxLength={24}
          placeholder="something cute…"
          className="cp-display"
          style={{ width: "100%", boxSizing: "border-box", border: `1.5px solid ${t.accentSoft}`, borderRadius: 12, padding: "10px 12px", fontSize: 13, fontWeight: 600, color: t.ink, background: t.paper }}
        />

        <button
          onClick={() => content && onCreate({ content, texture, name })}
          disabled={!content}
          className="cp-display"
          style={{
            width: "100%", marginTop: 16, padding: "14px 0", borderRadius: 16, border: "none",
            background: content ? t.accent : t.accentSoft, color: content ? "#fff" : t.sub,
            fontSize: 15, fontWeight: 700, cursor: content ? "pointer" : "default",
            boxShadow: content ? "0 5px 14px rgba(200,51,27,.3)" : "none",
          }}
        >Add to Stickerbook</button>
      </div>
    </div>
  );
}

/* ═══════════════ localStorage persistence (v3, §D4) ═══════════════ */
// One versioned JSON blob under a single key.
//   v3: { version: 3, diaries: [{id,name}], activeDiaryId,
//         pages: { [diaryId]: { [pageKey]: { elements: PageElement[] } } },
//         userAssets, beans, ownedPacks }
//   pageKey: "YYYY-MM" = monthly spread · "YYYY-MM-DD" = day page (local month).
// Ephemeral state (modals/sheets, active tab, toasts) is never persisted.
const STORAGE_KEY = "momenti.v1";

// v1 → v2: legacy placements ({ id, assetId, emoji, name, x, y, rot })
// become StickerInstances referencing assets by id.
function migrateV1toV2(v1) {
  const pageStickers = Array.isArray(v1.pageStickers)
    ? v1.pageStickers.map((p) => createStickerInstance({
        id: p.id,
        assetId: p.assetId,
        x: p.x, y: p.y,
        rotation: p.rot,               // v1 used `rot`
        scale: 1,
        placedAt: p.placedAt ?? Date.now(),
        page: LEGACY_MONTH_KEY,        // legacy data stays on its historical 2026-07 spread
      }))
    : [];
  return { version: 2, entries: v1.entries, beans: v1.beans, ownedPacks: v1.ownedPacks, pageStickers, userAssets: [] };
}

// v2 → v3: flat monthly StickerInstances become sticker PageElements under
// the legacy monthly-spread pageKey (2026-07 — where they were placed before
// local dates); diaries[]/activeDiaryId/pages structure lands. Unused legacy
// fields (entries) are dropped. Migration never rewrites keys to the current month.
function migrateV2toV3(v2) {
  const elements = Array.isArray(v2.pageStickers)
    ? v2.pageStickers.map((s, i) => createPageElement({
        id: `el-${s.id}`,
        type: "sticker",
        assetId: s.assetId,
        x: s.x, y: s.y,
        rotation: s.rotation ?? 0,
        scale: s.scale ?? 1,
        z: i,                          // z = array order
      }))
    : [];
  return {
    version: 3,
    diaries: [{ id: DIARY_ID, name: "My diary" }],
    activeDiaryId: DIARY_ID,
    pages: elements.length ? { [DIARY_ID]: { [LEGACY_MONTH_KEY]: { elements } } } : { [DIARY_ID]: {} },
    userAssets: v2.userAssets ?? [],
    beans: v2.beans ?? 12,
    ownedPacks: v2.ownedPacks ?? [],
  };
}

function loadPersisted() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const data = JSON.parse(raw);
    if (!data) return null;
    if (data.version === 3) return data;
    if (data.version === 2) return migrateV2toV3(data);               // one hop
    if (data.version === 1) return migrateV2toV3(migrateV1toV2(data)); // chained v1→v2→v3
    return null;                                                       // unknown version → seed defaults
  } catch {
    return null; // missing / corrupt / storage unavailable → seed defaults
  }
}

/* ═══════════════ APP SHELL ═══════════════ */

export default function Momenti() {
  const [saved] = useState(loadPersisted); // parsed once on mount; null if absent/corrupt
  const [tab, setTab] = useState("diario");
  const [calendarView, setCalendarView] = useState("month"); // month | week
  const [openDay, setOpenDay] = useState(null); // day number with the full-screen day page open
  const [toast, setToast] = useState(null);

  /* which month the diary is showing (navigation only — NOT persisted; a
     refresh always starts on the real current month, CAL). `visibleMonth` is
     year + 0-based monthIndex; everything the calendar renders is derived from
     it via createMonthContext. Never a future month (guarded on change). */
  const [visibleMonth, setVisibleMonth] = useState(() => ({ year: CAL.year, monthIndex: CAL.monthIndex }));
  /* the reference LOCAL DATE the week strip is built around — a full descriptor
     { year, monthIndex, day }, not just a day-of-month, so week paging can add
     ±7 days across month/year boundaries. Starts on today; carried (clamped)
     across a month switch or set to an opened/navigated day. Never persisted. */
  const [weekAnchor, setWeekAnchor] = useState(() => ({ year: CAL.year, monthIndex: CAL.monthIndex, day: CAL.todayDay }));
  /* the intended day-of-month to preserve while paging BETWEEN months — kept
     apart from the *displayed* weekAnchor.day (which is clamped to the target
     month's length and to today). Month clamping must never shrink the
     intention, so a 31 → Feb → Aug round-trip returns to 31. Updated only on
     explicit date choices (open a day, page weeks, Oggi, initial today); month
     moves READ it but never write it. A ref: it feeds calc, never renders. */
  const preferredAnchorDayRef = useRef(CAL.todayDay);
  const [monthPickerOpen, setMonthPickerOpen] = useState(false);
  const monthTitleRef = useRef(null); // focus returns here when the picker closes
  // Beans / packs stay in state + persistence (UI dormant); no setters — nothing mutates them.
  const [beans] = useState(saved?.beans ?? 12);
  const [ownedPacks] = useState(saved?.ownedPacks ?? []);

  /* v3 structure (§D4): diaries[] + pages keyed by (diaryId, pageKey).
     UI stays single-diary until the multiple-diaries PR — always activeDiaryId. */
  const [diaries] = useState(saved?.diaries ?? [{ id: DIARY_ID, name: "My diary" }]);
  const [activeDiaryId] = useState(saved?.activeDiaryId ?? DIARY_ID);
  const [pages, setPages] = useState(saved?.pages ?? { [DIARY_ID]: {} });

  /* stickerbook overlay — assets live in STICKER_ASSETS + userAssets */
  const [bookOpen, setBookOpen] = useState(false);
  const [bookPage, setBookPage] = useState(0);
  const [placingSticker, setPlacingSticker] = useState(null); // peeled asset waiting for a tap on the active surface
  const [userAssets, setUserAssets] = useState(saved?.userAssets ?? []); // user-made StickerAssets (source:"user")
  const [editingTextId, setEditingTextId] = useState(null); // text element in edit mode (day pages only)

  /* undo/redo — snapshot stacks of the OPEN day page's elements (§D15).
     Session-scoped: cleared when the page opens/closes. Refs are the source
     of truth (no side effects inside state updaters → StrictMode-safe);
     histVer only re-renders the buttons' disabled state. */
  const undoRef = useRef([]);
  const redoRef = useRef([]);
  const [, setHistVer] = useState(0);
  const bumpHist = () => setHistVer((v) => v + 1);

  const t = THEME;

  /* calendar frame for the VISIBLE month — derived every render, never stored
     (§4). The monthly spread, day cells, and day thumbnails all read this; CAL
     stays the fixed "real today" reference for future-day/month checks. */
  const viewCal = createMonthContext(visibleMonth.year, visibleMonth.monthIndex, CAL.today);
  /* day-page key for a day-of-month IN THE VISIBLE MONTH ("YYYY-MM-DD"). */
  const dayKeyFor = (d) => dayKeyOf(visibleMonth.year, visibleMonth.monthIndex, d);
  /* Next-month is enabled only while the visible month is before the real one. */
  const canGoNextMonth = compareYearMonth(visibleMonth, CAL.today) < 0;
  /* week strip: real Mon→Sun dates around the anchor. Each cell carries its OWN
     day key (cross-month days use their real month, never the visible month) so
     the strip pages weeks freely without ever building a wrong key. */
  const isCurrentWeek = isSameLocalWeek(weekAnchor, CAL.today);
  const canGoNextWeek = !isCurrentWeek; // never page past the week containing today

  /* resolve a placed element's design — base seed assets + user-made ones */
  const resolveAsset = (id) => ASSET_BY_ID[id] ?? userAssets.find((a) => a.id === id);

  /* ── surface helpers: every deco surface is a pageKey under the active diary ── */
  const elementsOf = (pageKey) => pages[activeDiaryId]?.[pageKey]?.elements ?? [];
  const setElements = (pageKey, updater) => {
    setPages((prev) => {
      const diary = prev[activeDiaryId] ?? {};
      const cur = diary[pageKey]?.elements ?? [];
      const next = typeof updater === "function" ? updater(cur) : updater;
      return { ...prev, [activeDiaryId]: { ...diary, [pageKey]: { elements: next } } };
    });
  };
  /* the surface the Stickerbook overlay targets: open day page, else monthly spread */
  const activeSurfaceKey = openDay != null ? dayKeyFor(openDay) : viewCal.monthKey;

  /* week strip descriptors — 7 real Mon→Sun dates around the anchor, each with
     its OWN "YYYY-MM-DD" key + today/future flags + live elements. Cross-month
     days keep their real month, so opening/preview never mixes months (§4·5). */
  const weekCells = getLocalWeekDays(weekAnchor).map((c) => {
    const dayKey = dayKeyOf(c.year, c.monthIndex, c.day);
    return {
      ...c,
      dayKey,
      isToday: c.year === CAL.today.year && c.monthIndex === CAL.today.monthIndex && c.day === CAL.today.day,
      isFuture: isFutureLocalDay(c.year, c.monthIndex, c.day, CAL.today),
      elements: elementsOf(dayKey),
    };
  });

  /* persist durable state on change (single versioned blob, v3) */
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ version: 3, diaries, activeDiaryId, pages, userAssets, beans, ownedPacks }));
    } catch {
      // ignore write failures (quota exceeded / private mode)
    }
  }, [diaries, activeDiaryId, pages, userAssets, beans, ownedPacks]);

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(null), 2400); };

  /* ── stickerbook actions (surface-keyed) ── */
  const pickFromBook = (asset) => {
    setBookOpen(false);
    setPlacingSticker(asset);
    showToast(`${asset.content} peeled! tap the page to stick it`);
  };
  const placeElement = (pageKey, x, y) => {
    if (!placingSticker) return;
    setElements(pageKey, (els) => [...els, createPageElement({
      type: "sticker", assetId: placingSticker.id,
      x, y, rotation: randomTilt(), scale: 1,
      z: els.reduce((m, e) => Math.max(m, e.z ?? 0), 0) + 1,
    })]);
    showToast(`${placingSticker.content} stuck! ✨`);
    setPlacingSticker(null);
  };
  /* removes only the placed element — sticker assets stay in the Stickerbook;
     dropping a text box on the return zone simply deletes it */
  const returnElement = (pageKey, id) => {
    const s = elementsOf(pageKey).find((p) => p.id === id);
    setElements(pageKey, (els) => els.filter((p) => p.id !== id));
    if (s?.type === "text") {
      showToast("✏️ note peeled away");
    } else {
      const asset = s && resolveAsset(s.assetId);
      showToast(`${asset ? asset.content + " " : ""}back in the Stickerbook ↩`);
    }
  };
  const duplicateElement = (pageKey, id) => {
    setElements(pageKey, (els) => {
      const s = els.find((p) => p.id === id);
      if (!s) return els;
      return [...els, createPageElement({
        ...s, id: undefined,
        x: Math.min(93, s.x + 7), y: Math.min(91, s.y + 7),
        rotation: randomTilt(),
        z: els.reduce((m, e) => Math.max(m, e.z ?? 0), 0) + 1,
      })];
    });
    showToast("⧉ stuck a copy!");
  };
  const removeElement = (pageKey, id, quiet = false) => {
    setElements(pageKey, (els) => els.filter((p) => p.id !== id));
    if (!quiet) showToast("peeled off the page");
  };
  /* peel-back drag: update a placed element's position (percent coords) */
  const moveElement = (pageKey, id, x, y) => {
    setElements(pageKey, (els) => els.map((p) => (p.id === id ? { ...p, x, y } : p)));
  };
  /* patch any element (text content/font/color/size — one model, §D3) */
  const updateElement = (pageKey, id, patch) => {
    setElements(pageKey, (els) => els.map((p) => (p.id === id ? { ...p, ...patch } : p)));
  };
  /* new text box near center, slight tilt for the handwritten feel (§D14) */
  const createTextElement = (pageKey) => {
    const el = createPageElement({
      type: "text", content: "", font: "hand", color: TEXT_COLORS[0], sizeLevel: "M",
      x: 50 + (Math.random() * 10 - 5), y: 42 + (Math.random() * 10 - 5),
      rotation: Math.random() * 5 - 2.5, scale: 1,
      z: elementsOf(pageKey).reduce((m, e) => Math.max(m, e.z ?? 0), 0) + 1,
    });
    setElements(pageKey, (els) => [...els, el]);
    setEditingTextId(el.id); // straight into edit mode
  };

  /* ── undo/redo for the open day page (§D15) — snapshot stacks, cap 50 ── */
  const pushDayUndo = (pageKey) => {
    undoRef.current = [...undoRef.current.slice(-(UNDO_CAP - 1)), elementsOf(pageKey)];
    redoRef.current = [];
    bumpHist();
  };
  const undoDay = () => {
    if (openDay == null || !undoRef.current.length) return;
    const key = dayKeyFor(openDay);
    const snapshot = undoRef.current[undoRef.current.length - 1];
    undoRef.current = undoRef.current.slice(0, -1);
    redoRef.current = [...redoRef.current, elementsOf(key)];
    setEditingTextId(null);
    setElements(key, snapshot);
    bumpHist();
  };
  const redoDay = () => {
    if (openDay == null || !redoRef.current.length) return;
    const key = dayKeyFor(openDay);
    const snapshot = redoRef.current[redoRef.current.length - 1];
    redoRef.current = redoRef.current.slice(0, -1);
    undoRef.current = [...undoRef.current.slice(-(UNDO_CAP - 1)), elementsOf(key)];
    setEditingTextId(null);
    setElements(key, snapshot);
    bumpHist();
  };
  const clearDayHistory = () => { undoRef.current = []; redoRef.current = []; bumpHist(); };

  /* bind the shared handlers to one surface for an ElementLayer */
  const surfaceHandlers = (pageKey, { undoable = false } = {}) => {
    const withUndo = (fn) => (...args) => { if (undoable) pushDayUndo(pageKey); fn(...args); };
    return {
      placing: placingSticker,
      onCancelPlacing: () => setPlacingSticker(null),
      onPlaceAt: withUndo((x, y) => placeElement(pageKey, x, y)),
      onMove: withUndo((id, x, y) => moveElement(pageKey, id, x, y)),
      onReturn: withUndo((id) => returnElement(pageKey, id)),
      onDuplicate: withUndo((id) => duplicateElement(pageKey, id)),
      // quiet removals (empty text boxes cleaned on blur) skip toast AND undo
      onRemove: (id, quiet = false) => { if (undoable && !quiet) pushDayUndo(pageKey); removeElement(pageKey, id, quiet); },
      onUpdate: withUndo((id, patch) => updateElement(pageKey, id, patch)),
    };
  };
  /* every week-anchor write funnels through here so the anchor can NEVER point
     past the real current day (§ future-week fix): a would-be future descriptor
     collapses to today. The invariant `weekAnchor <= CAL.today` is enforced at
     the set boundary, not by disabling buttons — so no month/week/day path can
     leave a future anchor behind for week view to page into.

     Two roles are kept distinct (§ permanent-shrink fix):
      • commitExplicitWeekAnchor — the user picked a real date (open a day, page
        a week, Oggi): show it (clamped to today) AND record its day as the new
        preferred day. Returns the clamped descriptor so callers can sync
        visibleMonth to the month it landed in.
      • moveToMonthUsingPreferredDay — a month move (arrows / picker): derive the
        DISPLAYED day from the preferred day → clamp to the target month's length
        → clamp to today, then set the anchor. Never writes the preferred day, so
        a short month never shrinks the intention permanently. */
  const commitExplicitWeekAnchor = (descriptor) => {
    const clamped = clampDescriptorToToday(descriptor, CAL.today);
    preferredAnchorDayRef.current = clamped.day; // this day IS the new intention
    setWeekAnchor(clamped);
    return clamped;
  };
  const moveToMonthUsingPreferredDay = (year, monthIndex) => {
    const day = clampDayToMonth(year, monthIndex, preferredAnchorDayRef.current);
    setWeekAnchor(clampDescriptorToToday({ year, monthIndex, day }, CAL.today));
    setVisibleMonth({ year, monthIndex });
  };

  /* day page open/close resets the session-scoped history + edit mode. Opens by
     a FULL date (a week cell may be in a month adjacent to the visible one), so
     it also syncs visibleMonth + anchors the week strip to that day — switching
     to week view (or closing back) keeps that day's week in view (§11). Opens are
     already future-guarded in the UI, so the anchor clamp is a structural no-op here. */
  const openDayPage = (year, monthIndex, day) => {
    clearDayHistory();
    setEditingTextId(null);
    commitExplicitWeekAnchor({ year, monthIndex, day }); // opening a day makes it the intention
    setVisibleMonth({ year, monthIndex }); // keep the open day's month in the header/spread
    setOpenDay(day);
  };
  const closeDayPage = () => { clearDayHistory(); setEditingTextId(null); setOpenDay(null); };

  /* ── calendar navigation (§5·6·9) — selection only, never touches persistence ──
     Leaving a month/week tears down anything scoped to the old surface so no
     stale active day / edit / placement / undo history bleeds across (§8·10).
     (Arrows sit under the day-page overlay, so this only runs with it closed —
     the setState-to-null calls then no-op/bail out.) */
  const resetMonthSession = () => {
    setOpenDay(null);
    setEditingTextId(null);
    setPlacingSticker(null);
    clearDayHistory();
  };
  const changeMonth = (year, monthIndex) => {
    if (isFutureMonth({ year, monthIndex }, CAL.today)) return; // never navigate into the future
    resetMonthSession();
    // show the PREFERRED day clamped to the target month + today (returning to
    // the current month past today collapses to today; a past month keeps its
    // real day). The preferred day is only read, never shrunk, so a short month
    // is fully reversible. moveToMonthUsingPreferredDay also sets visibleMonth.
    moveToMonthUsingPreferredDay(year, monthIndex);
    setMonthPickerOpen(false);
  };
  const goPrevMonth = () => { const m = addMonths(visibleMonth.year, visibleMonth.monthIndex, -1); changeMonth(m.year, m.monthIndex); };
  const goNextMonth = () => { const m = addMonths(visibleMonth.year, visibleMonth.monthIndex, 1); changeMonth(m.year, m.monthIndex); };

  /* week paging: anchor ±7 real days; the header/visibleMonth follow the anchor
     into its month so a later switch to month view lands there (§4·5). Paging
     forward can land on a day past today inside the current week (e.g. today is
     the last of the month and +7 crosses into the next month) — clamp to today
     FIRST, then derive visibleMonth from the clamped anchor so the two never
     disagree about the month. */
  const goToWeekAnchor = (anchor) => {
    resetMonthSession();
    // paging a week is an explicit date change → also updates the preferred day
    const clamped = commitExplicitWeekAnchor(anchor);
    setVisibleMonth({ year: clamped.year, monthIndex: clamped.monthIndex });
  };
  const goPrevWeek = () => goToWeekAnchor(addDaysLocal(weekAnchor, -7));
  const goNextWeek = () => { if (!isCurrentWeek) goToWeekAnchor(addDaysLocal(weekAnchor, 7)); }; // never past today's week

  /* Oggi: jump back to today — sets the anchor + visibleMonth to the real
     current date, so month view shows this month and week view shows this
     week (§6). One handler serves both modes. */
  const goToToday = () => {
    resetMonthSession();
    commitExplicitWeekAnchor({ year: CAL.year, monthIndex: CAL.monthIndex, day: CAL.todayDay });
    setVisibleMonth({ year: CAL.year, monthIndex: CAL.monthIndex });
    setMonthPickerOpen(false);
  };

  /* Ctrl/Cmd+Z (undo) · +Shift or Ctrl+Y (redo) while a day page is open.
     Typing in the textarea keeps the browser's native text undo. */
  const undoDayRef = useRef(undoDay); undoDayRef.current = undoDay;
  const redoDayRef = useRef(redoDay); redoDayRef.current = redoDay;
  useEffect(() => {
    if (openDay == null) return;
    const onKey = (e) => {
      if (!(e.metaKey || e.ctrlKey)) return;
      const tag = e.target?.tagName;
      if (tag === "TEXTAREA" || tag === "INPUT") return;
      const k = e.key.toLowerCase();
      if (k === "z" && !e.shiftKey) { e.preventDefault(); undoDayRef.current(); }
      else if ((k === "z" && e.shiftKey) || k === "y") { e.preventDefault(); redoDayRef.current(); }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [openDay]);

  /* create a mock user sticker asset (emoji only) — enforces the free limit */
  const createUserSticker = ({ content, texture, name }) => {
    if (userAssets.length >= FREE_ASSET_LIMIT) {
      showToast(`Stickerbook full — ${FREE_ASSET_LIMIT}/${FREE_ASSET_LIMIT}`);
      return;
    }
    const asset = createStickerAsset({
      id: `user-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      kind: "emoji", source: "user", content, texture,
      name: (name && name.trim()) || CUTE_NAMES[Math.floor(Math.random() * CUTE_NAMES.length)],
    });
    setUserAssets((a) => [...a, asset]);
    showToast(`${content} added to your Stickerbook ✨`);
  };

  const TabBtn = ({ id, icon: Icon, label }) => (
    <button onClick={() => setTab(id)} aria-label={label} style={{
      flex: 1, border: "none", background: "transparent", cursor: "pointer",
      display: "flex", flexDirection: "column", alignItems: "center", gap: 3, padding: "9px 0 7px",
      color: tab === id ? t.accent : t.sub, transition: "color .15s",
    }}>
      <Icon size={21} strokeWidth={tab === id ? 2.4 : 2} />
      <span className="cp-display" style={{ fontSize: 10, fontWeight: 600 }}>{label}</span>
    </button>
  );

  return (
    <div className="cp-root" style={{ minHeight: "100vh", background: t.bg, display: "flex", justifyContent: "center" }}>
      <GlobalStyle t={t} />
      <div style={{ width: "100%", maxWidth: 430, position: "relative", background: t.bg, minHeight: "100vh", overflow: "hidden", transition: "background .4s" }}>

        {/* header: wordmark + month/week toggle (on the Diary tab) */}
        <div style={{ position: "absolute", top: 0, left: 0, right: 0, zIndex: 30, display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 16px 10px", background: t.bg, boxShadow: `0 8px 12px -10px rgba(51,33,26,.15)` }}>
          <div>
            <span className="cp-display" style={{ fontSize: 21, fontWeight: 700, color: t.ink }}>Momenti</span>
            <span className="cp-display" style={{ fontSize: 10, fontWeight: 600, color: t.sub, marginLeft: 6, letterSpacing: 1 }}>STICKER DIARY</span>
          </div>
          {tab === "diario" && (
            <div className="cp-display" style={{ display: "flex", background: t.paper, borderRadius: 999, padding: 3, boxShadow: "0 2px 8px rgba(51,33,26,.12)", fontSize: 12, fontWeight: 700 }}>
              {["month", "week"].map((v) => (
                <button key={v} onClick={() => setCalendarView(v)} aria-label={`${v} view`} style={{
                  border: "none", cursor: "pointer", borderRadius: 999, padding: "5px 13px", textTransform: "capitalize",
                  background: calendarView === v ? t.accent : "transparent",
                  color: calendarView === v ? "#fff" : t.sub, transition: "background .15s, color .15s",
                }}>{v}</button>
              ))}
            </div>
          )}
        </div>

        {/* screens */}
        <div style={{ height: "100vh", overflowY: "auto", paddingTop: 50 }} className="cp-scroll">
          {tab === "diario" && (
            <Diary
              t={t} cal={viewCal} view={calendarView} weekCells={weekCells}
              monthElements={elementsOf(viewCal.monthKey)} resolveAsset={resolveAsset}
              dayElements={(d) => elementsOf(dayKeyFor(d))}
              onOpenBook={() => setBookOpen(true)}
              onOpenDay={openDayPage}
              onPrevMonth={goPrevMonth} onNextMonth={goNextMonth} canGoNextMonth={canGoNextMonth}
              onPrevWeek={goPrevWeek} onNextWeek={goNextWeek} canGoNextWeek={canGoNextWeek}
              isCurrentMonth={viewCal.isCurrentMonth} isCurrentWeek={isCurrentWeek}
              onOpenMonthPicker={() => setMonthPickerOpen(true)}
              onToday={goToToday} monthTitleRef={monthTitleRef}
              {...surfaceHandlers(viewCal.monthKey)}
            />
          )}
          {/* Bookshelf keeps the real current-month label — the book's identity
              shouldn't flip as you browse past months (§13). */}
          {tab === "bookshelf" && <Bookshelf t={t} cal={CAL} />}
        </div>

        {/* full-screen day page (deco surface b) — paper page-turn in/out */}
        {openDay != null && (
          <DayPage
            key={openDay}
            t={t} cal={viewCal} day={openDay}
            elements={elementsOf(dayKeyFor(openDay))} resolveAsset={resolveAsset}
            onOpenBook={() => setBookOpen(true)}
            onClose={closeDayPage}
            editingTextId={editingTextId} onEditText={setEditingTextId}
            onAddText={() => { pushDayUndo(dayKeyFor(openDay)); createTextElement(dayKeyFor(openDay)); }}
            canUndo={undoRef.current.length > 0} onUndo={undoDay}
            canRedo={redoRef.current.length > 0} onRedo={redoDay}
            {...surfaceHandlers(dayKeyFor(openDay), { undoable: true })}
          />
        )}

        {/* toast */}
        {toast && (
          <div className="cp-pop cp-display" style={{ position: "absolute", bottom: 108, left: "50%", transform: "translateX(-50%)", background: t.ink, color: t.bg, borderRadius: 999, padding: "10px 18px", fontSize: 13.5, fontWeight: 600, zIndex: 60, whiteSpace: "nowrap", boxShadow: "0 6px 18px rgba(51,33,26,.3)" }}>
            {toast}
          </div>
        )}

        {/* bottom nav + FAB */}
        <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, zIndex: 30 }}>
          <div style={{ margin: "0 14px 14px", background: t.paper, borderRadius: 22, boxShadow: "0 -2px 20px rgba(51,33,26,.14)", display: "flex", alignItems: "center", position: "relative" }}>
            <TabBtn id="diario" icon={BookOpen} label="Diary" />
            <div style={{ width: 66 }} />
            <TabBtn id="bookshelf" icon={Library} label="Bookshelf" />
            <button onClick={() => setBookOpen(true)} aria-label="add stickers to this month" style={{
              position: "absolute", left: "50%", top: -20, transform: "translateX(-50%)",
              width: 58, height: 58, borderRadius: "50%", border: `4px solid ${t.bg}`,
              background: t.accent, color: "#fff", cursor: "pointer",
              boxShadow: "0 6px 16px rgba(200,51,27,.4)", display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <Plus size={26} strokeWidth={2.6} />
            </button>
          </div>
        </div>

        {/* overlays */}
        {bookOpen && <StickerbookSheet t={t} page={bookPage} setPage={setBookPage} onPick={pickFromBook} onClose={() => setBookOpen(false)} userAssets={userAssets} onCreate={createUserSticker} />}
        {monthPickerOpen && (
          <MonthPickerSheet
            t={t}
            visibleMonth={visibleMonth}
            today={CAL.today}
            onSelect={changeMonth}
            onToday={goToToday}
            onClose={() => setMonthPickerOpen(false)}
            returnFocusRef={monthTitleRef}
          />
        )}
      </div>
    </div>
  );
}
