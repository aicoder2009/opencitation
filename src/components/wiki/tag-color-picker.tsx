"use client";

import { useEffect, useRef } from "react";
import { TAG_COLORS } from "@/lib/tag-colors";

interface TagColorPickerProps {
  tagName: string;
  currentColor: string;
  onPick: (colorName: string) => void;
  onReset?: () => void;
  onClose: () => void;
}

export function TagColorPicker({ tagName, currentColor, onPick, onReset, onClose }: TagColorPickerProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onMouseDown = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("mousedown", onMouseDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onMouseDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [onClose]);

  return (
    <div
      ref={ref}
      role="dialog"
      aria-label={`Pick color for ${tagName}`}
      className="absolute top-full left-0 z-20 mt-1 p-3 bg-wiki-white border border-wiki-border-light shadow-md w-64"
      onClick={(e) => e.stopPropagation()}
    >
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-medium text-wiki-text-muted">
          Color for <span className="text-wiki-text">{tagName}</span>
        </span>
        {onReset && (
          <button
            type="button"
            onClick={() => {
              onReset();
              onClose();
            }}
            className="text-xs text-wiki-link hover:underline"
          >
            reset
          </button>
        )}
      </div>
      <div className="grid grid-cols-5 gap-1.5">
        {TAG_COLORS.map((c) => {
          const isActive = c.name === currentColor;
          return (
            <button
              key={c.name}
              type="button"
              onClick={() => {
                onPick(c.name);
                onClose();
              }}
              className={`flex flex-col items-center gap-1 p-1 border hover:bg-wiki-tab-bg ${
                isActive ? "border-wiki-link" : "border-transparent"
              }`}
              title={c.name}
              aria-label={`Set color to ${c.name}`}
              aria-pressed={isActive}
            >
              <span
                className={`w-6 h-6 border ${c.bg} ${c.border}`}
                aria-hidden
              />
              <span className="text-[10px] text-wiki-text-muted capitalize">{c.name}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
