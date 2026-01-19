"use client";

import { useState } from "react";

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

  return (
    <div className="border border-wiki-border-light bg-wiki-offwhite">
      <div className="flex items-center justify-between px-4 py-2 border-b border-wiki-border-light bg-wiki-tab-bg">
        <span className="font-medium text-sm">{title}</span>
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="text-wiki-link text-sm hover:underline"
        >
          [{isOpen ? "hide" : "show"}]
        </button>
      </div>
      {isOpen && <div className="px-4 py-3">{children}</div>}
    </div>
  );
}
