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
  const pinnedOptions = useMemo(
    () => pinned.map((v) => byValue.get(v)).filter((o): o is SourceTypeOption => !!o),
    [pinned, byValue]
  );
  const isPinned = (v: SourceType) => pinned.includes(v);

  const groupedRest = useMemo<SourceTypeGroup[]>(() => {
    const restValues = options.filter((o) => !isPinned(o.value));
    if (!groups) return [{ heading: "All", items: restValues }];

    const taken = new Set<SourceType>();
    const built: SourceTypeGroup[] = [];
    for (const g of groups) {
      const items = g.values
        .filter((v) => !isPinned(v))
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [options, groups, pinned]);

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

  // Outside click + Escape close the menu.
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

  // When opening, focus the search input so keyboard users can type immediately.
  useEffect(() => {
    if (open) {
      const t = window.setTimeout(() => inputRef.current?.focus(), 0);
      return () => window.clearTimeout(t);
    }
    setQuery("");
  }, [open]);

  const moreActive = !pinned.includes(value);
  const moreLabel = moreActive
    ? `More: ${byValue.get(value)?.label ?? "…"}`
    : "More…";

  const select = (next: SourceType) => {
    onChange(next);
    setOpen(false);
  };

  return (
    <div ref={containerRef} className="relative">
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
        <WikiButton
          variant={moreActive ? "primary" : "default"}
          onClick={() => setOpen((v) => !v)}
          aria-haspopup="menu"
          aria-expanded={open}
          className={moreActive ? "border-wiki-link" : ""}
        >
          {moreLabel} <span aria-hidden>▾</span>
        </WikiButton>
      </div>

      {open && (
        <div
          role="menu"
          className="absolute z-20 mt-1 w-full max-w-sm bg-wiki-white border border-wiki-border-light shadow-md max-h-80 overflow-y-auto"
        >
          <div className="p-2 border-b border-wiki-border-light bg-wiki-offwhite">
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Filter source types…"
              className="w-full"
              aria-label="Filter source types"
            />
          </div>
          {filteredGroups.length === 0 ? (
            <div className="px-3 py-3 text-sm text-wiki-text-muted">No matches.</div>
          ) : (
            filteredGroups.map((group) => (
              <div key={group.heading}>
                <div className="px-3 pt-2 pb-1 text-xs uppercase tracking-wide text-wiki-text-muted">
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
                      className={`block w-full text-left px-3 py-1.5 text-sm hover:bg-wiki-tab-bg focus-visible:outline-dotted focus-visible:outline-1 focus-visible:outline-wiki-text ${
                        active ? "text-wiki-link font-medium" : "text-wiki-text"
                      }`}
                    >
                      {item.label}
                    </button>
                  );
                })}
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
