"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export const DOCS_NAV = [
  { label: "Overview & Help", href: "/docs" },
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
      <div className="border border-wiki-border-light mt-0 border-t-0">
        <div className="px-3 py-2 bg-wiki-tab-bg border-b border-wiki-border-light">
          <span className="text-sm font-bold text-wiki-text">Reference</span>
        </div>
        <nav className="py-1">
          <Link
            href="/docs/changelog"
            className={`block px-3 py-1 text-sm ${
              pathname === "/docs/changelog"
                ? "font-medium text-wiki-text bg-wiki-tab-bg"
                : "text-wiki-link hover:underline"
            }`}
          >
            Changelog
          </Link>
          <a
            href="https://github.com/aicoder2009/opencitation/issues"
            target="_blank"
            rel="noopener noreferrer"
            className="block px-3 py-1 text-sm text-wiki-link hover:underline"
          >
            Report issue ↗
          </a>
          <a
            href="https://github.com/aicoder2009/opencitation"
            target="_blank"
            rel="noopener noreferrer"
            className="block px-3 py-1 text-sm text-wiki-link hover:underline"
          >
            GitHub ↗
          </a>
        </nav>
      </div>
    </aside>
  );
}
