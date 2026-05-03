import Link from "next/link";
import { WikiBreadcrumbs } from "@/components/wiki/wiki-breadcrumbs";
import { getDocContent } from "@/lib/docs";

export const metadata = { title: "Getting Started — OpenCitation Docs" };

export default async function GettingStarted() {
  const html = await getDocContent("getting-started");

  return (
    <div>
      <WikiBreadcrumbs items={[{ label: "Docs", href: "/docs" }, { label: "Getting Started" }]} />
      <div className="docs-content" dangerouslySetInnerHTML={{ __html: html }} />
      <div className="flex justify-end mt-10 pt-4 border-t border-wiki-border-light text-sm">
        <Link href="/docs/citations" className="text-wiki-link hover:underline">
          Next: Generating Citations →
        </Link>
      </div>
    </div>
  );
}
