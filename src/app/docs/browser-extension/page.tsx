import Link from "next/link";
import { WikiBreadcrumbs } from "@/components/wiki/wiki-breadcrumbs";
import { getDocContent } from "@/lib/docs";

export const metadata = { title: "Browser Extension — OpenCitation Docs" };

export default async function BrowserExtension() {
  const html = await getDocContent("browser-extension");

  return (
    <div>
      <WikiBreadcrumbs items={[{ label: "Docs", href: "/docs" }, { label: "Browser Extension" }]} />
      <div className="docs-content" dangerouslySetInnerHTML={{ __html: html }} />
      <div className="flex justify-between mt-10 pt-4 border-t border-wiki-border-light text-sm">
        <Link href="/docs/keyboard-shortcuts" className="text-wiki-link hover:underline">
          ← Keyboard Shortcuts
        </Link>
        <Link href="/docs" className="text-wiki-link hover:underline">
          ↑ Docs overview
        </Link>
      </div>
    </div>
  );
}
