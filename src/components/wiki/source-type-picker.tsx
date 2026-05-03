"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { WikiButton } from "./wiki-button";
import type { SourceType } from "@/types";

interface SourceTypeOption {
  value: SourceType;
  label: string;
}

interface SourceTypeGroup {
  heading: string;
  items: SourceTypeOption[];
}

interface SourceTypePickerProps {
  options: ReadonlyArray<SourceTypeOption>;
  /** Source types shown as buttons. Anything else lives behind "More". */
  pinned: ReadonlyArray<SourceType>;
  /** Optional grouping for the "More" menu. Items not in any group land under "Other". */
  groups?: ReadonlyArray<{ heading: string; values: ReadonlyArray<SourceType> }>;
  value: SourceType;
  onChange: (next: SourceType) => void;
}

export function SourceTypePicker({
  options,
  pinned,
  groups,
  value,
  onChange,
}: SourceTypePickerProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const byValue = useMemo(() => new Map(options.map((o) => [o.value, o])), [options]);
  const pinnedSet = useMemo(() => new Set(pinned), [pinned]);
  const pinnedOptions = useMemo(
    () => pinned.map((v) => byValue.get(v)).filter((o): o is SourceTypeOption => !!o),
    [pinned, byValue]
  );
  const moreActive = !pinnedSet.has(value);
  const moreLabel = moreActive
    ? `More: ${byValue.get(value)?.label ?? "…"}`
    : "More";

  const groupedRest = useMemo<SourceTypeGroup[]>(() => {
    const restValues = options.filter((o) => !pinnedSet.has(o.value));
    if (!groups) return [{ heading: "All", items: restValues }];

    const taken = new Set<SourceType>();
    const built: SourceTypeGroup[] = [];
    for (const g of groups) {
      const items = g.values
        .filter((v) => !pinnedSet.has(v))
        .map((v) => {
          taken.add(v);
          return byValue.get(v);
        })
        .filter((o): o is SourceTypeOption => !!o);
      if (items.length > 0) built.push({ heading: g.heading, items });
    }
    const leftovers = restValues.filter((o) => !taken.has(o.value));
    if (leftovers.length > 0) built.push({ heading: "Other", items: leftovers });
    return built;
  }, [options, groups, pinnedSet, byValue]);

  const filteredGroups = useMemo<SourceTypeGroup[]>(() => {
    const q = query.trim().toLowerCase();
    if (!q) return groupedRest;
    return groupedRest
      .map((g) => ({
        heading: g.heading,
        items: g.items.filter((i) => i.label.toLowerCase().includes(q)),
      }))
      .filter((g) => g.items.length > 0);
  }, [groupedRest, query]);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
        setQuery("");
      }
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") { setOpen(false); setQuery(""); }
    };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  // Focus the search input on open; do not call setState inside this effect.
  useEffect(() => {
    if (!open) return;
    const t = window.setTimeout(() => inputRef.current?.focus(), 0);
    return () => window.clearTimeout(t);
  }, [open]);

  const close = () => {
    setOpen(false);
    setQuery("");
  };

  const select = (next: SourceType) => {
    onChange(next);
    close();
  };

  return (
    <div ref={containerRef}>
      <div className="flex flex-wrap gap-2">
        {pinnedOptions.map((type) => (
          <WikiButton
            key={type.value}
            variant={value === type.value ? "primary" : "default"}
            onClick={() => select(type.value)}
            className={value === type.value ? "border-wiki-link" : ""}
          >
            {type.label}
          </WikiButton>
        ))}

        {/* Wrap the More button + dropdown together so the dropdown aligns to the button */}
        <div className="relative">
          <WikiButton
            variant={moreActive ? "primary" : "default"}
            onClick={() => (open ? close() : setOpen(true))}
            aria-haspopup="menu"
            aria-expanded={open}
            className={moreActive ? "border-wiki-link" : ""}
          >
            {moreLabel} <span aria-hidden>▾</span>
          </WikiButton>

          {open && (
            <div
              role="menu"
              className="absolute z-20 top-full left-0 mt-1 bg-wiki-white border border-wiki-border-light shadow-md"
              style={{ minWidth: 260 }}
            >
              {/* Search — not inside the scroll area so it stays visible */}
              <div className="p-2 border-b border-wiki-border-light bg-wiki-offwhite">
                <input
                  ref={inputRef}
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search source types…"
                  className="w-full px-2 py-1.5 text-sm bg-wiki-white border border-wiki-border-light placeholder:text-wiki-text-muted focus-visible:outline-dotted focus-visible:outline-1 focus-visible:outline-wiki-text"
                  aria-label="Filter source types"
                />
              </div>

              {/* Items — independently scrollable */}
              <div className="max-h-72 overflow-y-auto">
                {filteredGroups.length === 0 ? (
                  <div className="px-3 py-3 text-sm text-wiki-text-muted italic">No matches.</div>
                ) : (
                  filteredGroups.map((group, gi) => (
                    <div key={group.heading}>
                      {gi > 0 && <div className="border-t border-wiki-border-light" />}
                      <div className="px-3 py-1.5 text-xs font-semibold uppercase tracking-wide text-wiki-text-muted bg-wiki-offwhite border-b border-wiki-border-light">
                        {group.heading}
                      </div>
                      {group.items.map((item) => {
                        const active = value === item.value;
                        return (
                          <button
                            key={item.value}
                            type="button"
                            role="menuitem"
                            onClick={() => select(item.value)}
                            className={`flex items-center justify-between w-full text-left px-3 py-1.5 text-sm transition-colors
                              focus-visible:outline-dotted focus-visible:outline-1 focus-visible:outline-wiki-text
                              ${active
                                ? "bg-wiki-tab-bg text-wiki-link font-medium"
                                : "text-wiki-text hover:bg-wiki-tab-bg"
                              }`}
                          >
                            <span>{item.label}</span>
                            {active && <span aria-hidden className="text-wiki-link ml-2">✓</span>}
                          </button>
                        );
                      })}
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
