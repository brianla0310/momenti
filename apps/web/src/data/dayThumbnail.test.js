import { describe, expect, it } from "vitest";
import { pickDayThumbnail } from "./dayThumbnail";

const ASSETS = {
  first: { id: "first", kind: "emoji", content: "🌸" },
  second: { id: "second", kind: "emoji", content: "⭐" },
};
const resolveAsset = (id) => ASSETS[id];

describe("pickDayThumbnail", () => {
  it("returns null for missing or empty element lists", () => {
    expect(pickDayThumbnail(null, resolveAsset)).toBeNull();
    expect(pickDayThumbnail([], resolveAsset)).toBeNull();
  });

  it("selects the highest-z valid sticker", () => {
    const result = pickDayThumbnail([
      { id: "a", type: "sticker", assetId: "first", z: 1 },
      { id: "b", type: "sticker", assetId: "second", z: 9 },
    ], resolveAsset);

    expect(result).toEqual({ kind: "sticker", asset: ASSETS.second });
  });

  it("uses the later sticker when z values tie", () => {
    const result = pickDayThumbnail([
      { id: "a", type: "sticker", assetId: "first", z: 4 },
      { id: "b", type: "sticker", assetId: "second", z: 4 },
    ], resolveAsset);

    expect(result).toEqual({ kind: "sticker", asset: ASSETS.second });
  });

  it("skips missing assets and falls through to the next valid sticker", () => {
    const result = pickDayThumbnail([
      { id: "a", type: "sticker", assetId: "first", z: 1 },
      { id: "b", type: "sticker", assetId: "deleted", z: 99 },
    ], resolveAsset);

    expect(result).toEqual({ kind: "sticker", asset: ASSETS.first });
  });

  it("uses a text marker only when no valid sticker exists", () => {
    expect(pickDayThumbnail([
      { id: "t", type: "text", content: "  a note  ", z: 10 },
    ], resolveAsset)).toEqual({ kind: "text" });

    expect(pickDayThumbnail([
      { id: "t", type: "text", content: "   " },
      { id: "bad", type: "sticker", assetId: "deleted" },
      null,
    ], resolveAsset)).toBeNull();
  });

  it("does not reorder or mutate the input array", () => {
    const elements = [
      { id: "a", type: "sticker", assetId: "first", z: 8 },
      { id: "b", type: "sticker", assetId: "second", z: 2 },
    ];
    const before = JSON.stringify(elements);

    pickDayThumbnail(elements, resolveAsset);

    expect(JSON.stringify(elements)).toBe(before);
  });
});
