import Link from "next/link";
import { WikiBreadcrumbs } from "@/components/wiki/wiki-breadcrumbs";
import { getDocContent } from "@/lib/docs";

export const metadata = { title: "Generating Citations — OpenCitation Docs" };

export default async function Citations() {
  const html = await getDocContent("citations");

  return (
    <div>
      <WikiBreadcrumbs items={[{ label: "Docs", href: "/docs" }, { label: "Generating Citations" }]} />
      <div className="docs-content" dangerouslySetInnerHTML={{ __html: html }} />
      <div className="flex justify-between mt-10 pt-4 border-t border-wiki-border-light text-sm">
        <Link href="/docs/getting-started" className="text-wiki-link hover:underline">
          ← Getting Started
        </Link>
        <Link href="/docs/styles" className="text-wiki-link hover:underline">
          Next: Citation Styles →
        </Link>
      </div>
    </div>
  );
}
