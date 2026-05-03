"use client";

import { usePathname } from "next/navigation";

const REPO = "https://github.com/aicoder2009/opencitation";
const BRANCH = "main";

function pathToFile(pathname: string): string {
  // /docs → src/app/docs/page.tsx
  // /docs/foo → src/app/docs/foo/page.tsx
  const segment = pathname.replace(/^\/docs\/?/, "") || "";
  if (!segment) return "src/app/docs/page.tsx";
  return `src/app/docs/${segment}/page.tsx`;
}

export function DocsEditLink() {
  const pathname = usePathname();
  const filePath = pathToFile(pathname);
  const url = `${REPO}/edit/${BRANCH}/${filePath}`;

  return (
    <div className="mt-10 pt-3 border-t border-wiki-border-light text-xs text-wiki-text-muted flex items-center justify-between gap-4">
      <span>
        Found an error?{" "}
        <a
          href={`${REPO}/issues`}
          target="_blank"
          rel="noopener noreferrer"
          className="text-wiki-link hover:underline"
        >
          Open an issue
        </a>
        .
      </span>
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className="text-wiki-link hover:underline shrink-0"
      >
        Edit on GitHub ↗
      </a>
    </div>
  );
}
