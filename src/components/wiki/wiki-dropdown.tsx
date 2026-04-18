"use client";

import { useEffect, useRef, useState } from "react";

export interface DropdownItem {
  label: string;
  onClick: () => void;
  hint?: string;
}

interface WikiDropdownProps {
  label: string;
  items: DropdownItem[];
  align?: "left" | "right";
}

export function WikiDropdown({ label, items, align = "left" }: WikiDropdownProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onMouseDown = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onMouseDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onMouseDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div ref={ref} className="relative inline-block">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="menu"
        aria-expanded={open}
        className="px-4 py-2 text-sm border border-wiki-border-light bg-wiki-white text-wiki-text hover:bg-wiki-tab-bg active:bg-wiki-border-light focus-visible:outline-dotted focus-visible:outline-1 focus-visible:outline-wiki-text cursor-pointer"
      >
        {label} <span aria-hidden>▾</span>
      </button>
      {open && (
        <div
          role="menu"
          className={`absolute z-20 mt-1 min-w-[200px] bg-wiki-white border border-wiki-border-light shadow-md ${
            align === "right" ? "right-0" : "left-0"
          }`}
        >
          {items.map((item) => (
            <button
              key={item.label}
              type="button"
              role="menuitem"
              onClick={() => {
                item.onClick();
                setOpen(false);
              }}
              className="block w-full text-left px-3 py-2 text-sm hover:bg-wiki-tab-bg cursor-pointer"
            >
              <span className="text-wiki-text">{item.label}</span>
              {item.hint && (
                <span className="ml-2 text-xs text-wiki-text-muted">{item.hint}</span>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
