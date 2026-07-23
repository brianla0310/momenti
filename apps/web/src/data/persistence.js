// ─────────────────────────────────────────────────────────────
//  Momenti · persistence — pure parse / validate / migrate logic (§D4).
//
//  This module NEVER touches localStorage. App.jsx owns the browser I/O
//  (getItem / setItem) and delegates every *decision* here, so the parse,
//  shape-validation, and migration rules can be reasoned about (and tested)
//  in isolation.
//
//  The store is one versioned JSON blob under a single key. The key name
//  ("momenti.v1") is intentionally NOT tied to the schema number — the on-disk
//  key stays "momenti.v1" while `version` inside the blob is 3. Do not rename it.
//
//    v3: { version: 3, diaries: [{id,name}], activeDiaryId,
//          pages: { [diaryId]: { [pageKey]: { elements: PageElement[] } } },
//          userAssets, beans, ownedPacks }
//    pageKey: "YYYY-MM" = monthly spread · "YYYY-MM-DD" = day page (local month).
//
//  Safety contract (why this module exists):
//    A blob the current app can't safely understand — a NEWER schema version,
//    an unknown version, malformed JSON, or a broken top-level shape — must be
//    PRESERVED untouched. `resolvePersistedState` reports that as a non-savable
//    result so App.jsx never overwrites the original with an empty v3 blob.
// ─────────────────────────────────────────────────────────────

import { createStickerInstance } from "./stickers";
import { createPageElement } from "./pageElements";

/** localStorage key. Fixed at "momenti.v1" — the schema number lives in `version`. */
export const STORAGE_KEY = "momenti.v1";
/** Current schema version this app reads/writes. Stays 3 in this PR — no v4. */
export const STORAGE_VERSION = 3;
/** Single diary until the multiple-diaries PR (§D4) — structure is already v3-ready. */
export const DIARY_ID = "diary-1";
/** Legacy monthly-spread key: pre-local-date data (v1/v2) lived on the fixed
 *  2026-07 spread. Migrations preserve this historical key verbatim — they never
 *  move old placements onto the current local month. Do not change this value. */
export const LEGACY_MONTH_KEY = "2026-07";

/**
 * Load-result status — how a persisted value was classified:
 *   "empty"       no stored data → start on seed defaults · saving allowed
 *   "ready"       valid current v3 → use as-is · saving allowed
 *   "migrated"    valid v1/v2 migrated to v3 → use · saving allowed
 *   "unsupported" version the app can't read (newer/unknown) → PRESERVE · no auto-save
 *   "invalid"     malformed JSON or unsafe top-level shape → PRESERVE · no auto-save
 * @typedef {"empty"|"ready"|"migrated"|"unsupported"|"invalid"} LoadStatus
 */

/**
 * @typedef {Object} LoadResult
 * @property {LoadStatus} status
 * @property {object|null} data        normalized v3 state, or null when nothing safe to use
 * @property {boolean} canPersist      false ⇒ App must NOT write over the stored value
 */

/** A non-null, non-array object (JSON.parse only yields plain objects here). */
function isPlainObject(v) {
  return v != null && typeof v === "object" && !Array.isArray(v);
}

/**
 * Parse a raw persisted value. A string is JSON-parsed (throws on malformed
 * input — the caller decides policy); an already-parsed value is returned as-is
 * so this doubles as a normalizer entry point for tests. Never touches storage.
 * @param {string|unknown} raw
 * @returns {*}
 */
export function parsePersistedValue(raw) {
  return typeof raw === "string" ? JSON.parse(raw) : raw;
}

/**
 * Minimal top-level shape check for a *current* (v3) state — only the fields the
 * renderer immediately indexes/iterates (`.find`, `.map`, object indexing). This
 * is deliberately NOT a deep per-element schema: it just keeps unsafe types out
 * of the running app, so a normal user's data is never rejected over a detail.
 * Pure — must not mutate `value`.
 * @param {unknown} value
 * @returns {boolean}
 */
export function validateCurrentState(value) {
  if (!isPlainObject(value)) return false;
  if (value.version !== STORAGE_VERSION) return false;
  if (!Array.isArray(value.diaries)) return false;   // Bookshelf / diary lookups
  if (!Array.isArray(value.userAssets)) return false; // .length + .find + .map
  if (!isPlainObject(value.pages)) return false;      // pages[diaryId][pageKey] indexing
  // activeDiaryId is used as an object key and .find target. A string is safe;
  // null/undefined is safe too (App falls back to DIARY_ID via `?? DIARY_ID`).
  // Any other type would slip past that fallback and index `pages` wrongly.
  if (value.activeDiaryId != null && typeof value.activeDiaryId !== "string") return false;
  return true;
}

// v1 → v2: legacy placements ({ id, assetId, emoji, name, x, y, rot })
// become StickerInstances referencing assets by id.
export function migrateV1toV2(v1) {
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
export function migrateV2toV3(v2) {
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

/**
 * Migrate a valid v1 or v2 value to the current v3 shape. Only called for
 * versions 1 and 2; any other version throws (the caller treats that as invalid).
 * Pure — builds new objects, never mutates the input.
 * @param {{version:number}} value
 * @returns {object} v3 state
 */
export function migratePersistedState(value) {
  if (value.version === 2) return migrateV2toV3(value);                 // one hop
  if (value.version === 1) return migrateV2toV3(migrateV1toV2(value));  // chained v1→v2→v3
  throw new Error("no migration path for this version");
}

/** A fresh, empty current-schema (v3) state — the seed for a brand-new user. */
export function createDefaultPersistedState() {
  return {
    version: STORAGE_VERSION,
    diaries: [{ id: DIARY_ID, name: "My diary" }],
    activeDiaryId: DIARY_ID,
    pages: { [DIARY_ID]: {} },
    userAssets: [],
    beans: 12,
    ownedPacks: [],
  };
}

/**
 * Serialize durable app state into the storage blob string. Stamps the current
 * `version` centrally so it can never drift from STORAGE_VERSION. Pure.
 * @param {object} state
 * @returns {string}
 */
export function serializePersistedState(state) {
  return JSON.stringify({
    version: STORAGE_VERSION,
    diaries: state.diaries,
    activeDiaryId: state.activeDiaryId,
    pages: state.pages,
    userAssets: state.userAssets,
    beans: state.beans,
    ownedPacks: state.ownedPacks,
  });
}

/**
 * Classify a raw persisted value into a LoadResult, WITHOUT touching storage.
 * This is the single source of truth for the safety contract above.
 *
 *   absent / ""              → empty       (data null, canPersist true)
 *   malformed JSON           → invalid     (data null, canPersist false)
 *   not an object / no ver   → invalid     (data null, canPersist false)
 *   version === current (v3) → ready       (data v3,  canPersist true)
 *   broken current shape     → invalid     (data null, canPersist false)
 *   version 1 or 2           → migrated    (data v3,  canPersist true)
 *   v1/v2 fails migrate/validate → invalid (data null, canPersist false)
 *   version > current        → unsupported (data null, canPersist false)
 *   any other number         → unsupported (data null, canPersist false)
 *
 * @param {string|null|undefined} raw
 * @returns {LoadResult}
 */
export function resolvePersistedState(raw) {
  if (raw == null || raw === "") {
    return { status: "empty", data: null, canPersist: true };
  }

  let parsed;
  try {
    parsed = parsePersistedValue(raw);
  } catch {
    return { status: "invalid", data: null, canPersist: false }; // malformed JSON → preserve
  }

  if (!isPlainObject(parsed) || typeof parsed.version !== "number") {
    return { status: "invalid", data: null, canPersist: false };
  }

  const { version } = parsed;

  // Current schema FIRST — the app's OWN current version is recognized before
  // the unknown-version net below, so bumping STORAGE_VERSION later can never
  // make today's own-current data classify as `unsupported`. A broken shape at
  // the current version is preserved as `invalid` (never auto-saved over).
  if (version === STORAGE_VERSION) {
    if (!validateCurrentState(parsed)) {
      return { status: "invalid", data: null, canPersist: false };
    }
    return { status: "ready", data: parsed, canPersist: true };
  }

  // Known legacy versions with a migration path (v1, v2 → v3). Migrate, then
  // hold the result to the same safety bar as the current schema.
  if (version === 1 || version === 2) {
    try {
      const migrated = migratePersistedState(parsed);
      if (!validateCurrentState(migrated)) {
        return { status: "invalid", data: null, canPersist: false };
      }
      return { status: "migrated", data: migrated, canPersist: true };
    } catch {
      return { status: "invalid", data: null, canPersist: false };
    }
  }

  // Newer than we understand, or any other version number without a migration
  // path: preserve the original bytes and refuse to auto-save over them.
  return { status: "unsupported", data: null, canPersist: false };
}
