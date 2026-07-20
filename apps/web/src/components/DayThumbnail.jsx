// ─────────────────────────────────────────────────────────────
//  Momenti · DayThumbnail — read-only day preview for calendar cells.
//
//  Shows a small representative of a day page's content in month cells
//  and the week nav strip (§D2). It reuses the ONE shared StickerVisual
//  so paper/glitter materiality matches everywhere; the selection rule
//  lives in ../data/dayThumbnail (shared by both surfaces — never fork).
//
//  Decorative only: aria-hidden + pointer-events:none so it never steals
//  the date button's click target, focus, or screen-reader label. The
//  sticker renders upright (stored rotation/scale ignored) so it stays
//  legible in a tiny cell — the die-cut edge carries the materiality.
// ─────────────────────────────────────────────────────────────
import { PenLine } from "lucide-react";
import StickerVisual from "./StickerVisual";
import { pickDayThumbnail } from "../data/dayThumbnail";

/**
 * @param {Object} props
 * @param {import("../data/pageElements").PageElement[]} props.elements - the day page's elements
 * @param {(assetId: string) => (object|undefined)} props.resolveAsset
 * @param {number} [props.size]      - sticker emoji size in px (default 18)
 * @param {string} [props.subColor]  - ink for the text-only mark
 * @param {Object} [props.style]     - positioning applied to the decorative wrapper
 */
export default function DayThumbnail({ elements, resolveAsset, size = 18, subColor, style }) {
  const rep = pickDayThumbnail(elements, resolveAsset);
  if (!rep) return null; // empty / unrepresentable day → keep the plain cell
  return (
    <span
      aria-hidden
      style={{
        pointerEvents: "none", lineHeight: 1,
        display: "inline-flex", alignItems: "center", justifyContent: "center",
        ...style,
      }}
    >
      {rep.kind === "sticker" ? (
        <StickerVisual asset={rep.asset} size={size} />
      ) : (
        <PenLine size={Math.round(size * 0.72)} color={subColor} strokeWidth={2.2} />
      )}
    </span>
  );
}
