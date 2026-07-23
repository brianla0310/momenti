import { describe, expect, it } from "vitest";
import {
  addDaysLocal,
  addMonths,
  clampDayToMonth,
  clampDescriptorToToday,
  createCalendarContext,
  createMonthContext,
  dayKeyOf,
  getDayKey,
  getDaysInMonth,
  getLocalWeekDays,
  getMondayFirstOffset,
  getMonthKey,
  isFutureLocalDay,
  isFutureMonth,
  isSameLocalWeek,
} from "./dateUtils";

describe("calendar date utilities", () => {
  it("builds local, zero-padded month and day keys", () => {
    const date = new Date(2026, 0, 5, 12, 0, 0);

    expect(getMonthKey(date)).toBe("2026-01");
    expect(getDayKey(date)).toBe("2026-01-05");
    expect(dayKeyOf(2026, 8, 7)).toBe("2026-09-07");
  });

  it("handles leap years and Monday-first offsets", () => {
    expect(getDaysInMonth(2024, 1)).toBe(29);
    expect(getDaysInMonth(2025, 1)).toBe(28);
    expect(getMondayFirstOffset(2026, 0)).toBe(3); // Thu 1 Jan 2026
  });

  it("creates current and past month contexts without a false today marker", () => {
    const today = { year: 2026, monthIndex: 6, day: 23 };
    const current = createMonthContext(2026, 6, today);
    const past = createMonthContext(2026, 5, today);

    expect(current).toMatchObject({ monthKey: "2026-07", todayDay: 23, isCurrentMonth: true });
    expect(past).toMatchObject({ monthKey: "2026-06", todayDay: null, isCurrentMonth: false });
  });

  it("creates a local calendar snapshot from an injected date", () => {
    const context = createCalendarContext(new Date(2026, 6, 23, 9, 30));

    expect(context.today).toEqual({ year: 2026, monthIndex: 6, day: 23 });
    expect(context.todayKey).toBe("2026-07-23");
  });

  it("moves months across year boundaries and blocks future months", () => {
    expect(addMonths(2026, 0, -1)).toEqual({ year: 2025, monthIndex: 11 });
    expect(addMonths(2025, 11, 1)).toEqual({ year: 2026, monthIndex: 0 });
    expect(isFutureMonth({ year: 2026, monthIndex: 7 }, { year: 2026, monthIndex: 6 })).toBe(true);
    expect(isFutureMonth({ year: 2026, monthIndex: 6 }, { year: 2026, monthIndex: 6 })).toBe(false);
  });

  it("clamps day-of-month without losing the preferred day used by callers", () => {
    const preferredDay = 31;

    expect(clampDayToMonth(2025, 1, preferredDay)).toBe(28);
    expect(clampDayToMonth(2024, 1, preferredDay)).toBe(29);
    expect(clampDayToMonth(2026, 7, preferredDay)).toBe(31);
  });

  it("clamps a future anchor to today but preserves past dates", () => {
    const today = { year: 2026, monthIndex: 6, day: 23 };
    const past = { year: 2026, monthIndex: 5, day: 30 };

    expect(clampDescriptorToToday({ year: 2026, monthIndex: 6, day: 30 }, today)).toEqual(today);
    expect(clampDescriptorToToday(past, today)).toBe(past);
    expect(isFutureLocalDay(2026, 6, 24, today)).toBe(true);
    expect(isFutureLocalDay(2026, 5, 30, today)).toBe(false);
  });

  it("moves local days and renders real Monday-to-Sunday cross-month weeks", () => {
    expect(addDaysLocal({ year: 2025, monthIndex: 11, day: 31 }, 1)).toEqual({
      year: 2026,
      monthIndex: 0,
      day: 1,
    });

    expect(getLocalWeekDays({ year: 2026, monthIndex: 7, day: 1 })).toEqual([
      { year: 2026, monthIndex: 6, day: 27 },
      { year: 2026, monthIndex: 6, day: 28 },
      { year: 2026, monthIndex: 6, day: 29 },
      { year: 2026, monthIndex: 6, day: 30 },
      { year: 2026, monthIndex: 6, day: 31 },
      { year: 2026, monthIndex: 7, day: 1 },
      { year: 2026, monthIndex: 7, day: 2 },
    ]);
  });

  it("recognizes the same Monday-first week", () => {
    expect(isSameLocalWeek(
      { year: 2026, monthIndex: 6, day: 20 },
      { year: 2026, monthIndex: 6, day: 26 },
    )).toBe(true);
    expect(isSameLocalWeek(
      { year: 2026, monthIndex: 6, day: 26 },
      { year: 2026, monthIndex: 6, day: 27 },
    )).toBe(false);
  });
});
