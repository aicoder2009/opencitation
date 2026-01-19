"use client";

import Link from "next/link";

interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface WikiBreadcrumbsProps {
  items: BreadcrumbItem[];
}

export function WikiBreadcrumbs({ items }: WikiBreadcrumbsProps) {
  return (
    <nav className="text-sm text-wiki-text-muted" aria-label="Breadcrumb">
      <ol className="flex flex-wrap items-center gap-1">
        {items.map((item, index) => {
          const isLast = index === items.length - 1;

          return (
            <li key={index} className="flex items-center gap-1">
              {item.href && !isLast ? (
                <Link href={item.href} className="text-wiki-link hover:underline">
                  {item.label}
                </Link>
              ) : (
                <span className={isLast ? "text-wiki-text" : ""}>
                  {item.label}
                </span>
              )}
              {!isLast && (
                <span className="text-wiki-text-muted" aria-hidden="true">
                  {" > "}
                </span>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
