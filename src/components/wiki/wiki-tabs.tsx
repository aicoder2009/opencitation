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

  return (
    <div className="flex border-b border-wiki-border-light" role="tablist" aria-label="Tabs">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          role="tab"
          id={`tab-${baseId}-${tab.id}`}
          aria-selected={!!tab.active}
          onClick={() => onTabChange?.(tab.id)}
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
