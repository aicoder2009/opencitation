"use client";

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
  return (
    <div className="flex border-b border-wiki-border-light">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => onTabChange?.(tab.id)}
          className={`
            px-4 py-2 text-sm border border-b-0 -mb-px
            transition-colors
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
