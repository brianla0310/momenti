// ─────────────────────────────────────────────────────────────
//  Momenti · MonthPickerSheet — quick month/year picker (§8).
//
//  A small custom bottom sheet in the app's existing sheet grammar
//  (Stickerbook / creator): warm paper backdrop, rounded-top sheet, drag
//  handle, close X. NOT <input type="month"> — that renders inconsistently
//  across browsers. Pick a year with the stepper, tap a month, it navigates
//  and closes (no confirm step).
//
//  Rules: past years are unlimited; the year stepper never passes the real
//  current year; future months (current year, after the current month) are
//  disabled. The real current month is marked; the visible month is selected.
//
//  Accessibility: role="dialog" + aria-modal, Escape + backdrop close, focus
//  moves into the sheet on open and returns to the opener (returnFocusRef) on
//  close — a minimal, dependency-free treatment (no focus-trap library).
// ─────────────────────────────────────────────────────────────
import { useEffect, useRef, useState } from "react";
import { X, ChevronLeft, ChevronRight } from "lucide-react";
import { getMonthNames, isFutureMonth } from "../calendar/dateUtils";

const MONTHS = getMonthNames("it-IT"); // ["Gennaio" … "Dicembre"] — computed once

export default function MonthPickerSheet({ t, visibleMonth, today, onSelect, onToday, onClose, returnFocusRef }) {
  const [pickerYear, setPickerYear] = useState(visibleMonth.year);
  const dialogRef = useRef(null);

  // move focus into the sheet on open; restore it to the opener on unmount.
  // The opener is read at CLEANUP time on purpose: the month-title button is
  // re-rendered (month/week view, month changes) while the sheet is open, so a
  // node captured at open time could be the detached one and focus() on it
  // would silently drop focus to <body>. Reading returnFocusRef.current in the
  // cleanup always focuses the button that is actually mounted right then.
  useEffect(() => {
    dialogRef.current?.focus();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- focus return needs the CURRENT opener node, not the one captured at open time
    return () => returnFocusRef?.current?.focus?.();
  }, [returnFocusRef]);

  // Escape closes
  useEffect(() => {
    const onKey = (e) => { if (e.key === "Escape") { e.preventDefault(); onClose(); } };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const canNextYear = pickerYear < today.year; // never step into a future year
  const isTodayView = visibleMonth.year === today.year && visibleMonth.monthIndex === today.monthIndex;

  const stepBtn = (enabled) => ({
    border: "none", background: t.paper, borderRadius: 12, width: 34, height: 34,
    cursor: enabled ? "pointer" : "default",
    color: enabled ? t.ink : "rgba(0,0,0,.22)",
    boxShadow: enabled ? "0 2px 6px rgba(51,33,26,.1)" : "none",
    display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
  });

  return (
    <div onClick={onClose} style={{ position: "absolute", inset: 0, background: "rgba(51,33,26,.35)", zIndex: 50, display: "flex", alignItems: "flex-end" }}>
      <div
        ref={dialogRef}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-label="Scegli un mese"
        onClick={(e) => e.stopPropagation()}
        className="cp-fadeup"
        style={{ width: "100%", background: t.bg, borderRadius: "24px 24px 0 0", padding: "10px 18px 22px", maxHeight: "78%", overflowY: "auto", outline: "none" }}
      >
        <div style={{ width: 40, height: 5, background: t.accentSoft, borderRadius: 3, margin: "4px auto 12px" }} />

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
          <div className="cp-display" style={{ fontSize: 19, fontWeight: 700, color: t.ink }}>Scegli un mese</div>
          <button onClick={onClose} aria-label="Chiudi selezione mese" style={{ border: "none", background: t.accentSoft, borderRadius: 10, width: 26, height: 26, cursor: "pointer", color: t.ink }}>
            <X size={14} />
          </button>
        </div>

        {/* year stepper */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 14, marginBottom: 14 }}>
          <button onClick={() => setPickerYear((y) => y - 1)} aria-label="Previous year" style={stepBtn(true)}>
            <ChevronLeft size={18} />
          </button>
          <span className="cp-display" style={{ fontSize: 18, fontWeight: 700, color: t.ink, minWidth: 66, textAlign: "center" }} aria-live="polite">{pickerYear}</span>
          <button onClick={() => canNextYear && setPickerYear((y) => y + 1)} disabled={!canNextYear} aria-label="Next year" style={stepBtn(canNextYear)}>
            <ChevronRight size={18} />
          </button>
        </div>

        {/* 12-month grid — 3 columns fit full Italian names at 320px */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8 }}>
          {MONTHS.map((name, m) => {
            const future = isFutureMonth({ year: pickerYear, monthIndex: m }, today);
            const selected = pickerYear === visibleMonth.year && m === visibleMonth.monthIndex;
            const current = pickerYear === today.year && m === today.monthIndex;
            return (
              <button
                key={m}
                onClick={() => !future && onSelect(pickerYear, m)}
                disabled={future}
                aria-current={selected ? "true" : undefined}
                aria-label={`${name} ${pickerYear}${current ? " · mese corrente" : ""}`}
                className="cp-display"
                style={{
                  minHeight: 44, borderRadius: 12, padding: "0 4px",
                  cursor: future ? "default" : "pointer",
                  border: selected ? `2px solid ${t.accent}` : current ? `2px dashed ${t.accent}` : "2px solid transparent",
                  background: selected ? t.accent : future ? "transparent" : t.paper,
                  color: future ? "rgba(0,0,0,.25)" : selected ? "#fff" : t.ink,
                  fontSize: 13.5, fontWeight: 700, whiteSpace: "nowrap",
                  boxShadow: future || selected ? "none" : "0 2px 6px rgba(51,33,26,.08)",
                }}
              >
                {name}
              </button>
            );
          })}
        </div>

        {/* optional shortcut back to the real current month */}
        {!isTodayView && (
          <button onClick={onToday} className="cp-display" style={{
            width: "100%", marginTop: 14, padding: "11px 0", borderRadius: 12,
            border: `2px dashed ${t.accent}`, background: "transparent",
            color: t.accent, fontSize: 13.5, fontWeight: 700, cursor: "pointer",
          }}>
            Vai a oggi
          </button>
        )}
      </div>
    </div>
  );
}
