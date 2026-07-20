// ─────────────────────────────────────────────────────────────
//  Momenti · day-thumbnail selection (pure, read-only · §D2).
//
//  Derives a calendar cell's representative preview from a day page's
//  LIVE PageElements every render. Nothing is stored — no thumbnail
//  field, no cached image. The day page's elements are the single
//  source of truth (§D3·D4). Photo stickers do not exist yet, so the
//  representative content priority is:
//
//    1. the topmost VALID sticker element
//    2. else, if any non-empty text element exists → a text-only mark
//    3. else → nothing (the cell stays empty)
//
//  "Valid sticker" = type "sticker" whose asset still resolves (a
//  removed/unknown user asset is skipped, so a deleted top sticker
//  falls through to the next valid one). The input array is never
//  mutated (no in-place .sort()).
// ─────────────────────────────────────────────────────────────

/** @typedef {{ kind: "sticker", asset: import("./stickers").StickerAsset } | { kind: "text" }} DayThumbnail */

/**
 * Pick a day cell's representative thumbnail from its page elements.
 * @param {import("./pageElements").PageElement[]} elements - the day page's elements
 * @param {(assetId: string) => (object|undefined)} resolveAsset - asset lookup (guards missing assets)
 * @returns {DayThumbnail | null} null when the day has no representable content
 */
export function pickDayThumbnail(elements, resolveAsset) {
  if (!Array.isArray(elements) || elements.length === 0) return null;

  let sticker = null;   // best valid sticker so far: { asset, z }
  let hasText = false;  // any text element with non-whitespace content

  // single forward pass; a malformed element never throws or aborts the loop
  elements.forEach((el) => {
    if (!el) return;
    if (el.type === "sticker") {
      const asset = el.assetId ? resolveAsset(el.assetId) : undefined;
      if (!asset) return; // removed/unknown asset → not a candidate
      const z = Number.isFinite(el.z) ? el.z : 0;
      // topmost wins: higher z beats lower; on a tie, the later element in
      // the array wins (>=), matching the render stacking order.
      if (!sticker || z >= sticker.z) sticker = { asset, z };
    } else if (el.type === "text") {
      if (typeof el.content === "string" && el.content.trim() !== "") hasText = true;
    }
  });

  if (sticker) return { kind: "sticker", asset: sticker.asset };
  if (hasText) return { kind: "text" };
  return null;
}
