"use client";

import { useEffect, useRef, useState } from "react";

export interface DateValue {
  year: number;
  month: number; // 1–12
  day: number;
}

interface WikiDatePickerProps {
  value: DateValue | null;
  onChange: (date: DateValue | null) => void;
  placeholder?: string;
}

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

const WEEKDAYS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

function daysInMonth(year: number, month: number) {
  return new Date(year, month, 0).getDate(); // month is 1-based, so this works
}

function firstWeekday(year: number, month: number) {
  return new Date(year, month - 1, 1).getDay(); // 0 = Sunday
}

export function WikiDatePicker({
  value,
  onChange,
  placeholder = "Select date",
}: WikiDatePickerProps) {
  const now = new Date();
  const [open, setOpen] = useState(false);
  const [viewYear, setViewYear] = useState(value?.year ?? now.getFullYear());
  const [viewMonth, setViewMonth] = useState(value?.month ?? now.getMonth() + 1);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const prevMonth = () => {
    if (viewMonth === 1) { setViewMonth(12); setViewYear((y) => y - 1); }
    else setViewMonth((m) => m - 1);
  };
  const nextMonth = () => {
    if (viewMonth === 12) { setViewMonth(1); setViewYear((y) => y + 1); }
    else setViewMonth((m) => m + 1);
  };

  const selectDay = (day: number) => {
    onChange({ year: viewYear, month: viewMonth, day });
    setOpen(false);
  };

  const formatDisplay = (v: DateValue) =>
    `${MONTHS[v.month - 1]} ${v.day}, ${v.year}`;

  const numDays = daysInMonth(viewYear, viewMonth);
  const startOffset = firstWeekday(viewYear, viewMonth);

  const cells: (number | null)[] = [
    ...Array<null>(startOffset).fill(null),
    ...Array.from({ length: numDays }, (_, i) => i + 1),
  ];
  while (cells.length % 7 !== 0) cells.push(null);

  const todayY = now.getFullYear();
  const todayM = now.getMonth() + 1;
  const todayD = now.getDate();

  return (
    <div ref={containerRef} className="relative">
      {/* Trigger — styled to match text inputs */}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full text-left px-2 py-1.5 text-sm border border-wiki-border-light bg-wiki-white text-wiki-text
          focus-visible:outline-dotted focus-visible:outline-1 focus-visible:outline-wiki-text"
      >
        {value
          ? formatDisplay(value)
          : <span className="text-wiki-text-muted">{placeholder}</span>
        }
      </button>

      {open && (
        <div
          className="absolute z-30 top-full left-0 mt-1 bg-wiki-white border border-wiki-border-light shadow-md"
          style={{ width: 252 }}
        >
          {/* Month / year navigation */}
          <div className="flex items-center justify-between px-3 py-2 border-b border-wiki-border-light bg-wiki-offwhite">
            <button
              type="button"
              onClick={prevMonth}
              className="text-wiki-link hover:underline text-sm w-6 text-center
                focus-visible:outline-dotted focus-visible:outline-1 focus-visible:outline-wiki-text"
              aria-label="Previous month"
            >
              ←
            </button>
            <span className="text-sm font-semibold text-wiki-text select-none">
              {MONTHS[viewMonth - 1]} {viewYear}
            </span>
            <button
              type="button"
              onClick={nextMonth}
              disabled={viewYear === todayY && viewMonth === todayM}
              className={`text-sm w-6 text-center
                focus-visible:outline-dotted focus-visible:outline-1 focus-visible:outline-wiki-text
                ${viewYear === todayY && viewMonth === todayM
                  ? "text-wiki-text-muted opacity-30 cursor-not-allowed"
                  : "text-wiki-link hover:underline"
                }`}
              aria-label="Next month"
            >
              →
            </button>
          </div>

          {/* Weekday labels */}
          <div className="grid grid-cols-7 px-2 pt-2 pb-0">
            {WEEKDAYS.map((d) => (
              <div key={d} className="text-center text-xs text-wiki-text-muted font-medium py-1">
                {d}
              </div>
            ))}
          </div>

          {/* Day grid */}
          <div className="grid grid-cols-7 px-2 pb-2">
            {cells.map((day, i) => {
              if (day === null) return <div key={i} />;

              const isSelected =
                value &&
                value.year === viewYear &&
                value.month === viewMonth &&
                value.day === day;

              const isTodayCell =
                viewYear === todayY && viewMonth === todayM && day === todayD;

              const isFuture =
                viewYear > todayY ||
                (viewYear === todayY && viewMonth > todayM) ||
                (viewYear === todayY && viewMonth === todayM && day > todayD);

              return (
                <div key={i} className="flex items-center justify-center p-0.5">
                  <button
                    type="button"
                    onClick={() => !isFuture && selectDay(day)}
                    disabled={isFuture}
                    className={`w-8 h-8 text-sm flex items-center justify-center transition-colors
                      focus-visible:outline-dotted focus-visible:outline-1 focus-visible:outline-wiki-text
                      ${isFuture
                        ? "text-wiki-text-muted opacity-30 cursor-not-allowed"
                        : isSelected
                        ? "bg-wiki-tab-bg border border-wiki-link text-wiki-link font-semibold"
                        : isTodayCell
                        ? "font-bold text-wiki-link hover:bg-wiki-tab-bg"
                        : "text-wiki-text hover:bg-wiki-tab-bg"
                      }`}
                  >
                    {day}
                  </button>
                </div>
              );
            })}
          </div>

          {/* Clear link */}
          {value && (
            <div className="px-3 py-1.5 border-t border-wiki-border-light text-right">
              <button
                type="button"
                onClick={() => { onChange(null); setOpen(false); }}
                className="text-xs text-wiki-link hover:underline
                  focus-visible:outline-dotted focus-visible:outline-1 focus-visible:outline-wiki-text"
              >
                [clear]
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
