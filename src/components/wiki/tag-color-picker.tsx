"use client";

import { useEffect, useRef } from "react";
import { TAG_COLORS } from "@/lib/tag-colors";

interface TagColorPickerProps {
  currentColor: string;
  onPick: (colorName: string) => void;
  onClose: () => void;
}

export function TagColorPicker({ currentColor, onPick, onClose }: TagColorPickerProps) {
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
      aria-label="Pick tag color"
      className="absolute top-full left-0 z-20 mt-1 p-2 bg-wiki-white border border-wiki-border-light shadow-md"
      onClick={(e) => e.stopPropagation()}
    >
      <div className="grid grid-cols-5 gap-1">
        {TAG_COLORS.map((c) => (
          <button
            key={c.name}
            type="button"
            onClick={() => {
              onPick(c.name);
              onClose();
            }}
            className={`w-5 h-5 border ${c.bg} ${c.border} hover:scale-110 transition-transform ${
              c.name === currentColor ? "ring-2 ring-wiki-link ring-offset-1" : ""
            }`}
            title={c.name}
            aria-label={`Set color to ${c.name}`}
          />
        ))}
      </div>
    </div>
  );
}
