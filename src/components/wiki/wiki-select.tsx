"use client";

import { useEffect, useId, useRef, useState } from "react";

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
  /** Accessible label for the trigger button (required when no visible label is associated). */
  "aria-label"?: string;
  /** ID of an external element that labels this select. */
  "aria-labelledby"?: string;
}

export function WikiSelect({
  value,
  onChange,
  options,
  placeholder = "Select…",
  className = "",
  "aria-label": ariaLabel,
  "aria-labelledby": ariaLabelledBy,
}: WikiSelectProps) {
  const [open, setOpen] = useState(false);
  const [focusedIndex, setFocusedIndex] = useState(-1);
  const containerRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const optionRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const listboxId = useId();

  const selected = options.find((o) => o.value === value) ?? null;
  const selectedIndex = options.findIndex((o) => o.value === value);

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
        setFocusedIndex(-1);
      }
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [open]);

  // Move DOM focus as keyboard selection changes
  useEffect(() => {
    if (open && focusedIndex >= 0) {
      optionRefs.current[focusedIndex]?.focus();
    }
  }, [open, focusedIndex]);

  const openMenu = () => {
    setOpen(true);
    setFocusedIndex(selectedIndex >= 0 ? selectedIndex : 0);
  };

  const close = () => {
    setOpen(false);
    setFocusedIndex(-1);
    triggerRef.current?.focus();
  };

  const select = (v: string) => {
    onChange(v);
    close();
  };

  const handleTriggerKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown" || e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      openMenu();
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      openMenu();
    } else if (e.key === "Escape") {
      close();
    }
  };

  const handleOptionKeyDown = (e: React.KeyboardEvent, index: number, optValue: string) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setFocusedIndex((index + 1) % options.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setFocusedIndex((index - 1 + options.length) % options.length);
    } else if (e.key === "Home") {
      e.preventDefault();
      setFocusedIndex(0);
    } else if (e.key === "End") {
      e.preventDefault();
      setFocusedIndex(options.length - 1);
    } else if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      select(optValue);
    } else if (e.key === "Escape" || e.key === "Tab") {
      if (e.key === "Escape") e.preventDefault();
      close();
    }
  };

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      <button
        ref={triggerRef}
        type="button"
        onClick={() => {
          if (open) {
            setOpen(false);
            setFocusedIndex(-1);
          } else {
            openMenu();
          }
        }}
        onKeyDown={handleTriggerKeyDown}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listboxId}
        aria-label={ariaLabel}
        aria-labelledby={ariaLabelledBy}
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
          id={listboxId}
          role="listbox"
          aria-label={ariaLabel}
          aria-labelledby={ariaLabelledBy}
          className="absolute z-20 top-full left-0 right-0 mt-0.5 bg-wiki-white border border-wiki-border-light shadow-md overflow-y-auto"
          style={{ maxHeight: 240 }}
        >
          {options.map((opt, index) => {
            const active = value === opt.value;
            return (
              <button
                key={opt.value}
                ref={(el) => { optionRefs.current[index] = el; }}
                type="button"
                role="option"
                aria-selected={active}
                tabIndex={focusedIndex === index ? 0 : -1}
                onClick={() => select(opt.value)}
                onKeyDown={(e) => handleOptionKeyDown(e, index, opt.value)}
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
