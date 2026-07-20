// ─────────────────────────────────────────────────────────────
//  Momenti · PageElement — the ONE element model for deco surfaces (§D3).
//
//  Every decoratable surface (monthly spread, full-screen day page)
//  holds a flat list of PageElements. Future element kinds (photo,
//  tape, doodle…) are added as new `type` values on this model —
//  NEVER as parallel systems.
//
//  type payloads:
//    "sticker" → { assetId }                              (references StickerAsset.id)
//    "text"    → { content, font, color, sizeLevel }      (day pages only, minimal spec)
// ─────────────────────────────────────────────────────────────

/**
 * One element placed on a deco surface.
 * @typedef {Object} PageElement
 * @property {string} id
 * @property {"sticker"|"text"} type
 * @property {number} x           - percent across the surface (0–100)
 * @property {number} y           - percent down the surface (0–100)
 * @property {number} rotation    - degrees
 * @property {number} scale       - 1 = natural size
 * @property {number} z           - stacking order within the surface
 * @property {string} [assetId]   - sticker payload
 * @property {string} [content]   - text payload: the note text
 * @property {string} [font]      - text payload: font key
 * @property {string} [color]     - text payload: ink color
 * @property {string} [sizeLevel] - text payload: "S" | "M" | "L"
 */

let idCounter = 0;
/** Collision-proof local element id. */
export function newElementId() {
  return `el-${Date.now().toString(36)}-${(idCounter++).toString(36)}`;
}

/**
 * Build a PageElement, filling sensible defaults.
 * Extra type-payload fields (e.g. assetId) pass through.
 * @param {Partial<PageElement>} [init]
 * @returns {PageElement}
 */
export function createPageElement({
  id = newElementId(),
  type = "sticker",
  x = 50,
  y = 50,
  rotation = 0,
  scale = 1,
  z = 0,
  ...payload
} = {}) {
  return { id, type, x, y, rotation, scale, z, ...payload };
}
