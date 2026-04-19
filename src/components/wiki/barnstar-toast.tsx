"use client";

import { useEffect } from "react";
import { useBarnstarAward } from "@/lib/barnstar";

export function BarnstarToast() {
  const { award, dismiss } = useBarnstarAward();

  useEffect(() => {
    if (!award) return;
    const t = window.setTimeout(dismiss, 10000);
    return () => window.clearTimeout(t);
  }, [award, dismiss]);

  if (!award) return null;

  return (
    <div
      className="fixed bottom-4 right-4 z-50 max-w-sm w-[calc(100vw-2rem)] sm:w-80 border border-wiki-border bg-wiki-white shadow-lg p-4 text-sm"
      role="status"
      aria-live="polite"
    >
      <div className="flex items-start gap-3">
        <BarnstarSvg />
        <div className="flex-1 min-w-0">
          <div className="font-bold text-wiki-text mb-0.5">{award.title}</div>
          <div className="text-wiki-text-muted text-xs mb-2">
            {award.count} citation{award.count === 1 ? "" : "s"} saved
          </div>
          <p className="text-wiki-text text-xs leading-relaxed">{award.blurb}</p>
        </div>
        <button
          onClick={dismiss}
          className="text-wiki-text-muted hover:text-wiki-text text-xs"
          aria-label="Dismiss"
        >
          [×]
        </button>
      </div>
    </div>
  );
}

function BarnstarSvg() {
  return (
    <svg
      width="48"
      height="48"
      viewBox="0 0 100 100"
      aria-hidden
      className="flex-shrink-0"
    >
      <defs>
        <radialGradient id="barnstar-gold" cx="50%" cy="45%" r="55%">
          <stop offset="0%" stopColor="#fff6c7" />
          <stop offset="55%" stopColor="#f5c431" />
          <stop offset="100%" stopColor="#a47712" />
        </radialGradient>
      </defs>
      <polygon
        points="50,4 61,37 96,37 68,58 79,92 50,71 21,92 32,58 4,37 39,37"
        fill="url(#barnstar-gold)"
        stroke="#6b4b0a"
        strokeWidth="2"
        strokeLinejoin="round"
      />
    </svg>
  );
}
