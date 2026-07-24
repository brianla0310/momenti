import { describe, expect, it } from "vitest";
import {
  createDefaultPersistedState,
  DIARY_ID,
  LEGACY_MONTH_KEY,
  migratePersistedState,
  resolvePersistedState,
  serializePersistedState,
  STORAGE_KEY,
  STORAGE_VERSION,
  validateCurrentState,
} from "./persistence";

/* These three values are already on disk in every existing user's browser, so
   they are frozen: persistence.js says "Do not change this value" for the key
   and the legacy month, and CLAUDE.md pins the schema at v3.
   Asserted against LITERALS on purpose — comparing them to the imported
   constant would move with the constant and detect nothing. */
describe("frozen storage contract", () => {
  it("keeps the on-disk localStorage key at momenti.v1", () => {
    expect(STORAGE_KEY).toBe("momenti.v1");
  });

  it("keeps the schema version at 3", () => {
    expect(STORAGE_VERSION).toBe(3);
  });

  it("keeps the legacy monthly-spread destination at 2026-07", () => {
    expect(LEGACY_MONTH_KEY).toBe("2026-07");
  });
});

const validV3 = () => ({
  version: 3,
  diaries: [{ id: DIARY_ID, name: "My diary" }],
  activeDiaryId: DIARY_ID,
  pages: {
    [DIARY_ID]: {
      "2026-07": { elements: [] },
      "2026-07-23": { elements: [] },
    },
  },
  userAssets: [],
  beans: 12,
  ownedPacks: [],
});

describe("persistence safety", () => {
  it("creates a valid current-schema default state", () => {
    const state = createDefaultPersistedState();

    expect(state.version).toBe(3);
    expect(validateCurrentState(state)).toBe(true);
    expect(state.pages).toEqual({ [DIARY_ID]: {} });
  });

  it("classifies absent data as an empty savable store", () => {
    expect(resolvePersistedState(null)).toEqual({ status: "empty", data: null, canPersist: true });
    expect(resolvePersistedState("")).toEqual({ status: "empty", data: null, canPersist: true });
  });

  it("accepts valid current data without changing page keys", () => {
    const state = validV3();
    const result = resolvePersistedState(JSON.stringify(state));

    expect(result.status).toBe("ready");
    expect(result.canPersist).toBe(true);
    expect(result.data.pages[DIARY_ID]).toHaveProperty("2026-07");
    expect(result.data.pages[DIARY_ID]).toHaveProperty("2026-07-23");

    // page keys survive a load byte-for-byte, in both shapes and with nothing
    // added or renamed: "YYYY-MM" = monthly spread, "YYYY-MM-DD" = day page.
    const keys = Object.keys(result.data.pages[DIARY_ID]);
    expect([...keys].sort()).toEqual(["2026-07", "2026-07-23"]);
    expect(keys.filter((k) => /^\d{4}-\d{2}$/.test(k))).toEqual(["2026-07"]);
    expect(keys.filter((k) => /^\d{4}-\d{2}-\d{2}$/.test(k))).toEqual(["2026-07-23"]);
  });

  it("preserves malformed JSON and unsupported versions by disabling persistence", () => {
    expect(resolvePersistedState("{bad-json")).toEqual({
      status: "invalid",
      data: null,
      canPersist: false,
    });
    expect(resolvePersistedState(JSON.stringify({ version: STORAGE_VERSION + 1 }))).toEqual({
      status: "unsupported",
      data: null,
      canPersist: false,
    });
    expect(resolvePersistedState(JSON.stringify({ version: 999 }))).toEqual({
      status: "unsupported",
      data: null,
      canPersist: false,
    });
    // pinned to the LITERAL next version, not STORAGE_VERSION + 1: a schema bump
    // must break this loudly instead of silently retargeting one version higher.
    expect(resolvePersistedState(JSON.stringify({ version: 4 }))).toEqual({
      status: "unsupported",
      data: null,
      canPersist: false,
    });
    // a future version carrying an otherwise-perfect v3 body must NOT be adopted
    expect(resolvePersistedState(JSON.stringify({ ...validV3(), version: 4 }))).toEqual({
      status: "unsupported",
      data: null,
      canPersist: false,
    });
  });

  it("rejects unsafe current-version top-level shapes", () => {
    expect(resolvePersistedState(JSON.stringify({ ...validV3(), diaries: {} })).status).toBe("invalid");
    expect(resolvePersistedState(JSON.stringify({ ...validV3(), userAssets: {} })).status).toBe("invalid");
    expect(resolvePersistedState(JSON.stringify({ ...validV3(), pages: [] })).status).toBe("invalid");
    expect(resolvePersistedState(JSON.stringify({ ...validV3(), activeDiaryId: 42 })).status).toBe("invalid");
  });

  it("migrates v1 data to v3 on the historical legacy month", () => {
    const v1 = {
      version: 1,
      pageStickers: [{
        id: 7,
        assetId: "caffe-0",
        x: 15,
        y: 25,
        rot: -4,
        placedAt: 123,
      }],
      beans: 9,
      ownedPacks: ["starter"],
    };
    const result = resolvePersistedState(JSON.stringify(v1));

    expect(result.status).toBe("migrated");
    expect(result.canPersist).toBe(true);
    expect(result.data.version).toBe(3);
    expect(Object.keys(result.data.pages[DIARY_ID])).toEqual(["2026-07"]);
    expect(result.data.pages[DIARY_ID]["2026-07"].elements[0]).toMatchObject({
      id: "el-7",
      type: "sticker",
      assetId: "caffe-0",
      x: 15,
      y: 25,
      rotation: -4,
    });
  });

  it("migrates v2 data without moving the legacy destination", () => {
    const v2 = {
      version: 2,
      pageStickers: [{
        id: "old",
        assetId: "deco-0",
        x: 50,
        y: 60,
        rotation: 3,
        scale: 1.2,
      }],
      userAssets: [],
      beans: 12,
      ownedPacks: [],
    };
    const result = resolvePersistedState(JSON.stringify(v2));

    expect(result.status).toBe("migrated");
    expect(result.data.version).toBe(3);
    expect(Object.keys(result.data.pages[DIARY_ID])).toEqual(["2026-07"]);
  });

  it("does not mutate a legacy object while migrating it", () => {
    const v2 = {
      version: 2,
      pageStickers: [{ id: "old", assetId: "deco-0", x: 1, y: 2, rotation: 3 }],
      userAssets: [],
    };
    const before = JSON.stringify(v2);

    migratePersistedState(v2);

    expect(JSON.stringify(v2)).toBe(before);
  });

  it("serializes current data with the current schema and round-trips safely", () => {
    const state = validV3();
    const serialized = serializePersistedState(state);
    const parsed = JSON.parse(serialized);
    const result = resolvePersistedState(serialized);

    expect(parsed.version).toBe(3);
    expect(result.status).toBe("ready");
    expect(result.data).toEqual(state);
  });
});
