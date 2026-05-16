"use client";

import { useId } from "react";

interface Tab {
  id: string;
  label: string;
  href?: string;
  active?: boolean;
}

interface WikiTabsProps {
  tabs: Tab[];
  onTabChange?: (tabId: string) => void;
}

export function WikiTabs({ tabs, onTabChange }: WikiTabsProps) {
  const baseId = useId();

  const handleKeyDown = (e: React.KeyboardEvent, currentIdx: number) => {
    if (e.key !== "ArrowLeft" && e.key !== "ArrowRight") return;
    e.preventDefault();
    const dir = e.key === "ArrowRight" ? 1 : -1;
    const next = (currentIdx + dir + tabs.length) % tabs.length;
    onTabChange?.(tabs[next].id);
    document.getElementById(`tab-${baseId}-${tabs[next].id}`)?.focus();
  };

  return (
    <div className="flex border-b border-wiki-border-light" role="tablist" aria-label="Tabs">
      {tabs.map((tab, idx) => (
        <button
          key={tab.id}
          role="tab"
          id={`tab-${baseId}-${tab.id}`}
          aria-selected={!!tab.active}
          aria-controls={`tabpanel-${tab.id}`}
          tabIndex={tab.active ? 0 : -1}
          onClick={() => onTabChange?.(tab.id)}
          onKeyDown={(e) => handleKeyDown(e, idx)}
          className={`
            px-4 py-2 text-sm border border-b-0 -mb-px relative z-10
            transition-colors
            focus-visible:outline-dotted focus-visible:outline-1 focus-visible:outline-wiki-text
            ${
              tab.active
                ? "bg-wiki-white border-wiki-border-light text-wiki-text font-medium"
                : "bg-wiki-tab-bg border-transparent text-wiki-link hover:bg-wiki-offwhite"
            }
            ${tab.active ? "border-b-wiki-white" : ""}
          `}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}
