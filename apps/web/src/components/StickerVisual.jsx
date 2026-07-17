// ─────────────────────────────────────────────────────────────
//  Momenti · StickerVisual — the ONE shared sticker renderer.
//
//  Every surface that shows a sticker (diary page, Stickerbook tray,
//  creator preview, placing hint) renders through this so paper vs
//  glitter looks identical everywhere.
//
//  paper   → thin white die-cut edge + soft warm shadow (existing look).
//  glitter → slightly thicker white edge + an animated holographic sheen.
//
//  The CSS classes used here (.cp-sticker, .cp-sticker-sm,
//  .cp-sticker-glit, .cp-glitter-sheen) and the reduced-motion handling
//  (static sheen) live in App.jsx's GlobalStyle.
// ─────────────────────────────────────────────────────────────

/**
 * @param {Object} props
 * @param {{ content: string, texture?: "paper"|"glitter" }} props.asset
 * @param {number} [props.size] - emoji font-size in px (default 30)
 */
export default function StickerVisual({ asset, size = 30 }) {
  if (!asset) return null;
  const glitter = asset.texture === "glitter";
  // paper edge scales with size to match the pre-existing look (thin under 30px)
  const edgeClass = glitter ? "cp-sticker-glit" : size >= 30 ? "cp-sticker" : "cp-sticker-sm";
  return (
    <span style={{ position: "relative", display: "inline-block", lineHeight: 1 }}>
      <span className={edgeClass} style={{ fontSize: size, lineHeight: 1 }}>{asset.content}</span>
      {glitter && <span aria-hidden className="cp-glitter-sheen" />}
    </span>
  );
}
