"use client";

import { useEffect, useRef, useState } from "react";

export interface WikiSelectOption {
  value: string;
  label: string;
}

interface WikiSelectProps {
  value: string;
  onChange: (value: string) => void;
  options: WikiSelectOption[];
  placeholder?: string;
  className?: string;
}

export function WikiSelect({
  value,
  onChange,
  options,
  placeholder = "Select…",
  className = "",
}: WikiSelectProps) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const selected = options.find((o) => o.value === value) ?? null;

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

  const select = (v: string) => {
    onChange(v);
    setOpen(false);
  };

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      <button
        type="button"
        onClick={() => (open ? setOpen(false) : setOpen(true))}
        aria-haspopup="listbox"
        aria-expanded={open}
        className="w-full flex items-center justify-between text-left px-3 py-2 text-sm
          border border-wiki-border-light bg-wiki-white transition-colors
          hover:bg-wiki-tab-bg
          focus-visible:outline-dotted focus-visible:outline-1 focus-visible:outline-wiki-text"
      >
        <span className={selected ? "text-wiki-text" : "text-wiki-text-muted"}>
          {selected?.label ?? placeholder}
        </span>
        <span aria-hidden className="text-wiki-text-muted ml-2 shrink-0">▾</span>
      </button>

      {open && (
        <div
          role="listbox"
          className="absolute z-20 top-full left-0 right-0 mt-0.5 bg-wiki-white border border-wiki-border-light shadow-md overflow-y-auto"
          style={{ maxHeight: 240 }}
        >
          {options.map((opt) => {
            const active = value === opt.value;
            return (
              <button
                key={opt.value}
                type="button"
                role="option"
                aria-selected={active}
                onClick={() => select(opt.value)}
                className={`flex items-center justify-between w-full text-left px-3 py-1.5 text-sm transition-colors
                  focus-visible:outline-dotted focus-visible:outline-1 focus-visible:outline-wiki-text
                  ${active
                    ? "bg-wiki-tab-bg text-wiki-link font-medium"
                    : "text-wiki-text hover:bg-wiki-tab-bg"
                  }`}
              >
                <span>{opt.label}</span>
                {active && <span aria-hidden className="text-wiki-link ml-2">✓</span>}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
