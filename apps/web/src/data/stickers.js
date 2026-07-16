// ─────────────────────────────────────────────────────────────
//  Momenti · sticker data model (JSDoc-typed, plain JS)
//
//  StickerAsset   = a reusable sticker *design* (the thing in the book).
//  StickerInstance = one *placement* of an asset on a diary page.
//
//  Instances reference assets by `assetId` and never copy the asset's
//  content — the asset registry is the single source of truth for how a
//  sticker looks. TypeScript migration is intentionally deferred.
// ─────────────────────────────────────────────────────────────

/**
 * A reusable sticker design.
 * @typedef {Object} StickerAsset
 * @property {string} id
 * @property {"emoji"|"image"} kind    - "emoji" for now; "image" reserved for later
 * @property {string} content          - the emoji string (later: an image ref)
 * @property {"paper"|"glitter"} texture
 * @property {"base"|"pack"|"user"} source
 * @property {number} createdAt        - epoch ms (0 = built-in seed)
 * @property {string} [name]           - optional display label for the tray
 */

/**
 * One placed sticker on the diary.
 * @typedef {Object} StickerInstance
 * @property {number|string} id
 * @property {string} assetId          - references StickerAsset.id
 * @property {number} x                - percent across the diary page (0–100)
 * @property {number} y                - percent down the diary page (0–100)
 * @property {number} rotation         - degrees
 * @property {number} scale            - 1 = natural size
 * @property {number} placedAt         - epoch ms
 * @property {string} page             - diary page id the instance is stuck on
 */

/**
 * Build a StickerAsset, filling sensible defaults.
 * @param {Partial<StickerAsset>} [init]
 * @returns {StickerAsset}
 */
export function createStickerAsset({
  id,
  kind = "emoji",
  content,
  texture = "paper",
  source = "base",
  createdAt = Date.now(),
  name,
} = {}) {
  const asset = { id, kind, content, texture, source, createdAt };
  if (name != null) asset.name = name;
  return asset;
}

/**
 * Build a StickerInstance, filling sensible defaults.
 * @param {Partial<StickerInstance>} [init]
 * @returns {StickerInstance}
 */
export function createStickerInstance({
  id,
  assetId,
  x = 50,
  y = 50,
  rotation = 0,
  scale = 1,
  placedAt = Date.now(),
  page,
} = {}) {
  return { id, assetId, x, y, rotation, scale, placedAt, page };
}

/**
 * Convert the app's built-in drink/deco emoji into base StickerAssets.
 * Ids are preserved as caffe-N / gelato-N / deco-N so existing placements
 * (and v1→v2 migrations) keep resolving to the same design.
 *
 * @param {Object} src
 * @param {{emoji: string, name?: string}[]} [src.caffe]
 * @param {{emoji: string, name?: string}[]} [src.gelato]
 * @param {string[]} [src.decos]
 * @param {string[]} [src.decoNames]
 * @returns {StickerAsset[]}
 */
export function seedStickerAssets({ caffe = [], gelato = [], decos = [], decoNames = [] } = {}) {
  const base = (id, content, name) =>
    createStickerAsset({ id, content, name, kind: "emoji", texture: "paper", source: "base", createdAt: 0 });
  return [
    ...caffe.map((d, i) => base(`caffe-${i}`, d.emoji, d.name)),
    ...gelato.map((d, i) => base(`gelato-${i}`, d.emoji, d.name)),
    ...decos.map((e, i) => base(`deco-${i}`, e, decoNames[i])),
  ];
}
