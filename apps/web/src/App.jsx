// ─────────────────────────────────────────────────────────────
//  MOMENTI · photo-cutout sticker diary (JSX-first prototype)
//  Screens: Diary (sticker calendar, month/week) · Bookshelf.
//  "+" opens the Stickerbook overlay. Emoji stand in for real
//  photo-cutout stickers. Coffee/gelato is just an optional theme.
// ─────────────────────────────────────────────────────────────
import { useState, useEffect, useRef } from "react";
import { BookOpen, Library, Plus, X } from "lucide-react";
// Design tokens (future source of truth). App.jsx is still JSX-first and mostly
// inlines its own values; this wires in the font stacks and sticker rotation range.
import { FONTS } from "./design/typography";
import { STICKER } from "./design/tokens";
import { createStickerAsset, createStickerInstance, seedStickerAssets, FREE_ASSET_LIMIT } from "./data/stickers";
import StickerVisual from "./components/StickerVisual";

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
/* single diary page for now (Luglio 2026); instances are keyed to it */
const DIARY_PAGE_ID = "2026-07";
const BOOK_PAGE_SIZE = 8;

/* mock "make a sticker" creator: curated fun emoji + cute default names.
   No real image upload — emoji content only for now. */
const CREATOR_EMOJI = ["🌈", "⭐", "💖", "🔥", "🌸", "🍀", "🦋", "🐱", "🌙", "☁️", "🍩", "🧁", "🎀", "👑", "💎", "🍭", "🌵", "🐳", "🍄", "⚡"];
const CUTE_NAMES = ["Cutie", "Dolce", "Bubbly", "Ciao", "Amore", "Sparkle", "Momento"];

const PACKS = [
  { id: "dolce", name: "Dolce vita", items: ["🎀", "💌", "🫶"], price: 10 },
  { id: "estate", name: "Estate italiana", items: ["🍉", "🌊", "⛱️"], price: 8 },
  { id: "ferra", name: "Ferragosto · limitata!", items: ["🌞", "🍑", "🎆"], price: 20, limited: true },
];

/* seed calendar: luglio 2026, oggi = 15 (data kept for storage-shape parity;
   drink entries are no longer rendered after the de-scope) */
const SEED_ENTRIES = {
  2:  [{ emoji: "☕", name: "Espresso", cafe: "Bar Nino", time: "8:02", hearts: 5, deco: ["✨"] }],
  3:  [{ emoji: "🥐", name: "Cornetto", cafe: "Pasticceria Mimosa", time: "9:15", hearts: 4, deco: ["💛"] }],
  5:  [{ emoji: "🍦", name: "Fior di latte", cafe: "Gelateria Luna Blu", time: "17:40", hearts: 5, deco: ["🌞", "✨"] },
       { emoji: "☕", name: "Espresso", cafe: "Caffè Aurora", time: "10:20", hearts: 3, deco: [] }],
  7:  [{ emoji: "🍫", name: "Marocchino", cafe: "Bar Nino", time: "8:30", hearts: 5, deco: ["🍒"] }],
  9:  [{ emoji: "🍋", name: "Sorbetto limone", cafe: "Gelateria Paganino", time: "19:05", hearts: 4, deco: ["⭐"] }],
  10: [{ emoji: "☕", name: "Espresso", cafe: "Bar Sport", time: "7:55", hearts: 4, deco: [] }],
  12: [{ emoji: "🍸", name: "Shakerato", cafe: "Caffè Aurora", time: "15:10", hearts: 5, deco: ["🎀", "✨"] }],
  13: [{ emoji: "🍨", name: "Pistacchio", cafe: "Gelateria Luna Blu", time: "18:22", hearts: 5, deco: ["🫶"] }],
  14: [{ emoji: "🥛", name: "Macchiato", cafe: "Torrefazione Gatto Nero", time: "9:40", hearts: 4, deco: ["💌"] }],
  15: [{ emoji: "☕", name: "Espresso", cafe: "Bar Nino", time: "8:11", hearts: 5, deco: ["✨"] }],
};

const TODAY = 15;
const DAYS_IN_MONTH = 31;
const FIRST_WEEKDAY_OFFSET = 2; // 1 luglio 2026 = mercoledì (settimana da lunedì)

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
    @import url('https://fonts.googleapis.com/css2?family=Fredoka:wght@400;500;600;700&family=Nunito:wght@400;600;700;800&display=swap');

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

    .cp-scroll { scrollbar-width: none; }
    .cp-scroll::-webkit-scrollbar { display: none; }

    button { font-family: inherit; }
    input { font-family: inherit; }
    input:focus, button:focus-visible { outline: 2px solid ${t.accent}; outline-offset: 2px; }

    @media (prefers-reduced-motion: reduce) {
      .cp-bob, .cp-pop, .cp-fadeup { animation: none !important; }
      .cp-glitter-sheen { animation: none !important; } /* static sheen */
      .cp-drag-settle { transition: none !important; } /* instant lift/settle */
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

function Diary({ t, view, onOpenBook, placing, onCancelPlacing, pageStickers, resolveAsset, onPlaceAt, onMove, onReturn, onDuplicate, onRemove }) {
  const [menuFor, setMenuFor] = useState(null); // placed-sticker id with open action menu
  const [drag, setDrag] = useState(null);       // { id, phase: pressing|lifted|returning, sx, sy, cx, cy, over, flyDx, flyDy }
  const dragRef = useRef(null);                  // mirror of `drag` for synchronous logic (avoids nesting side effects in updaters → StrictMode-safe)
  const holdTimer = useRef(null);
  const cardRef = useRef(null);                  // calendar card → maps pointer to x/y %
  const returnRef = useRef(null);                // return zone → hit-test on drop

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
    if (d.phase === "pressing") {                // quick tap → open the action menu
      setMenuFor(s.id);
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
      const rect = cardRef.current?.getBoundingClientRect();
      if (rect) {                                // dropped on the page → move to new x/y
        const x = ((d.cx - rect.left) / rect.width) * 100;
        const y = ((d.cy - rect.top) / rect.height) * 100;
        if (x >= 0 && x <= 100 && y >= 0 && y <= 100) {
          onMove(s.id, Math.min(95, Math.max(5, x)), Math.min(93, Math.max(7, y)));
        }
      }
      putDrag(null);                             // outside page & zone → just settle back
    }
  };

  const cells = [];
  for (let i = 0; i < FIRST_WEEKDAY_OFFSET; i++) cells.push(null);
  for (let d = 1; d <= DAYS_IN_MONTH; d++) cells.push(d);

  // week strip: the 7 days of the week containing TODAY (groundwork for day thumbnails)
  const weekdayOfToday = (TODAY - 1 + FIRST_WEEKDAY_OFFSET) % 7;
  const weekStart = TODAY - weekdayOfToday;
  const weekCells = Array.from({ length: 7 }, (_, i) => {
    const d = weekStart + i;
    return d >= 1 && d <= DAYS_IN_MONTH ? d : null;
  });
  const WEEKDAYS = ["LU", "MA", "ME", "GI", "VE", "SA", "DO"];

  return (
    <div style={{ padding: "0 16px 110px" }}>
      {/* header card */}
      <div style={{ position: "relative", marginTop: 18, background: t.paper, borderRadius: 20, padding: "16px 18px 14px", boxShadow: "0 3px 12px rgba(51,33,26,.09)" }}>
        <Tape t={t} rot={-3} />
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
          <div>
            <div className="cp-display" style={{ fontSize: 24, fontWeight: 700, color: t.ink }}>Luglio 2026</div>
            <div style={{ fontSize: 12.5, color: t.sub, fontWeight: 700 }}>
              {view === "week" ? "this week" : "your sticker diary"} · tap + to add stickers
            </div>
          </div>
          <span className="cp-sticker cp-bob" style={{ fontSize: 34 }}>📖</span>
        </div>
      </div>

      {/* stickerbook opener */}
      <button onClick={onOpenBook} style={{ position: "relative", width: "100%", marginTop: 12, background: t.paper, border: "none", borderRadius: 16, padding: "11px 14px", display: "flex", alignItems: "center", gap: 11, boxShadow: "0 2px 8px rgba(51,33,26,.08)", cursor: "pointer", textAlign: "left" }}>
        <Tape t={t} rot={3} w={56} />
        <span className="cp-sticker-sm" style={{ fontSize: 24, transform: "rotate(-4deg)" }}>📒</span>
        <span style={{ flex: 1, minWidth: 0 }}>
          <span className="cp-display" style={{ display: "block", fontWeight: 600, fontSize: 14, color: t.ink }}>Stickerbook</span>
          <span style={{ display: "block", fontSize: 11, color: t.sub, fontWeight: 700 }}>
            {pageStickers.length > 0 ? `${pageStickers.length} stuck on this page · ` : ""}peel a sticker, decorate the page
          </span>
        </span>
        <span className="cp-display" style={{ fontSize: 11.5, fontWeight: 700, color: t.accent, background: t.accentSoft, borderRadius: 999, padding: "5px 11px", flexShrink: 0 }}>Open</span>
      </button>

      {/* placing hint */}
      {placing && (
        <div className="cp-pop" style={{ marginTop: 10, background: t.accentSoft, borderRadius: 14, padding: "9px 12px", display: "flex", alignItems: "center", gap: 9, border: `1.5px dashed ${t.accent}` }}>
          <span className="cp-bob" style={{ display: "inline-block" }}><StickerVisual asset={placing} size={22} /></span>
          <span className="cp-display" style={{ flex: 1, fontSize: 12.5, fontWeight: 600, color: t.ink }}>tap the calendar page to stick it ✨</span>
          <button onClick={onCancelPlacing} className="cp-display" style={{ border: "none", background: t.paper, borderRadius: 999, padding: "5px 11px", fontSize: 11.5, fontWeight: 700, color: t.sub, cursor: "pointer" }}>cancel</button>
        </div>
      )}

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
                const isToday = d === TODAY;
                const future = d != null && d > TODAY;
                return (
                  <div key={i} style={{
                    aspectRatio: "1", borderRadius: 12, position: "relative", padding: 0,
                    ...(isToday ? { background: t.accentSoft, boxShadow: `inset 0 0 0 2px ${t.accent}` } : {}),
                  }}>
                    {d && (
                      <span style={{
                        position: "absolute", top: 3, left: 5, fontSize: 9.5, fontWeight: 800,
                        color: future ? "rgba(0,0,0,.18)" : isToday ? t.accent : t.sub,
                      }}>{d}</span>
                    )}
                  </div>
                );
              })}
            </div>
          </>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", gap: 4 }}>
            {weekCells.map((d, i) => {
              const isToday = d === TODAY;
              const future = d != null && d > TODAY;
              return (
                <div key={i} style={{
                  minHeight: 66, borderRadius: 12, position: "relative",
                  display: "flex", flexDirection: "column", alignItems: "center", paddingTop: 7,
                  background: isToday ? t.accentSoft : "transparent",
                  boxShadow: isToday ? `inset 0 0 0 2px ${t.accent}` : "none",
                }}>
                  <span className="cp-display" style={{ fontSize: 10, fontWeight: 600, color: i >= 5 ? t.accent : t.sub }}>{WEEKDAYS[i]}</span>
                  {d && <span style={{ fontSize: 16, fontWeight: 800, marginTop: 5, color: future ? "rgba(0,0,0,.18)" : isToday ? t.accent : t.ink }}>{d}</span>}
                </div>
              );
            })}
          </div>
        )}

        {/* placed stickers (instances stuck on this page) — press-hold to lift & drag */}
        {pageStickers.map((s) => {
          const asset = resolveAsset(s.assetId);
          if (!asset) return null; // unknown/removed asset → skip (stays safe on load)
          const d = drag && drag.id === s.id ? drag : null;
          const phase = d ? d.phase : "idle";
          const lifted = phase === "lifted";
          const returning = phase === "returning";
          const floating = lifted || returning;
          // scale/rotation per phase
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
              aria-label={`placed sticker ${asset.name}`}
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
                <StickerVisual asset={asset} size={30} />
              </span>
            </button>
          );
        })}

        {/* action menu for a placed sticker */}
        {menuFor != null && (() => {
          const s = pageStickers.find((p) => p.id === menuFor);
          if (!s) return null;
          const asset = resolveAsset(s.assetId);
          const below = s.y < 55; // open downward if the sticker sits high on the page
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
            style={{ position: "absolute", inset: 0, zIndex: 12, cursor: "copy", borderRadius: 20, border: `2px dashed ${t.accent}`, background: "rgba(255,255,255,.12)" }}
          />
        )}
      </div>

      {/* peel-back drop target, only while a sticker is lifted */}
      {drag && (drag.phase === "lifted" || drag.phase === "returning") && (
        <ReturnZone t={t} active={!!drag.over} innerRef={returnRef} />
      )}
    </div>
  );
}

/* ═══════════════ 3 · BOOKSHELF (책장) ═══════════════ */

/* Minimal shelf: one book cover for the current diary + the relocated
   public/private toggle. The multiple-diaries PR will expand this. */
function Bookshelf({ t, isPublic, setIsPublic }) {
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
            <div style={{ fontSize: 11, opacity: 0.8, fontWeight: 700 }}>Luglio 2026</div>
          </div>
        </div>
        <div style={{ flex: 1 }}>
          <div className="cp-display" style={{ fontSize: 14, fontWeight: 700, color: t.ink }}>Current diary</div>
          <div style={{ fontSize: 11.5, color: t.sub, fontWeight: 700, marginTop: 3 }}>더 많은 다이어리는 곧 · more diaries coming soon</div>
        </div>
      </div>

      {/* public / private toggle (relocated from the old Stickerbook cover) */}
      <div style={{ marginTop: 20, background: t.paper, borderRadius: 16, padding: "12px 14px", display: "flex", alignItems: "center", gap: 12, boxShadow: "0 2px 8px rgba(51,33,26,.08)" }}>
        <span style={{ fontSize: 24 }}>{isPublic ? "🌍" : "🔒"}</span>
        <div style={{ flex: 1 }}>
          <div className="cp-display" style={{ fontWeight: 600, fontSize: 14, color: t.ink }}>{isPublic ? "Share diary" : "Private diary"}</div>
          <div style={{ fontSize: 11.5, color: t.sub, fontWeight: 700 }}>{isPublic ? "others can flip through this diary" : "only you can see this diary (default)"}</div>
        </div>
        <button onClick={() => setIsPublic(!isPublic)} aria-label="toggle diary visibility" style={{ border: "none", cursor: "pointer", width: 46, height: 26, borderRadius: 14, background: isPublic ? t.accent : t.accentSoft, position: "relative", transition: "background .2s" }}>
          <span style={{ position: "absolute", top: 3, left: isPublic ? 23 : 3, width: 20, height: 20, borderRadius: "50%", background: "#fff", transition: "left .25s cubic-bezier(.34,1.56,.64,1)", boxShadow: "0 1px 3px rgba(51,33,26,.3)" }} />
        </button>
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
          <div style={{ fontSize: 11.5, color: t.sub, fontWeight: 700, marginBottom: 12 }}>tap a sticker to peel it, then stick it on today's page</div>

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

/* ═══════════════ localStorage persistence ═══════════════ */
// One versioned JSON blob under a single key. Only durable data is saved
// (diary entries, placed stickers, owned packs, beans). Ephemeral state —
// live map balloons, modals/sheets, active tab, toasts — is never persisted.
const STORAGE_KEY = "momenti.v1";

// Migrate a v1 blob (placements as { id, assetId, emoji, name, x, y, rot })
// to v2 (placements as StickerInstance referencing assets by id).
function migrateV1toV2(v1) {
  const pageStickers = Array.isArray(v1.pageStickers)
    ? v1.pageStickers.map((p) => createStickerInstance({
        id: p.id,
        assetId: p.assetId,
        x: p.x, y: p.y,
        rotation: p.rot,               // v1 used `rot`
        scale: 1,
        placedAt: p.placedAt ?? Date.now(),
        page: DIARY_PAGE_ID,
      }))
    : [];
  return { version: 2, entries: v1.entries, beans: v1.beans, ownedPacks: v1.ownedPacks, pageStickers, userAssets: [] };
}

function loadPersisted() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const data = JSON.parse(raw);
    if (!data) return null;
    if (data.version === 2) return data;
    if (data.version === 1) return migrateV1toV2(data); // upgrade old placements
    return null;                                         // unknown version → seed defaults
  } catch {
    return null; // missing / corrupt / storage unavailable → seed defaults
  }
}

/* ═══════════════ APP SHELL ═══════════════ */

export default function Momenti() {
  const [saved] = useState(loadPersisted); // parsed once on mount; null if absent/corrupt
  const [tab, setTab] = useState("diario");
  const [calendarView, setCalendarView] = useState("month"); // month | week
  const [toast, setToast] = useState(null);
  const [isPublic, setIsPublic] = useState(false); // session-only diary visibility (not persisted)
  // Beans / packs / drink-entries stay in state + persistence (UI removed / dormant)
  // so the stored blob shape is unchanged. No setters — nothing mutates them now.
  const [entries] = useState(saved?.entries ?? SEED_ENTRIES);
  const [beans] = useState(saved?.beans ?? 12);
  const [ownedPacks] = useState(saved?.ownedPacks ?? []);

  /* stickerbook overlay — local prototype state only.
     assets live in STICKER_ASSETS; these are placed *instances*. */
  const [bookOpen, setBookOpen] = useState(false);
  const [bookPage, setBookPage] = useState(0);
  const [placingSticker, setPlacingSticker] = useState(null); // peeled asset waiting for a tap on the page
  const [pageStickers, setPageStickers] = useState(saved?.pageStickers ?? []); // instances stuck on today's diary page
  // resume ids past the highest restored one so new placements never collide
  const placedIdRef = useRef((saved?.pageStickers?.reduce((m, s) => Math.max(m, s.id), 0) ?? 0) + 1);
  const [userAssets, setUserAssets] = useState(saved?.userAssets ?? []); // user-made StickerAssets (source:"user")

  const t = THEME;

  /* resolve a placed instance's design — base seed assets + user-made ones */
  const resolveAsset = (id) => ASSET_BY_ID[id] ?? userAssets.find((a) => a.id === id);

  /* persist durable state on change (single versioned blob) */
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ version: 2, entries, beans, ownedPacks, pageStickers, userAssets }));
    } catch {
      // ignore write failures (quota exceeded / private mode)
    }
  }, [entries, beans, ownedPacks, pageStickers, userAssets]);

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(null), 2400); };

  /* ── stickerbook actions ── */
  const pickFromBook = (asset) => {
    setBookOpen(false);
    setPlacingSticker(asset);
    showToast(`${asset.content} peeled! tap the page to stick it`);
  };
  const placeSticker = (x, y) => {
    if (!placingSticker) return;
    setPageStickers((ps) => [...ps, createStickerInstance({
      id: placedIdRef.current++, assetId: placingSticker.id,
      x, y, rotation: randomTilt(), scale: 1, placedAt: Date.now(), page: DIARY_PAGE_ID,
    })]);
    showToast(`${placingSticker.content} stuck! ✨`);
    setPlacingSticker(null);
  };
  /* removes only the placed instance — the asset stays in the Stickerbook */
  const returnPlaced = (id) => {
    const s = pageStickers.find((p) => p.id === id);
    const asset = s && resolveAsset(s.assetId);
    setPageStickers((ps) => ps.filter((p) => p.id !== id));
    showToast(`${asset ? asset.content + " " : ""}back in the Stickerbook ↩`);
  };
  const duplicatePlaced = (id) => {
    setPageStickers((ps) => {
      const s = ps.find((p) => p.id === id);
      if (!s) return ps;
      return [...ps, createStickerInstance({
        ...s, id: placedIdRef.current++,
        x: Math.min(93, s.x + 7), y: Math.min(91, s.y + 7),
        rotation: randomTilt(), placedAt: Date.now(),
      })];
    });
    showToast("⧉ stuck a copy!");
  };
  const removePlaced = (id) => {
    setPageStickers((ps) => ps.filter((p) => p.id !== id));
    showToast("peeled off the page");
  };
  /* peel-back drag: update a placed instance's position (percent coords) */
  const moveSticker = (id, x, y) => {
    setPageStickers((ps) => ps.map((p) => (p.id === id ? { ...p, x, y } : p)));
  };
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
              t={t} view={calendarView}
              onOpenBook={() => setBookOpen(true)}
              placing={placingSticker} onCancelPlacing={() => setPlacingSticker(null)}
              pageStickers={pageStickers} resolveAsset={resolveAsset} onPlaceAt={placeSticker}
              onMove={moveSticker}
              onReturn={returnPlaced} onDuplicate={duplicatePlaced} onRemove={removePlaced}
            />
          )}
          {tab === "bookshelf" && <Bookshelf t={t} isPublic={isPublic} setIsPublic={setIsPublic} />}
        </div>

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
            <button onClick={() => setBookOpen(true)} aria-label="add stickers to today" style={{
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
      </div>
    </div>
  );
}
