"use client";

import { useState, useId } from "react";

interface WikiCollapsibleProps {
  title: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
}

export function WikiCollapsible({
  title,
  children,
  defaultOpen = true,
}: WikiCollapsibleProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  const contentId = useId();

  return (
    <div className="border border-wiki-border-light bg-wiki-offwhite">
      <button
        onClick={() => setIsOpen(!isOpen)}
        aria-expanded={isOpen}
        aria-controls={contentId}
        className="w-full flex items-center justify-between px-4 py-2 border-b border-wiki-border-light bg-wiki-tab-bg hover:bg-wiki-white transition-colors focus-visible:outline-dotted focus-visible:outline-1 focus-visible:outline-wiki-text text-left cursor-pointer"
      >
        <span className="font-medium text-sm text-wiki-text">{title}</span>
        <span className="text-wiki-link text-sm hover:underline">
          [{isOpen ? "hide" : "show"}]
        </span>
      </button>
      {isOpen && (
        <div id={contentId} className="px-4 py-3">
          {children}
        </div>
      )}
    </div>
  );
}
