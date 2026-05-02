"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export const DOCS_NAV = [
  { label: "Overview", href: "/docs" },
  { label: "Getting Started", href: "/docs/getting-started" },
  { label: "Generating Citations", href: "/docs/citations" },
  { label: "Citation Styles", href: "/docs/styles" },
  { label: "Source Types", href: "/docs/source-types" },
  { label: "Lists & Projects", href: "/docs/organize" },
  { label: "Sharing & Export", href: "/docs/sharing" },
  { label: "Keyboard Shortcuts", href: "/docs/keyboard-shortcuts" },
  { label: "Browser Extension", href: "/docs/browser-extension" },
];

export function WikiDocsSidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-44 shrink-0 sticky top-6 self-start">
      <div className="border border-wiki-border-light">
        <div className="px-3 py-2 bg-wiki-tab-bg border-b border-wiki-border-light">
          <span className="text-sm font-bold text-wiki-text">Documentation</span>
        </div>
        <nav className="py-1">
          {DOCS_NAV.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`block px-3 py-1 text-sm ${
                  isActive
                    ? "font-medium text-wiki-text bg-wiki-tab-bg"
                    : "text-wiki-link hover:underline"
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>
      </div>
      <div className="mt-3 border border-wiki-border-light px-3 py-2 text-xs text-wiki-text-muted">
        <Link href="/help" className="text-wiki-link hover:underline">Help page</Link>
        {" · "}
        <a
          href="https://github.com/aicoder2009/opencitation/issues"
          target="_blank"
          rel="noopener noreferrer"
          className="text-wiki-link hover:underline"
        >
          Report issue
        </a>
      </div>
    </aside>
  );
}
