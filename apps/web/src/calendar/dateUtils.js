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
 * The 7 Monday→Sunday day-of-month numbers for the week containing `todayDay`.
 * Slots outside the current month are null — this build renders a single month
 * with no month navigation, so cross-month days show as empty (never a
 * mismatched key). Derived from the month frame, not from raw day arithmetic.
 */
export function getWeekDayNumbers({ firstWeekdayOffset, todayDay, daysInMonth }) {
  const weekdayOfToday = (firstWeekdayOffset + todayDay - 1) % 7;
  const weekStart = todayDay - weekdayOfToday; // day-of-month of this week's Monday (may be < 1)
  return Array.from({ length: 7 }, (_, i) => {
    const d = weekStart + i;
    return d >= 1 && d <= daysInMonth ? d : null;
  });
}

/**
 * Snapshot of the local calendar frame the whole app renders against.
 * Captured once at load (a stable session snapshot — no midnight auto-roll).
 * Pass a base date to inject a fixed "now" for tests / manual verification.
 * @param {Date} [now]
 */
export function createCalendarContext(now = new Date()) {
  const year = now.getFullYear();
  const monthIndex = now.getMonth(); // 0-based
  const todayDay = now.getDate();
  const monthYear = formatMonthYear(now);
  return {
    year,
    monthIndex,
    todayDay,
    today: { year, monthIndex, day: todayDay },
    monthKey: getMonthKey(now),                 // "YYYY-MM"  — monthly-spread page key
    todayKey: getDayKey(now),                   // "YYYY-MM-DD"
    daysInMonth: getDaysInMonth(year, monthIndex),
    firstWeekdayOffset: getMondayFirstOffset(year, monthIndex),
    monthName: formatMonthName(now),            // "luglio"       (lowercase, day-page style)
    monthYear,                                  // "luglio 2026"  (lowercase)
    monthYearCap: cap(monthYear),               // "Luglio 2026"  (header/cover style)
  };
}
