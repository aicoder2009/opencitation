import Link from "next/link";
import { WikiBreadcrumbs } from "@/components/wiki/wiki-breadcrumbs";
import { getDocContent } from "@/lib/docs";

export const metadata = { title: "Citation Styles — OpenCitation Docs" };

export default async function Styles() {
  const html = await getDocContent("styles");

  return (
    <div>
      <WikiBreadcrumbs items={[{ label: "Docs", href: "/docs" }, { label: "Citation Styles" }]} />
      <div className="docs-content" dangerouslySetInnerHTML={{ __html: html }} />
      <div className="flex justify-between mt-10 pt-4 border-t border-wiki-border-light text-sm">
        <Link href="/docs/citations" className="text-wiki-link hover:underline">
          ← Generating Citations
        </Link>
        <Link href="/docs/source-types" className="text-wiki-link hover:underline">
          Next: Source Types →
        </Link>
      </div>
    </div>
  );
}
