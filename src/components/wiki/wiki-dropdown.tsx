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
  disabled?: boolean;
}

export function WikiDropdown({ label, items, align = "left", disabled = false }: WikiDropdownProps) {
  const [open, setOpen] = useState(false);
  const [focusedIndex, setFocusedIndex] = useState(-1);
  const ref = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const itemRefs = useRef<(HTMLButtonElement | null)[]>([]);

  // Close on outside click / Escape; arrow-key navigation
  useEffect(() => {
    if (!open) return;
    const onMouseDown = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
        setFocusedIndex(-1);
      }
    };
    document.addEventListener("mousedown", onMouseDown);
    return () => document.removeEventListener("mousedown", onMouseDown);
  }, [open]);

  // Focus first item when menu opens
  useEffect(() => {
    if (open) {
      setFocusedIndex(0);
    }
  }, [open]);

  // Move DOM focus when focusedIndex changes
  useEffect(() => {
    if (open && focusedIndex >= 0) {
      itemRefs.current[focusedIndex]?.focus();
    }
  }, [open, focusedIndex]);

  const close = () => {
    setOpen(false);
    setFocusedIndex(-1);
    triggerRef.current?.focus();
  };

  const handleTriggerKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown" || e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      if (!disabled) setOpen(true);
    } else if (e.key === "Escape") {
      close();
    }
  };

  const handleItemKeyDown = (e: React.KeyboardEvent, index: number) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setFocusedIndex((index + 1) % items.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setFocusedIndex((index - 1 + items.length) % items.length);
    } else if (e.key === "Home") {
      e.preventDefault();
      setFocusedIndex(0);
    } else if (e.key === "End") {
      e.preventDefault();
      setFocusedIndex(items.length - 1);
    } else if (e.key === "Escape" || e.key === "Tab") {
      close();
    }
  };

  return (
    <div ref={ref} className="relative inline-block">
      <button
        ref={triggerRef}
        type="button"
        onClick={() => !disabled && setOpen((v) => !v)}
        onKeyDown={handleTriggerKeyDown}
        aria-haspopup="menu"
        aria-expanded={open}
        disabled={disabled}
        className="px-4 py-2 text-sm border border-wiki-border-light bg-wiki-white text-wiki-text hover:bg-wiki-tab-bg active:bg-wiki-border-light focus-visible:outline-dotted focus-visible:outline-1 focus-visible:outline-wiki-text cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {label} <span aria-hidden>▾</span>
      </button>
      {open && (
        <div
          role="menu"
          aria-label={label}
          className={`absolute z-20 mt-1 min-w-[200px] bg-wiki-white border border-wiki-border-light shadow-md ${
            align === "right" ? "right-0" : "left-0"
          }`}
        >
          {items.map((item, index) => (
            <button
              key={item.label}
              ref={(el) => { itemRefs.current[index] = el; }}
              type="button"
              role="menuitem"
              tabIndex={focusedIndex === index ? 0 : -1}
              onClick={() => {
                item.onClick();
                close();
              }}
              onKeyDown={(e) => handleItemKeyDown(e, index)}
              className="block w-full text-left px-3 py-2 text-sm hover:bg-wiki-tab-bg cursor-pointer focus-visible:outline-dotted focus-visible:outline-1 focus-visible:outline-wiki-text"
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
