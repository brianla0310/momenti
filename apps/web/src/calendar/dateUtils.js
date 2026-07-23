// ─────────────────────────────────────────────────────────────
//  Momenti · calendar date utilities (pure, LOCAL timezone).
//
//  The app shows one month — the browser's current LOCAL month — so all
//  date math lives here as small pure functions with an injectable base
//  date (tests / manual verification pass a fixed `now`).
//
//  LOCAL, never UTC: calendar days are derived from getFullYear /
//  getMonth / getDate / getDay only. Do NOT use `toISOString().slice(0,10)`
//  or other UTC conversions to pick a calendar day — near midnight in a
//  non-UTC offset that lands on the wrong day.
//
//  Conventions:
//   • monthIndex is JavaScript's 0-based month (0 = January).
//   • Weeks are Monday-first (0 = Monday … 6 = Sunday).
//   • Storage keys are 1-based and zero-padded: "YYYY-MM", "YYYY-MM-DD".
//   • locale strings are for UI labels only — never for storage keys.
// ─────────────────────────────────────────────────────────────

const pad2 = (n) => String(n).padStart(2, "0");
const cap = (s) => (s ? s.charAt(0).toUpperCase() + s.slice(1) : s);

/** "YYYY-MM" for a Date, from its local components. */
export function getMonthKey(date) {
  return `${date.getFullYear()}-${pad2(date.getMonth() + 1)}`;
}

/** "YYYY-MM-DD" for a Date, from its local components. */
export function getDayKey(date) {
  return `${getMonthKey(date)}-${pad2(date.getDate())}`;
}

/** "YYYY-MM-DD" from explicit local components (monthIndex is 0-based). */
export function dayKeyOf(year, monthIndex, day) {
  return `${year}-${pad2(monthIndex + 1)}-${pad2(day)}`;
}

/** Days in a local month (monthIndex 0-based). Correct across leap years. */
export function getDaysInMonth(year, monthIndex) {
  // day 0 of the next month rolls back to the last day of this month
  return new Date(year, monthIndex + 1, 0).getDate();
}

/** Monday-first weekday of the 1st of the month: 0 = Monday … 6 = Sunday. */
export function getMondayFirstOffset(year, monthIndex) {
  const jsDay = new Date(year, monthIndex, 1).getDay(); // 0 = Sunday … 6 = Saturday
  return (jsDay + 6) % 7;
}

/**
 * Is (year, monthIndex, day) a later LOCAL calendar day than `today`?
 * Compares calendar components, so a different clock time on the same day
 * is never "future". `today` = { year, monthIndex, day }.
 */
export function isFutureLocalDay(year, monthIndex, day, today) {
  if (year !== today.year) return year > today.year;
  if (monthIndex !== today.monthIndex) return monthIndex > today.monthIndex;
  return day > today.day;
}

/**
 * Clamp a local date descriptor so it never falls after `today`: a future day
 * collapses to `today`, a past-or-today day passes through unchanged. Pure
 * component comparison — no UTC/ISO. This is the single boundary that keeps the
 * week anchor from ever pointing past the real current day (§ future-week fix).
 * @param {{year:number,monthIndex:number,day:number}} descriptor
 * @param {{year:number,monthIndex:number,day:number}} today  the real local today
 */
export function clampDescriptorToToday(descriptor, today) {
  return isFutureLocalDay(descriptor.year, descriptor.monthIndex, descriptor.day, today)
    ? { year: today.year, monthIndex: today.monthIndex, day: today.day }
    : descriptor;
}

/** Lowercase Italian month name, e.g. "luglio". Small safe fallback if Intl fails. */
export function formatMonthName(date, locale = "it-IT") {
  try {
    return new Intl.DateTimeFormat(locale, { month: "long" }).format(date);
  } catch {
    return pad2(date.getMonth() + 1);
  }
}

/** Lowercase "month year", e.g. "luglio 2026". Small safe fallback if Intl fails. */
export function formatMonthYear(date, locale = "it-IT") {
  try {
    return new Intl.DateTimeFormat(locale, { month: "long", year: "numeric" }).format(date);
  } catch {
    return `${pad2(date.getMonth() + 1)}/${date.getFullYear()}`;
  }
}

/**
 * Calendar frame for ANY local month (monthIndex 0-based) — the frame the
 * monthly spread, day cells, and day thumbnails all render against. Powers
 * past-month navigation: the visible month is derived through here.
 *
 * `todayDay` is set ONLY when this month IS the real current month, so the
 * "today" ring never appears while browsing another month; `today` always
 * carries the real local today for future-day comparisons.
 * @param {number} year
 * @param {number} monthIndex   0-based
 * @param {{year:number,monthIndex:number,day:number}} today  the real local today
 */
export function createMonthContext(year, monthIndex, today) {
  const firstOfMonth = new Date(year, monthIndex, 1); // local, for locale labels only
  const isCurrentMonth = year === today.year && monthIndex === today.monthIndex;
  const monthYear = formatMonthYear(firstOfMonth);
  return {
    year,
    monthIndex,
    isCurrentMonth,
    today,                                          // real local today (future-day checks)
    todayDay: isCurrentMonth ? today.day : null,    // highlight "today" only in the real month
    monthKey: `${year}-${pad2(monthIndex + 1)}`,    // "YYYY-MM"  — monthly-spread page key
    daysInMonth: getDaysInMonth(year, monthIndex),
    firstWeekdayOffset: getMondayFirstOffset(year, monthIndex),
    monthName: formatMonthName(firstOfMonth),       // "luglio"       (lowercase, day-page style)
    monthYear,                                      // "luglio 2026"  (lowercase)
    monthYearCap: cap(monthYear),                   // "Luglio 2026"  (header/cover style)
  };
}

/**
 * Snapshot of the local calendar frame captured once at load — the real
 * current month (a stable session snapshot; no midnight auto-roll). Wraps
 * {@link createMonthContext} for the current month and adds the day-precise
 * `todayKey` only the live snapshot needs. Pass a base date to inject a fixed
 * "now" for tests / manual verification.
 * @param {Date} [now]
 */
export function createCalendarContext(now = new Date()) {
  const today = { year: now.getFullYear(), monthIndex: now.getMonth(), day: now.getDate() };
  return {
    ...createMonthContext(today.year, today.monthIndex, today),
    todayKey: getDayKey(now),                       // "YYYY-MM-DD"
  };
}

/* ── month-navigation helpers (pure; used by past-month browsing) ── */

/** Add `amount` months to (year, monthIndex), carrying across year boundaries. */
export function addMonths(year, monthIndex, amount) {
  const total = year * 12 + monthIndex + amount;
  return { year: Math.floor(total / 12), monthIndex: ((total % 12) + 12) % 12 };
}

/** Compare two {year, monthIndex}: <0 if a is earlier, 0 if same, >0 if a is later. */
export function compareYearMonth(a, b) {
  return a.year !== b.year ? a.year - b.year : a.monthIndex - b.monthIndex;
}

/** Is `candidate` {year, monthIndex} a later month than `today`? (day ignored) */
export function isFutureMonth(candidate, today) {
  return compareYearMonth(candidate, today) > 0;
}

/** Clamp a day-of-month into [1, daysInMonth] for (year, monthIndex). */
export function clampDayToMonth(year, monthIndex, day) {
  return Math.min(Math.max(day, 1), getDaysInMonth(year, monthIndex));
}

/** The 12 capitalized month names for a locale (index 0 = January). UI labels only. */
export function getMonthNames(locale = "it-IT") {
  return Array.from({ length: 12 }, (_, m) => cap(formatMonthName(new Date(2021, m, 1), locale)));
}

/* ── local-week helpers (pure) — real dates, so the week strip can page ±7 days
   across month/year boundaries. A descriptor is { year, monthIndex, day }.
   All math goes through Date's local normalization; no Date is mutated and no
   UTC/ISO string is ever used as a comparison key. ── */

/** Shift a local date descriptor by `amount` days (normalizes month/year/leap). */
export function addDaysLocal({ year, monthIndex, day }, amount) {
  const d = new Date(year, monthIndex, day + amount); // JS normalizes overflow, local
  return { year: d.getFullYear(), monthIndex: d.getMonth(), day: d.getDate() };
}

/** The Monday (Monday-first week) of the week containing `descriptor`. */
export function startOfLocalWeek(descriptor) {
  const { year, monthIndex, day } = descriptor;
  const offset = (new Date(year, monthIndex, day).getDay() + 6) % 7; // 0 = Mon … 6 = Sun
  return addDaysLocal(descriptor, -offset);
}

/** The 7 Monday→Sunday local date descriptors for the week containing `anchor`. */
export function getLocalWeekDays(anchor) {
  const start = startOfLocalWeek(anchor);
  return Array.from({ length: 7 }, (_, i) => addDaysLocal(start, i));
}

/** Do two descriptors fall in the same Monday-first local week? */
export function isSameLocalWeek(a, b) {
  const sa = startOfLocalWeek(a), sb = startOfLocalWeek(b);
  return sa.year === sb.year && sa.monthIndex === sb.monthIndex && sa.day === sb.day;
}
