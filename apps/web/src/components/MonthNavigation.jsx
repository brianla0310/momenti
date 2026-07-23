// ─────────────────────────────────────────────────────────────
//  Momenti · CalendarNavigation — prev / month-title / next row.
//
//  Lives in the Diary header card. The arrows page whatever the current
//  view is: in month view they step months, in week view they step weeks
//  (the parent passes the right handlers + labels). "Next" is disabled at
//  the boundary toward today (current month / current week) — the diary
//  never pages into the future. The title always names the visible month
//  and opens the month picker sheet. Buttons reuse the app's 34×34 paper-
//  button system (close / undo / redo); focus-visible is the global style.
// ─────────────────────────────────────────────────────────────
import { ChevronLeft, ChevronRight, ChevronDown } from "lucide-react";

export default function MonthNavigation({ t, cal, onPrev, onNext, canGoNext, prevLabel = "Previous", nextLabel = "Next", onOpenPicker, titleRef }) {
  const navBtn = (enabled) => ({
    border: "none", background: t.paper, borderRadius: 12, width: 34, height: 34,
    cursor: enabled ? "pointer" : "default",
    color: enabled ? t.ink : "rgba(0,0,0,.22)",
    boxShadow: enabled ? "0 2px 6px rgba(51,33,26,.1)" : "none",
    display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
  });
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
      <button onClick={onPrev} aria-label={prevLabel} style={navBtn(true)}>
        <ChevronLeft size={18} />
      </button>

      {/* month title = picker opener (keeps the header's display type) */}
      <button
        ref={titleRef}
        onClick={onOpenPicker}
        aria-label={`${cal.monthYearCap} — choose month`}
        aria-haspopup="dialog"
        className="cp-display"
        style={{
          flex: 1, minWidth: 0, border: "none", background: "transparent", cursor: "pointer",
          display: "flex", alignItems: "center", gap: 4, padding: "3px 2px",
          color: t.ink, fontSize: 20, fontWeight: 700, lineHeight: 1.1, textAlign: "left",
        }}
      >
        <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{cal.monthYearCap}</span>
        <ChevronDown size={15} style={{ flexShrink: 0, opacity: 0.5 }} />
      </button>

      <button onClick={onNext} disabled={!canGoNext} aria-label={nextLabel} style={navBtn(canGoNext)}>
        <ChevronRight size={18} />
      </button>
    </div>
  );
}
