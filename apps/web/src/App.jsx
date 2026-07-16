// ─────────────────────────────────────────────────────────────
//  MOMENTI · prototipo interattivo (MVP mockup)
//  4 screens: Diario (sticker calendar) · Log flow (photo→cutout
//  sticker) · Mappa (ephemeral balloon reviews) · Passaporto
//  Emoji stand in for real photo-cutout stickers.
// ─────────────────────────────────────────────────────────────
import { useState, useEffect, useRef } from "react";
import { BookOpen, Map as MapIcon, Stamp, Plus, X, Camera, MapPin, ChevronLeft } from "lucide-react";
// Design tokens (future source of truth). App.jsx is still JSX-first and mostly
// inlines its own values; this wires in the font stacks and sticker rotation range.
import { FONTS } from "./design/typography";
import { STICKER } from "./design/tokens";
import { createStickerInstance, seedStickerAssets } from "./data/stickers";

/* ---------- theme tokens ---------- */
const THEMES = {
  caffe: {
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
    mapGround: "#EFE3C8",
    mapBlock: "#E3D2AE",
  },
  gelato: {
    bg: "#FBE9F0",          // latte di fragola
    paper: "#FFF9FB",
    ink: "#3A2430",
    sub: "#9A6E82",
    accent: "#E85D8A",      // amarena
    accentSoft: "#FAD7E4",
    green: "#5FB08A",       // menta
    greenSoft: "#DDF1E6",
    blue: "#8FB8E8",
    tape: "rgba(232,93,138,.18)",
    mapGround: "#F3E2EA",
    mapBlock: "#E9CFDC",
  },
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
const STICKER_ASSETS = seedStickerAssets({
  caffe: DRINKS.caffe,
  gelato: DRINKS.gelato,
  decos: DECOS,
  decoNames: ["Sparkle", "Cuore", "Margherita", "Stella", "Italia"],
});
const ASSET_BY_ID = Object.fromEntries(STICKER_ASSETS.map((a) => [a.id, a]));
const getAsset = (id) => ASSET_BY_ID[id];
/* single diary page for now (Luglio 2026); instances are keyed to it */
const DIARY_PAGE_ID = "2026-07";
const BOOK_PAGE_SIZE = 8;

const PACKS = [
  { id: "dolce", name: "Dolce vita", items: ["🎀", "💌", "🫶"], price: 10 },
  { id: "estate", name: "Estate italiana", items: ["🍉", "🌊", "⛱️"], price: 8 },
  { id: "ferra", name: "Ferragosto · limitata!", items: ["🌞", "🍑", "🎆"], price: 20, limited: true },
];

const CAFES = [
  { id: 1, name: "Bar Nino", zone: "Brera", x: 34, y: 26, kind: "caffe" },
  { id: 2, name: "Caffè Aurora", zone: "Duomo", x: 52, y: 52, kind: "caffe" },
  { id: 3, name: "Torrefazione Gatto Nero", zone: "Isola", x: 60, y: 12, kind: "caffe" },
  { id: 4, name: "Pasticceria Mimosa", zone: "Navigli", x: 30, y: 80, kind: "caffe" },
  { id: 5, name: "Gelateria Luna Blu", zone: "P.ta Venezia", x: 78, y: 34, kind: "gelato" },
  { id: 6, name: "Gelateria Paganino", zone: "Navigli", x: 48, y: 84, kind: "gelato" },
  { id: 7, name: "Bar Sport", zone: "Lambrate", x: 88, y: 56, kind: "caffe" },
];

const FRIENDS = [
  { user: "Giulia", emoji: "🍫", text: "Marocchino della vita 🫠" },
  { user: "Marco", emoji: "☕", text: "Terzo espresso. Non giudicate." },
  { user: "Sofia", emoji: "🍨", text: "Pistacchio serissimo qui!!" },
  { user: "Seojung ✈️", emoji: "🍋", text: "한국에서 왔어요! sorbetto 최고 🍋" },
  { user: "Ale", emoji: "🥐", text: "Cornetto ancora caldo?!" },
  { user: "Chiara", emoji: "🍒", text: "Amarena + panna = sì" },
  { user: "Tommi", emoji: "🍸", text: "Shakerato in Darsena ✌️" },
];

/* seed calendar: luglio 2026, oggi = 15 */
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

const STAMPS = [
  { zone: "Brera", n: 6, got: true, rot: -8, color: 0 },
  { zone: "Duomo", n: 4, got: true, rot: 5, color: 1 },
  { zone: "Navigli", n: 9, got: true, rot: -4, color: 2 },
  { zone: "Isola", n: 2, got: true, rot: 10, color: 0 },
  { zone: "P.ta Venezia", n: 0, got: false, rot: -6, color: 1 },
  { zone: "Lambrate", n: 1, got: false, rot: 7, color: 2 },
];

const BADGES = [
  { emoji: "🚨", name: "Cappuccino Criminale", desc: "cappuccino dopo le 11:00", done: true },
  { emoji: "🏆", name: "Centista", desc: "100 bar di Milano", prog: [23, 100] },
  { emoji: "🍦", name: "Gelato Nomade", desc: "10 gusti diversi", prog: [4, 10] },
  { emoji: "🌅", name: "Alba al Banco", desc: "espresso prima delle 7:00", done: true },
  { emoji: "✈️", name: "Fuori Porta", desc: "timbro fuori Milano", prog: [0, 1] },
];

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

    @keyframes cp-bob { 0%,100% { transform: translateY(0); } 50% { transform: translateY(-7px); } }
    @keyframes cp-pop { 0% { transform: scale(.3) rotate(-12deg); opacity: 0; } 70% { transform: scale(1.12) rotate(3deg); } 100% { transform: scale(1) rotate(0); opacity: 1; } }
    @keyframes cp-wiggle { 0%,100% { transform: rotate(-6deg); } 50% { transform: rotate(8deg); } }
    @keyframes cp-dash { to { stroke-dashoffset: -40; } }
    @keyframes cp-fadeup { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
    @keyframes cp-steam { 0% { opacity:0; transform: translateY(4px) scale(.8);} 40% {opacity:.7;} 100% { opacity:0; transform: translateY(-14px) scale(1.15);} }

    .cp-pop { animation: cp-pop .45s cubic-bezier(.34,1.56,.64,1) both; }
    .cp-fadeup { animation: cp-fadeup .35s ease both; }
    .cp-bob { animation: cp-bob 3.2s ease-in-out infinite; }

    .cp-balloon-fading { opacity: .35; transform: scale(.85); transition: all 1.2s ease; }

    .cp-scroll { scrollbar-width: none; }
    .cp-scroll::-webkit-scrollbar { display: none; }

    button { font-family: inherit; }
    input { font-family: inherit; }
    input:focus, button:focus-visible { outline: 2px solid ${t.accent}; outline-offset: 2px; }

    @media (prefers-reduced-motion: reduce) {
      .cp-bob, .cp-pop, .cp-fadeup { animation: none !important; }
    }
  `}</style>
);

/* ═══════════════ shared bits ═══════════════ */

const Hearts = ({ n, onPick, t }) => (
  <div style={{ display: "flex", gap: 2 }}>
    {[1, 2, 3, 4, 5].map((i) => (
      <span
        key={i}
        onClick={onPick ? () => onPick(i) : undefined}
        style={{ cursor: onPick ? "pointer" : "default", fontSize: onPick ? 24 : 12, opacity: i <= n ? 1 : 0.25, transition: "opacity .15s" }}
        role={onPick ? "button" : undefined}
      >❤️</span>
    ))}
  </div>
);

const Tape = ({ t, rot = -3, w = 74 }) => (
  <div style={{
    position: "absolute", top: -9, left: "50%",
    transform: `translateX(-50%) rotate(${rot}deg)`,
    width: w, height: 18, background: t.tape,
    borderLeft: "1px dashed rgba(0,0,0,.08)", borderRight: "1px dashed rgba(0,0,0,.08)",
    borderRadius: 2, pointerEvents: "none",
  }} />
);

const EntryCard = ({ e, t, i }) => (
  <div className="cp-fadeup" style={{
    position: "relative", background: t.paper, borderRadius: 16, padding: "12px 14px",
    display: "flex", alignItems: "center", gap: 12,
    boxShadow: "0 2px 8px rgba(51,33,26,.08)", border: `1.5px solid ${t.accentSoft}`,
    animationDelay: `${i * 60}ms`,
  }}>
    <Tape t={t} rot={i % 2 ? 4 : -4} w={56} />
    <span className="cp-sticker" style={{ fontSize: 38, transform: `rotate(${tiltFor(i + 3)}deg)` }}>{e.emoji}</span>
    <div style={{ flex: 1, minWidth: 0 }}>
      <div className="cp-display" style={{ fontWeight: 600, color: t.ink, fontSize: 15 }}>
        {e.name} {e.deco.map((d, j) => <span key={j} style={{ fontSize: 13 }}>{d}</span>)}
      </div>
      <div style={{ fontSize: 12, color: t.sub, fontWeight: 700 }}>
        <MapPin size={11} style={{ display: "inline", verticalAlign: -1 }} /> {e.cafe} · {e.time}
      </div>
    </div>
    <Hearts n={e.hearts} t={t} />
  </div>
);

/* ═══════════════ 1 · DIARIO ═══════════════ */

function Diario({ t, mode, entries, openDay, setOpenDay, onOpenBook, placing, onCancelPlacing, pageStickers, onPlaceAt, onReturn, onDuplicate, onRemove }) {
  const [menuFor, setMenuFor] = useState(null); // placed-sticker id with open action menu
  const cells = [];
  for (let i = 0; i < FIRST_WEEKDAY_OFFSET; i++) cells.push(null);
  for (let d = 1; d <= DAYS_IN_MONTH; d++) cells.push(d);

  const totalCups = Object.values(entries).reduce((s, a) => s + a.length, 0);

  return (
    <div style={{ padding: "0 16px 110px" }}>
      {/* header card */}
      <div style={{ position: "relative", marginTop: 18, background: t.paper, borderRadius: 20, padding: "16px 18px 14px", boxShadow: "0 3px 12px rgba(51,33,26,.09)" }}>
        <Tape t={t} rot={-3} />
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
          <div>
            <div className="cp-display" style={{ fontSize: 24, fontWeight: 700, color: t.ink }}>Luglio 2026</div>
            <div style={{ fontSize: 12.5, color: t.sub, fontWeight: 700 }}>
              {mode === "caffe" ? "☕" : "🍦"} {totalCups} nel diario · 🔥 12 giorni di fila
            </div>
          </div>
          <span className="cp-sticker cp-bob" style={{ fontSize: 34 }}>{mode === "caffe" ? "☕" : "🍦"}</span>
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
          <span className="cp-sticker-sm cp-bob" style={{ fontSize: 22 }}>{placing.content}</span>
          <span className="cp-display" style={{ flex: 1, fontSize: 12.5, fontWeight: 600, color: t.ink }}>tap the calendar page to stick it ✨</span>
          <button onClick={onCancelPlacing} className="cp-display" style={{ border: "none", background: t.paper, borderRadius: 999, padding: "5px 11px", fontSize: 11.5, fontWeight: 700, color: t.sub, cursor: "pointer" }}>cancel</button>
        </div>
      )}

      {/* calendar */}
      <div style={{ position: "relative", marginTop: 14, background: t.paper, borderRadius: 20, padding: "14px 10px 16px", boxShadow: "0 3px 12px rgba(51,33,26,.09)", backgroundImage: `radial-gradient(${t.accentSoft} 1px, transparent 1px)`, backgroundSize: "14px 14px" }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", gap: 2, marginBottom: 6 }}>
          {["LU", "MA", "ME", "GI", "VE", "SA", "DO"].map((d, i) => (
            <div key={d} className="cp-display" style={{ textAlign: "center", fontSize: 10.5, fontWeight: 600, color: i >= 5 ? t.accent : t.sub }}>{d}</div>
          ))}
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", gap: 2 }}>
          {cells.map((d, i) => {
            const es = d ? entries[d] : null;
            const isToday = d === TODAY;
            const future = d > TODAY;
            return (
              <button
                key={i}
                onClick={() => d && !future && setOpenDay(d)}
                disabled={!d || future}
                style={{
                  aspectRatio: "1", border: "none", background: "transparent",
                  borderRadius: 12, position: "relative", cursor: d && !future ? "pointer" : "default",
                  padding: 0,
                  ...(isToday ? { background: t.accentSoft, boxShadow: `inset 0 0 0 2px ${t.accent}` } : {}),
                }}
              >
                {d && (
                  <>
                    <span style={{
                      position: "absolute", top: 3, left: 5, fontSize: 9.5, fontWeight: 800,
                      color: future ? "rgba(0,0,0,.18)" : isToday ? t.accent : t.sub,
                    }}>{d}</span>
                    {es && es.length > 0 && (
                      <span className="cp-sticker-sm" style={{
                        fontSize: es.length > 1 ? 17 : 21,
                        display: "inline-block",
                        transform: `rotate(${tiltFor(d)}deg) translateY(3px)`,
                      }}>
                        {es[0].emoji}{es.length > 1 && <span style={{ fontSize: 13, marginLeft: -5 }}>{es[1].emoji}</span>}
                      </span>
                    )}
                    {es && es[0]?.deco[0] && (
                      <span style={{ position: "absolute", top: 1, right: 2, fontSize: 9 }}>{es[0].deco[0]}</span>
                    )}
                  </>
                )}
              </button>
            );
          })}
        </div>

        {/* placed stickers (instances stuck on this page) */}
        {pageStickers.map((s) => {
          const asset = getAsset(s.assetId);
          if (!asset) return null; // unknown/removed asset → skip (stays safe on load)
          return (
            <button
              key={s.id}
              onClick={() => setMenuFor(menuFor === s.id ? null : s.id)}
              aria-label={`placed sticker ${asset.name}`}
              className="cp-sticker cp-pop"
              style={{
                position: "absolute", left: `${s.x}%`, top: `${s.y}%`,
                transform: `translate(-50%,-50%) rotate(${s.rotation}deg) scale(${s.scale})`,
                fontSize: 30, lineHeight: 1, padding: 0, zIndex: 7,
                border: "none", background: "transparent", cursor: "pointer",
              }}
            >{asset.content}</button>
          );
        })}

        {/* action menu for a placed sticker */}
        {menuFor != null && (() => {
          const s = pageStickers.find((p) => p.id === menuFor);
          if (!s) return null;
          const asset = getAsset(s.assetId);
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

      {/* today list */}
      <div className="cp-display" style={{ margin: "18px 4px 8px", fontSize: 15, fontWeight: 600, color: t.ink }}>
        Oggi · martedì 15 <span style={{ fontSize: 12, color: t.sub, fontWeight: 500 }}>(tocca + per attaccare)</span>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {(entries[TODAY] || []).map((e, i) => <EntryCard key={i} e={e} t={t} i={i} />)}
        {(entries[TODAY] || []).length === 0 && (
          <div style={{ textAlign: "center", color: t.sub, fontSize: 13, fontWeight: 700, padding: 18 }}>
            Il diario di oggi è vuoto… tempo di un {mode === "caffe" ? "caffè ☕" : "gelato 🍦"}!
          </div>
        )}
      </div>
    </div>
  );
}

/* day detail bottom sheet */
function DaySheet({ day, entries, t, onClose }) {
  if (!day) return null;
  const es = entries[day] || [];
  return (
    <div onClick={onClose} style={{ position: "absolute", inset: 0, background: "rgba(51,33,26,.35)", zIndex: 40, display: "flex", alignItems: "flex-end" }}>
      <div onClick={(e) => e.stopPropagation()} className="cp-fadeup" style={{ width: "100%", background: t.bg, borderRadius: "24px 24px 0 0", padding: "10px 18px 26px", maxHeight: "70%", overflowY: "auto" }}>
        <div style={{ width: 40, height: 5, background: t.accentSoft, borderRadius: 3, margin: "4px auto 12px" }} />
        <div className="cp-display" style={{ fontSize: 19, fontWeight: 700, color: t.ink, marginBottom: 12 }}>
          {day} luglio {es.length > 0 ? `· ${es.length} sticker` : ""}
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {es.map((e, i) => <EntryCard key={i} e={e} t={t} i={i} />)}
          {es.length === 0 && <div style={{ color: t.sub, fontWeight: 700, fontSize: 13, textAlign: "center", padding: 12 }}>Nessuno sticker questo giorno 🫥</div>}
        </div>
      </div>
    </div>
  );
}

/* ═══════════════ 2 · MAPPA (palloncini effimeri, stato in App) ═══════════════ */

const BALLOON_LIFE = () => 55000 + Math.random() * 65000; // demo: ~1–2 min reali

function makeBalloon(id) {
  const f = FRIENDS[Math.floor(Math.random() * FRIENDS.length)];
  const cafe = Math.random() < 0.35 ? CAFES[1] : CAFES[Math.floor(Math.random() * CAFES.length)];
  return { id, ...f, cafe, born: Date.now(), life: BALLOON_LIFE() };
}

function Mappa({ t, mode, balloons, now }) {
  const [sel, setSel] = useState(null);

  const slots = {};
  const positioned = balloons.map((b) => {
    const k = b.cafe.id;
    const s = (slots[k] = (slots[k] ?? -1) + 1);
    return { ...b, dx: ((s % 3) - 1) * 48, dy: Math.floor(s / 3) * -16 };
  });
  const counts = {};
  balloons.forEach((b) => { counts[b.cafe.id] = (counts[b.cafe.id] || 0) + 1; });
  const busy = CAFES.filter((c) => (counts[c.id] || 0) >= 3);

  return (
    <div style={{ padding: "0 16px 110px" }}>
      <div style={{ position: "relative", marginTop: 14, marginBottom: 10 }}>
        <div className="cp-display" style={{ fontSize: 24, fontWeight: 700, color: t.ink }}>Live Map · Milano</div>
        <div style={{ fontSize: 12.5, color: t.sub, fontWeight: 700 }}>
          🎈 1 ora fissa, poi puff · niente cronologia · {balloons.length} attivi
        </div>
      </div>

      <div style={{ borderRadius: 22, overflow: "hidden", boxShadow: "0 4px 16px rgba(51,33,26,.12)", background: t.mapGround, position: "relative", height: 430 }}>
        <div style={{ position: "absolute", inset: -60, transform: "perspective(700px) rotateX(38deg) scale(1.25)", transformOrigin: "50% 60%" }}>
          <div style={{ position: "absolute", inset: 0, backgroundImage: `linear-gradient(${t.paper} 3px, transparent 3px), linear-gradient(90deg, ${t.paper} 3px, transparent 3px)`, backgroundSize: "72px 72px", opacity: 0.9 }} />
          {[[8,8,20,14],[36,6,18,16],[62,10,24,12],[10,32,16,18],[40,30,22,16],[70,30,18,20],[8,58,24,14],[42,56,20,16],[70,58,20,14]].map((b, i) => (
            <div key={i} style={{ position: "absolute", left: `${b[0]}%`, top: `${b[1]}%`, width: `${b[2]}%`, height: `${b[3]}%`, background: t.mapBlock, borderRadius: 10, boxShadow: "0 4px 0 rgba(51,33,26,.10)" }} />
          ))}
          <div style={{ position: "absolute", left: "6%", top: "18%", width: "17%", height: "16%", background: t.greenSoft, borderRadius: "45% 55% 50% 50%", boxShadow: "0 4px 0 rgba(51,33,26,.08)" }} />
          <div style={{ position: "absolute", left: "-5%", top: "78%", width: "110%", height: "7%", background: t.blue, opacity: 0.55, borderRadius: 6, transform: "rotate(-3deg)" }} />
          <div style={{ position: "absolute", left: "49%", top: "47%", fontSize: 30, transform: "rotateX(-38deg)", transformOrigin: "bottom" }}>⛪</div>
        </div>

        {CAFES.map((c) => {
          const dim = mode === "gelato" && c.kind !== "gelato";
          return (
            <div key={c.id} style={{ position: "absolute", left: `${c.x}%`, top: `${18 + c.y * 0.7}%`, transform: "translate(-50%,-50%)", textAlign: "center", opacity: dim ? 0.35 : 1, transition: "opacity .3s" }}>
              <div style={{ width: 26, height: 26, borderRadius: "50% 50% 50% 4px", background: c.kind === "gelato" ? t.accent : t.ink, transform: "rotate(-45deg)", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 3px 6px rgba(51,33,26,.3)", margin: "0 auto" }}>
                <span style={{ transform: "rotate(45deg)", fontSize: 12 }}>{c.kind === "gelato" ? "🍦" : "☕"}</span>
              </div>
              <div className="cp-display" style={{ fontSize: 8.5, fontWeight: 600, color: t.ink, background: "rgba(255,255,255,.85)", borderRadius: 6, padding: "1px 5px", marginTop: 3, whiteSpace: "nowrap" }}>{c.name}</div>
            </div>
          );
        })}

        {/* ☁️ affollato: 3+ palloncini sullo stesso bar */}
        {busy.map((c) => (
          <div key={c.id} className="cp-bob" style={{ position: "absolute", left: `${c.x}%`, top: `${18 + c.y * 0.7 - 27}%`, transform: "translate(-50%,-100%)", zIndex: 14, pointerEvents: "none", background: "rgba(255,255,255,.94)", borderRadius: 999, padding: "5px 12px", boxShadow: "0 4px 12px rgba(51,33,26,.2)" }}>
            <span className="cp-display" style={{ fontSize: 11.5, fontWeight: 700, color: t.accent }}>☁️ affollato ora!</span>
          </div>
        ))}

        {positioned.map((b, i) => {
          const remain = Math.max(0, b.life - (now - b.born));
          const pct = remain / b.life;
          const fakeMin = Math.max(1, Math.round(pct * 60));
          const fading = pct < 0.16;
          return (
            <button
              key={b.id}
              onClick={() => setSel(b)}
              className={`cp-pop ${fading ? "cp-balloon-fading" : ""}`}
              style={{
                position: "absolute",
                left: `${b.cafe.x}%`,
                top: `${18 + b.cafe.y * 0.7 - 13}%`,
                marginLeft: b.dx,
                marginTop: b.dy,
                transform: "translate(-50%,-100%)",
                background: t.paper,
                border: b.mine ? `2.5px solid ${t.accent}` : "none",
                cursor: "pointer",
                borderRadius: 16, padding: "7px 10px 6px",
                boxShadow: "0 5px 14px rgba(51,33,26,.22)",
                animationDelay: `${i * 90}ms`,
                zIndex: b.mine ? 12 : 10,
              }}
            >
              <div className="cp-bob" style={{ display: "flex", alignItems: "center", gap: 7, animationDelay: `${i * 400}ms` }}>
                <span className="cp-sticker-sm" style={{ fontSize: 24 }}>{b.emoji}</span>
                <div style={{ textAlign: "left" }}>
                  <div className="cp-display" style={{ fontSize: 11, fontWeight: 600, color: b.mine ? t.accent : t.ink, lineHeight: 1.1 }}>{b.user}</div>
                  <div style={{ fontSize: 9, color: t.sub, fontWeight: 800 }}>🎈 {fakeMin} min</div>
                </div>
              </div>
              <div style={{ position: "absolute", bottom: -7, left: "50%", transform: "translateX(-50%)", width: 0, height: 0, borderLeft: "7px solid transparent", borderRight: "7px solid transparent", borderTop: `8px solid ${b.mine ? t.accent : t.paper}` }} />
              <div style={{ height: 3, borderRadius: 2, background: t.accentSoft, marginTop: 5, overflow: "hidden" }}>
                <div style={{ height: "100%", width: `${pct * 100}%`, background: t.accent, transition: "width 1s linear" }} />
              </div>
            </button>
          );
        })}
      </div>

      {sel && (() => {
        const remain = Math.max(0, sel.life - (now - sel.born));
        const gone = remain <= 0;
        const fakeMin = Math.max(1, Math.round((remain / sel.life) * 60));
        return (
          <div className="cp-pop" style={{ position: "relative", marginTop: 14, background: t.paper, borderRadius: 18, padding: "14px 16px", boxShadow: "0 4px 14px rgba(51,33,26,.14)", border: `2px dashed ${t.accentSoft}` }}>
            <Tape t={t} />
            <button onClick={() => setSel(null)} aria-label="chiudi" style={{ position: "absolute", top: 10, right: 10, border: "none", background: t.accentSoft, borderRadius: 10, width: 26, height: 26, cursor: "pointer", color: t.ink }}><X size={14} /></button>
            <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
              <span className="cp-sticker" style={{ fontSize: 46, transform: "rotate(-5deg)" }}>{sel.emoji}</span>
              <div>
                <div className="cp-display" style={{ fontWeight: 700, fontSize: 16, color: t.ink }}>{sel.user} {sel.mine && <span style={{ fontSize: 11, color: t.accent }}>· il tuo 🎈</span>}</div>
                <div style={{ fontSize: 12, color: t.sub, fontWeight: 700 }}><MapPin size={11} style={{ display: "inline", verticalAlign: -1 }} /> {sel.cafe.name} · {sel.cafe.zone}</div>
                <div style={{ fontSize: 13.5, color: t.ink, marginTop: 4, fontWeight: 600 }}>“{sel.text}”</div>
                <div style={{ fontSize: 11, color: t.accent, fontWeight: 800, marginTop: 4 }}>{gone ? "puff… svanito 🫧" : `svanisce tra ~${fakeMin} min 🎈`}</div>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
}

/* ═══════════════ 3 · PASSAPORTO ═══════════════ */

const STAMP_COLORS_IDX = ["accent", "green", "blue"];

function Passaporto({ t, mode, isPublic, setIsPublic }) {
  return (
    <div style={{ padding: "0 16px 110px" }}>
      {/* cover */}
      <div style={{ marginTop: 18, background: `linear-gradient(150deg, ${t.ink}, #1d110b)`, borderRadius: 22, padding: "22px 20px", color: t.bg, textAlign: "center", boxShadow: "0 6px 18px rgba(51,33,26,.3)", position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", inset: 10, border: `1.5px solid rgba(248,239,221,.35)`, borderRadius: 16, pointerEvents: "none" }} />
        <div className="cp-display" style={{ letterSpacing: 3, fontSize: 11, opacity: 0.8, fontWeight: 500 }}>LA COLLEZIONE {mode === "caffe" ? "CAFFÈ" : "GELATO"}</div>
        <div style={{ fontSize: 44, margin: "8px 0" }} className="cp-sticker">{mode === "caffe" ? "☕" : "🍦"}</div>
        <div className="cp-display" style={{ fontSize: 21, fontWeight: 700 }}>Stickerbook</div>
        <div style={{ fontSize: 12, opacity: 0.75, fontWeight: 700, marginTop: 2 }}>Seojung · Milano 🇮🇹</div>
      </div>

      {/* diario pubblico/privato */}
      <div style={{ marginTop: 12, background: t.paper, borderRadius: 16, padding: "12px 14px", display: "flex", alignItems: "center", gap: 12, boxShadow: "0 2px 8px rgba(51,33,26,.08)" }}>
        <span style={{ fontSize: 24 }}>{isPublic ? "🌍" : "🔒"}</span>
        <div style={{ flex: 1 }}>
          <div className="cp-display" style={{ fontWeight: 600, fontSize: 14, color: t.ink }}>{isPublic ? "Share Page" : "Private Page"}</div>
          <div style={{ fontSize: 11.5, color: t.sub, fontWeight: 700 }}>{isPublic ? "others can flip through your stickers" : "only you can see your diary (default)"}</div>
        </div>
        <button onClick={() => setIsPublic(!isPublic)} aria-label="cambia visibilità" style={{ border: "none", cursor: "pointer", width: 46, height: 26, borderRadius: 14, background: isPublic ? t.accent : t.accentSoft, position: "relative", transition: "background .2s" }}>
          <span style={{ position: "absolute", top: 3, left: isPublic ? 23 : 3, width: 20, height: 20, borderRadius: "50%", background: "#fff", transition: "left .25s cubic-bezier(.34,1.56,.64,1)", boxShadow: "0 1px 3px rgba(51,33,26,.3)" }} />
        </button>
      </div>

      {/* stamps */}
      <div className="cp-display" style={{ margin: "18px 4px 8px", fontSize: 15, fontWeight: 600, color: t.ink }}>Sticker collection</div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 10 }}>
        {STAMPS.map((s, i) => {
          const col = t[STAMP_COLORS_IDX[s.color]];
          return (
            <div key={s.zone} style={{
              aspectRatio: "1", borderRadius: "50%", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
              transform: `rotate(${s.rot}deg)`,
              border: s.got ? `2.5px solid ${col}` : `2px dashed rgba(0,0,0,.18)`,
              color: s.got ? col : "rgba(0,0,0,.28)",
              background: s.got ? t.paper : "transparent",
              boxShadow: s.got ? "0 2px 8px rgba(51,33,26,.10)" : "none",
              opacity: s.got ? 1 : 0.8,
            }}>
              <div style={{ fontSize: 15 }}>{s.got ? (mode === "caffe" ? "☕" : "🍦") : "🔒"}</div>
              <div className="cp-display" style={{ fontSize: 10.5, fontWeight: 700, textAlign: "center", lineHeight: 1.05, padding: "0 4px" }}>{s.zone}</div>
              <div style={{ fontSize: 9, fontWeight: 800 }}>{s.got ? `×${s.n}` : "da sbloccare"}</div>
            </div>
          );
        })}
      </div>

      {/* badges */}
      <div className="cp-display" style={{ margin: "18px 4px 8px", fontSize: 15, fontWeight: 600, color: t.ink }}>Keepsakes</div>
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {BADGES.map((b, i) => (
          <div key={b.name} style={{ background: t.paper, borderRadius: 16, padding: "11px 14px", display: "flex", alignItems: "center", gap: 12, boxShadow: "0 2px 8px rgba(51,33,26,.08)", opacity: b.done || (b.prog && b.prog[0] > 0) ? 1 : 0.55 }}>
            <span className="cp-sticker-sm" style={{ fontSize: 26, transform: `rotate(${tiltFor(i)}deg)` }}>{b.emoji}</span>
            <div style={{ flex: 1 }}>
              <div className="cp-display" style={{ fontWeight: 600, fontSize: 14, color: t.ink }}>{b.name}</div>
              <div style={{ fontSize: 11.5, color: t.sub, fontWeight: 700 }}>{b.desc}</div>
              {b.prog && (
                <div style={{ height: 5, borderRadius: 3, background: t.accentSoft, marginTop: 5, overflow: "hidden" }}>
                  <div style={{ height: "100%", width: `${(b.prog[0] / b.prog[1]) * 100}%`, background: t.accent, borderRadius: 3 }} />
                </div>
              )}
            </div>
            <div className="cp-display" style={{ fontSize: 12, fontWeight: 700, color: b.done ? t.green : t.sub }}>
              {b.done ? "fatto!" : b.prog ? `${b.prog[0]}/${b.prog[1]}` : ""}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ═══════════════ 4 · LOG FLOW (foto → ritaglio → sticker) ═══════════════ */

function LogModal({ t, mode, onClose, onSave, decos }) {
  const [step, setStep] = useState("pick");   // pick → cut → deco
  const [drink, setDrink] = useState(null);
  const [hearts, setHearts] = useState(0);
  const [cafe, setCafe] = useState(null);
  const [deco, setDeco] = useState([]);
  const [share, setShare] = useState(false);
  const drinks = DRINKS[mode];
  const cafes = CAFES.filter((c) => (mode === "gelato" ? c.kind === "gelato" : true)).slice(0, 4);

  useEffect(() => {
    if (step === "cut") {
      const id = setTimeout(() => setStep("deco"), 1900);
      return () => clearTimeout(id);
    }
  }, [step]);

  const toggleDeco = (d) =>
    setDeco((ds) => (ds.includes(d) ? ds.filter((x) => x !== d) : ds.length < 3 ? [...ds, d] : ds));

  const save = () => {
    onSave(
      { emoji: drink.emoji, name: drink.name, cafe: cafe?.name || "Bar misterioso", cafeObj: cafe, time: "adesso", hearts: hearts || 5, deco },
      share && !!cafe
    );
  };

  const checker = `repeating-conic-gradient(rgba(0,0,0,.06) 0% 25%, transparent 0% 50%) 0 0 / 22px 22px`;

  return (
    <div style={{ position: "absolute", inset: 0, background: t.bg, zIndex: 50, display: "flex", flexDirection: "column" }} className="cp-fadeup">
      {/* top bar */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 16px 6px" }}>
        <button onClick={step === "deco" ? () => setStep("pick") : onClose} aria-label="indietro" style={{ border: "none", background: t.paper, borderRadius: 12, width: 34, height: 34, cursor: "pointer", color: t.ink, boxShadow: "0 2px 6px rgba(51,33,26,.1)" }}>
          {step === "pick" ? <X size={17} /> : <ChevronLeft size={18} />}
        </button>
        <div className="cp-display" style={{ fontWeight: 700, color: t.ink, fontSize: 16 }}>
          {step === "pick" && "Cosa hai davanti? 📸"}
          {step === "cut" && "Ritaglio magico…"}
          {step === "deco" && "Decora lo sticker"}
        </div>
        <div style={{ width: 34 }} />
      </div>

      {/* STEP 1: viewfinder + pick */}
      {step === "pick" && (
        <div style={{ flex: 1, padding: "8px 18px 20px", overflowY: "auto" }} className="cp-scroll">
          <div style={{ position: "relative", borderRadius: 20, background: "#2a1c14", height: 190, display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden" }}>
            {[["top","left"],["top","right"],["bottom","left"],["bottom","right"]].map(([v, h]) => (
              <div key={v + h} style={{ position: "absolute", [v]: 12, [h]: 12, width: 22, height: 22, [`border${v[0].toUpperCase() + v.slice(1)}`]: "3px solid #fff", [`border${h[0].toUpperCase() + h.slice(1)}`]: "3px solid #fff", opacity: 0.9, borderRadius: 2 }} />
            ))}
            <span style={{ fontSize: 74, filter: "saturate(1.1)" }}>{drink ? drink.emoji : mode === "caffe" ? "☕" : "🍦"}</span>
            {mode === "caffe" && !drink && (
              <>
                <span style={{ position: "absolute", fontSize: 15, marginTop: -74, animation: "cp-steam 2.4s ease-in-out infinite" }}>💨</span>
                <span style={{ position: "absolute", fontSize: 12, marginTop: -74, marginLeft: 26, animation: "cp-steam 2.4s ease-in-out .8s infinite" }}>💨</span>
              </>
            )}
            <div style={{ position: "absolute", bottom: 10, color: "rgba(255,255,255,.7)", fontSize: 11, fontWeight: 700 }}>
              <Camera size={12} style={{ display: "inline", verticalAlign: -2 }} /> nel prototipo scegli un emoji ↓
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 10, marginTop: 16 }}>
            {drinks.map((d) => (
              <button key={d.name} onClick={() => setDrink(d)} style={{
                border: drink?.name === d.name ? `2.5px solid ${t.accent}` : "2.5px solid transparent",
                background: t.paper, borderRadius: 16, padding: "12px 6px 10px", cursor: "pointer",
                boxShadow: "0 2px 8px rgba(51,33,26,.08)",
              }}>
                <div style={{ fontSize: 32 }}>{d.emoji}</div>
                <div className="cp-display" style={{ fontSize: 12, fontWeight: 600, color: t.ink, marginTop: 4 }}>{d.name}</div>
                <div style={{ fontSize: 9.5, color: t.sub, fontWeight: 700 }}>{d.tag}</div>
              </button>
            ))}
          </div>

          <button
            disabled={!drink}
            onClick={() => setStep("cut")}
            className="cp-display"
            style={{
              width: "100%", marginTop: 18, padding: "15px 0", borderRadius: 18, border: "none",
              background: drink ? t.accent : t.accentSoft, color: drink ? "#fff" : t.sub,
              fontSize: 16, fontWeight: 700, cursor: drink ? "pointer" : "default",
              boxShadow: drink ? "0 5px 14px rgba(200,51,27,.35)" : "none", transition: "all .2s",
            }}
          >
            📷 Scatta!
          </button>
        </div>
      )}

      {/* STEP 2: cutout animation */}
      {step === "cut" && (
        <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 18 }}>
          <div style={{ position: "relative", width: 200, height: 200, borderRadius: 24, background: checker, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <svg width="200" height="200" style={{ position: "absolute", inset: 0 }} aria-hidden>
              <circle cx="100" cy="100" r="72" fill="none" stroke={t.accent} strokeWidth="3" strokeDasharray="10 10" style={{ animation: "cp-dash 1.2s linear infinite" }} />
            </svg>
            <span style={{ fontSize: 88 }}>{drink.emoji}</span>
            <span style={{ position: "absolute", top: 8, right: 14, fontSize: 26, animation: "cp-wiggle .5s ease-in-out infinite" }}>✂️</span>
          </div>
          <div className="cp-display" style={{ color: t.sub, fontWeight: 600, fontSize: 14 }}>sfondo via, resta solo il bello ✨</div>
        </div>
      )}

      {/* STEP 3: decorate + save */}
      {step === "deco" && (
        <div style={{ flex: 1, padding: "4px 18px 20px", overflowY: "auto" }} className="cp-scroll">
          <div style={{ textAlign: "center", padding: "10px 0 4px" }}>
            <span className="cp-sticker cp-pop" style={{ fontSize: 96, display: "inline-block", transform: "rotate(-5deg)" }}>{drink.emoji}</span>
            <div style={{ marginTop: 2, fontSize: 20, minHeight: 26 }}>{deco.map((d, i) => <span key={i} className="cp-sticker-sm" style={{ margin: "0 3px", display: "inline-block", transform: `rotate(${tiltFor(i + 5)}deg)` }}>{d}</span>)}</div>
            <div className="cp-display" style={{ fontWeight: 700, color: t.ink, fontSize: 17 }}>{drink.name}</div>
          </div>

          <div className="cp-display" style={{ fontSize: 13, fontWeight: 600, color: t.sub, margin: "10px 2px 6px" }}>Quanto era buono?</div>
          <Hearts n={hearts} onPick={setHearts} t={t} />

          <div className="cp-display" style={{ fontSize: 13, fontWeight: 600, color: t.sub, margin: "14px 2px 6px" }}>Dove sei? <MapPin size={12} style={{ display: "inline", verticalAlign: -1 }} /></div>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {cafes.map((c) => (
              <button key={c.id} onClick={() => setCafe(c)} className="cp-display" style={{
                border: "none", borderRadius: 999, padding: "8px 13px", cursor: "pointer", fontSize: 12.5, fontWeight: 600,
                background: cafe?.id === c.id ? t.ink : t.paper, color: cafe?.id === c.id ? t.bg : t.ink,
                boxShadow: "0 2px 6px rgba(51,33,26,.08)",
              }}>{c.name}</button>
            ))}
          </div>

          <div className="cp-display" style={{ fontSize: 13, fontWeight: 600, color: t.sub, margin: "14px 2px 6px" }}>Stickerini extra (max 3)</div>
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
            {decos.map((d) => (
              <button key={d} onClick={() => toggleDeco(d)} style={{
                width: 42, height: 42, borderRadius: 12, fontSize: 20, cursor: "pointer",
                border: deco.includes(d) ? `2.5px solid ${t.accent}` : "2.5px solid transparent",
                background: t.paper, boxShadow: "0 2px 6px rgba(51,33,26,.08)",
              }}>{d}</button>
            ))}
          </div>

          {/* palloncino opt-in, per singolo sticker */}
          <div
            onClick={() => cafe && setShare(!share)}
            role="switch"
            aria-checked={share}
            style={{ marginTop: 16, background: t.paper, borderRadius: 16, padding: "11px 14px", display: "flex", alignItems: "center", gap: 11, boxShadow: "0 2px 8px rgba(51,33,26,.08)", opacity: cafe ? 1 : 0.5, cursor: cafe ? "pointer" : "default" }}
          >
            <span style={{ fontSize: 22 }}>🎈</span>
            <div style={{ flex: 1 }}>
              <div className="cp-display" style={{ fontWeight: 600, fontSize: 13.5, color: t.ink }}>Palloncino in mappa</div>
              <div style={{ fontSize: 11, color: t.sub, fontWeight: 700 }}>
                {!cafe ? "scegli prima il bar ↑" : share ? "1 ora, poi puff — nessuna cronologia" : "solo nel tuo diario"}
              </div>
            </div>
            <span style={{ width: 42, height: 24, borderRadius: 13, background: share ? t.accent : t.accentSoft, position: "relative", transition: "background .2s", flexShrink: 0 }}>
              <span style={{ position: "absolute", top: 3, left: share ? 21 : 3, width: 18, height: 18, borderRadius: "50%", background: "#fff", transition: "left .25s cubic-bezier(.34,1.56,.64,1)" }} />
            </span>
          </div>

          <button onClick={save} className="cp-display" style={{
            width: "100%", marginTop: 12, padding: "15px 0", borderRadius: 18, border: "none",
            background: t.accent, color: "#fff", fontSize: 16, fontWeight: 700, cursor: "pointer",
            boxShadow: "0 5px 14px rgba(200,51,27,.35)",
          }}>
            Attacca al diario ✨ <span style={{ fontSize: 12, opacity: .9 }}>(+{share && cafe ? 3 : 2} 🫘)</span>
          </button>
        </div>
      )}
    </div>
  );
}

/* ═══════════════ SHOP (pacchetti sticker · Beans) ═══════════════ */

function ShopSheet({ t, beans, owned, onBuy, onClose }) {
  return (
    <div onClick={onClose} style={{ position: "absolute", inset: 0, background: "rgba(51,33,26,.35)", zIndex: 45, display: "flex", alignItems: "flex-end" }}>
      <div onClick={(e) => e.stopPropagation()} className="cp-fadeup" style={{ width: "100%", background: t.bg, borderRadius: "24px 24px 0 0", padding: "10px 18px 26px", maxHeight: "75%", overflowY: "auto" }}>
        <div style={{ width: 40, height: 5, background: t.accentSoft, borderRadius: 3, margin: "4px auto 12px" }} />
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 4 }}>
          <div className="cp-display" style={{ fontSize: 19, fontWeight: 700, color: t.ink }}>Bottega degli sticker</div>
          <div className="cp-display" style={{ fontSize: 14, fontWeight: 700, color: t.accent }}>🫘 {beans}</div>
        </div>
        <div style={{ fontSize: 11.5, color: t.sub, fontWeight: 700, marginBottom: 12 }}>guadagni Beans attaccando sticker (+2, +3 col palloncino)</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {PACKS.map((p) => {
            const got = owned.includes(p.id);
            const can = beans >= p.price;
            return (
              <div key={p.id} style={{ background: t.paper, borderRadius: 16, padding: "12px 14px", display: "flex", alignItems: "center", gap: 12, boxShadow: "0 2px 8px rgba(51,33,26,.08)", border: p.limited ? `2px dashed ${t.accent}` : "none" }}>
                <div style={{ fontSize: 22, letterSpacing: 2 }}>{p.items.join("")}</div>
                <div style={{ flex: 1 }}>
                  <div className="cp-display" style={{ fontWeight: 600, fontSize: 14, color: t.ink }}>{p.name}</div>
                  {p.limited && <div style={{ fontSize: 10.5, color: t.accent, fontWeight: 800 }}>⏳ solo fino al 20 agosto, poi sparisce</div>}
                </div>
                <button
                  onClick={() => !got && onBuy(p)}
                  disabled={got}
                  className="cp-display"
                  style={{
                    border: "none", borderRadius: 999, padding: "9px 14px", fontSize: 12.5, fontWeight: 700,
                    cursor: got ? "default" : "pointer",
                    background: got ? t.greenSoft : can ? t.accent : t.accentSoft,
                    color: got ? t.green : can ? "#fff" : t.sub,
                  }}
                >
                  {got ? "tuo ✓" : `${p.price} 🫘`}
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

/* ═══════════════ STICKERBOOK OVERLAY (mock tray · pages) ═══════════════ */

function StickerbookSheet({ t, page, setPage, onPick, onClose }) {
  const pages = Math.ceil(STICKER_ASSETS.length / BOOK_PAGE_SIZE);
  const items = STICKER_ASSETS.slice(page * BOOK_PAGE_SIZE, page * BOOK_PAGE_SIZE + BOOK_PAGE_SIZE);
  const pageBtn = (disabled) => ({
    border: "none", borderRadius: 999, width: 34, height: 34, fontSize: 17, fontWeight: 700,
    cursor: disabled ? "default" : "pointer",
    background: disabled ? "transparent" : t.paper,
    color: disabled ? "rgba(0,0,0,.2)" : t.ink,
    boxShadow: disabled ? "none" : "0 2px 6px rgba(51,33,26,.1)",
  });
  return (
    <div onClick={onClose} style={{ position: "absolute", inset: 0, background: "rgba(51,33,26,.35)", zIndex: 45, display: "flex", alignItems: "flex-end" }}>
      <div onClick={(e) => e.stopPropagation()} className="cp-fadeup" style={{ width: "100%", background: t.bg, borderRadius: "24px 24px 0 0", padding: "10px 18px 22px", maxHeight: "75%", overflowY: "auto", position: "relative" }}>
        <div style={{ width: 40, height: 5, background: t.accentSoft, borderRadius: 3, margin: "4px auto 12px" }} />
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div className="cp-display" style={{ fontSize: 19, fontWeight: 700, color: t.ink }}>Stickerbook 📒</div>
          <button onClick={onClose} aria-label="close stickerbook" style={{ border: "none", background: t.accentSoft, borderRadius: 10, width: 26, height: 26, cursor: "pointer", color: t.ink }}><X size={14} /></button>
        </div>
        <div style={{ fontSize: 11.5, color: t.sub, fontWeight: 700, marginBottom: 12 }}>tap a sticker to peel it, then stick it on today's page</div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 10 }}>
          {items.map((a, i) => (
            <button key={a.id} onClick={() => onPick(a)} style={{
              border: "none", background: t.paper, borderRadius: 16, padding: "12px 4px 9px",
              cursor: "pointer", boxShadow: "0 2px 8px rgba(51,33,26,.08)",
            }}>
              <span className="cp-sticker-sm" style={{ fontSize: 28, display: "inline-block", transform: `rotate(${tiltFor(i + page * BOOK_PAGE_SIZE)}deg)` }}>{a.content}</span>
              <span className="cp-display" style={{ display: "block", fontSize: 10, fontWeight: 600, color: t.ink, marginTop: 5, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{a.name}</span>
            </button>
          ))}
        </div>

        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 14, marginTop: 14 }}>
          <button onClick={() => setPage(page - 1)} disabled={page === 0} aria-label="previous page" className="cp-display" style={pageBtn(page === 0)}>‹</button>
          <span className="cp-display" style={{ fontSize: 12.5, fontWeight: 600, color: t.sub }}>Page {page + 1} / {pages}</span>
          <button onClick={() => setPage(page + 1)} disabled={page >= pages - 1} aria-label="next page" className="cp-display" style={pageBtn(page >= pages - 1)}>›</button>
        </div>
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
  return { version: 2, entries: v1.entries, beans: v1.beans, ownedPacks: v1.ownedPacks, pageStickers };
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
  const [mode, setMode] = useState("caffe");
  const [tab, setTab] = useState("diario");
  const [entries, setEntries] = useState(saved?.entries ?? SEED_ENTRIES);
  const [logOpen, setLogOpen] = useState(false);
  const [openDay, setOpenDay] = useState(null);
  const [toast, setToast] = useState(null);
  const [beans, setBeans] = useState(saved?.beans ?? 12);
  const [ownedPacks, setOwnedPacks] = useState(saved?.ownedPacks ?? []);
  const [shopOpen, setShopOpen] = useState(false);
  const [isPublic, setIsPublic] = useState(false);

  /* stickerbook overlay — local prototype state only.
     assets live in STICKER_ASSETS; these are placed *instances*. */
  const [bookOpen, setBookOpen] = useState(false);
  const [bookPage, setBookPage] = useState(0);
  const [placingSticker, setPlacingSticker] = useState(null); // peeled asset waiting for a tap on the page
  const [pageStickers, setPageStickers] = useState(saved?.pageStickers ?? []); // instances stuck on today's diary page
  // resume ids past the highest restored one so new placements never collide
  const placedIdRef = useRef((saved?.pageStickers?.reduce((m, s) => Math.max(m, s.id), 0) ?? 0) + 1);

  const t = THEMES[mode];

  /* palloncini: stato a livello app così sopravvivono al cambio tab */
  const [balloons, setBalloons] = useState(() => {
    const n = Date.now();
    return [
      { ...FRIENDS[0], id: 1, cafe: CAFES[1], born: n - 4000, life: BALLOON_LIFE() },
      { ...FRIENDS[2], id: 2, cafe: CAFES[1], born: n - 12000, life: BALLOON_LIFE() },
      { ...FRIENDS[5], id: 3, cafe: CAFES[1], born: n - 20000, life: BALLOON_LIFE() },
      { ...FRIENDS[3], id: 4, cafe: CAFES[4], born: n - 8000, life: BALLOON_LIFE() },
    ];
  });
  const [now, setNow] = useState(Date.now());
  const nextId = useRef(5);

  useEffect(() => {
    const tick = setInterval(() => setNow(Date.now()), 1000);
    const spawn = setInterval(() => {
      setBalloons((bs) => (bs.length >= 7 ? bs : [...bs, makeBalloon(nextId.current++)]));
    }, 9000);
    return () => { clearInterval(tick); clearInterval(spawn); };
  }, []);

  useEffect(() => {
    setBalloons((bs) => bs.filter((b) => now - b.born < b.life));
  }, [now]);

  /* persist durable state on change (single versioned blob) */
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ version: 2, entries, beans, ownedPacks, pageStickers }));
    } catch {
      // ignore write failures (quota exceeded / private mode)
    }
  }, [entries, beans, ownedPacks, pageStickers]);

  const decos = [...DECOS, ...ownedPacks.flatMap((id) => PACKS.find((p) => p.id === id).items)];

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(null), 2400); };

  const saveEntry = (e, share) => {
    const gain = share ? 3 : 2;
    setEntries((es) => ({ ...es, [TODAY]: [...(es[TODAY] || []), e] }));
    setBeans((b) => b + gain);
    if (share && e.cafeObj) {
      setBalloons((bs) => [...bs, { id: nextId.current++, user: "Tu", emoji: e.emoji, text: `${e.name}, adesso ✨`, cafe: e.cafeObj, born: Date.now(), life: BALLOON_LIFE(), mine: true }]);
    }
    setLogOpen(false);
    setTab(share && e.cafeObj ? "mappa" : "diario");
    showToast(`${e.emoji} attaccato! +${gain} 🫘`);
  };

  const buyPack = (p) => {
    if (beans < p.price) { showToast("Beans non bastano… attacca sticker! 🫘"); return; }
    setBeans((b) => b - p.price);
    setOwnedPacks((o) => [...o, p.id]);
    showToast(`${p.items[0]} pack "${p.name}" sbloccato!`);
  };

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
    const asset = s && getAsset(s.assetId);
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

        {/* header: wordmark + beans + mode toggle */}
        <div style={{ position: "absolute", top: 0, left: 0, right: 0, zIndex: 30, display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 16px 10px", background: t.bg, boxShadow: `0 8px 12px -10px rgba(51,33,26,.15)` }}>
          <div>
            <span className="cp-display" style={{ fontSize: 21, fontWeight: 700, color: t.ink }}>Momenti</span>
            <span className="cp-display" style={{ fontSize: 10, fontWeight: 600, color: t.sub, marginLeft: 6, letterSpacing: 1 }}>STICKER DIARY</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <button onClick={() => setShopOpen(true)} aria-label="bottega sticker" className="cp-display" style={{ border: "none", borderRadius: 999, padding: "6px 11px", cursor: "pointer", background: t.paper, boxShadow: "0 2px 8px rgba(51,33,26,.12)", fontSize: 12.5, fontWeight: 700, color: t.ink }}>
              🫘 {beans}
            </button>
            <button onClick={() => setMode(mode === "caffe" ? "gelato" : "caffe")} aria-label="cambia modalità" className="cp-display" style={{
              border: "none", borderRadius: 999, padding: "6px 10px", cursor: "pointer",
              background: t.paper, boxShadow: "0 2px 8px rgba(51,33,26,.12)",
              fontSize: 12, fontWeight: 700, color: t.ink, display: "flex", alignItems: "center", gap: 5,
            }}>
              <span style={{ opacity: mode === "caffe" ? 1 : 0.35 }}>☕</span>
              <span style={{ width: 24, height: 14, borderRadius: 8, background: t.accentSoft, position: "relative" }}>
                <span style={{ position: "absolute", top: 2, left: mode === "caffe" ? 2 : 12, width: 10, height: 10, borderRadius: "50%", background: t.accent, transition: "left .25s cubic-bezier(.34,1.56,.64,1)" }} />
              </span>
              <span style={{ opacity: mode === "gelato" ? 1 : 0.35 }}>🍦</span>
            </button>
          </div>
        </div>

        {/* screens */}
        <div style={{ height: "100vh", overflowY: "auto", paddingTop: 50 }} className="cp-scroll">
          {tab === "diario" && (
            <Diario
              t={t} mode={mode} entries={entries} openDay={openDay} setOpenDay={setOpenDay}
              onOpenBook={() => setBookOpen(true)}
              placing={placingSticker} onCancelPlacing={() => setPlacingSticker(null)}
              pageStickers={pageStickers} onPlaceAt={placeSticker}
              onReturn={returnPlaced} onDuplicate={duplicatePlaced} onRemove={removePlaced}
            />
          )}
          {tab === "mappa" && <Mappa t={t} mode={mode} balloons={balloons} now={now} />}
          {tab === "passaporto" && <Passaporto t={t} mode={mode} isPublic={isPublic} setIsPublic={setIsPublic} />}
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
            <TabBtn id="mappa" icon={MapIcon} label="Map" />
            <div style={{ width: 66 }} />
            <TabBtn id="passaporto" icon={Stamp} label="Stickerbook" />
            <div style={{ flex: 1 }} />
            <button onClick={() => setLogOpen(true)} aria-label="aggiungi sticker" style={{
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
        <DaySheet day={openDay} entries={entries} t={t} onClose={() => setOpenDay(null)} />
        {bookOpen && <StickerbookSheet t={t} page={bookPage} setPage={setBookPage} onPick={pickFromBook} onClose={() => setBookOpen(false)} />}
        {shopOpen && <ShopSheet t={t} beans={beans} owned={ownedPacks} onBuy={buyPack} onClose={() => setShopOpen(false)} />}
        {logOpen && <LogModal t={t} mode={mode} decos={decos} onClose={() => setLogOpen(false)} onSave={saveEntry} />}
      </div>
    </div>
  );
}
