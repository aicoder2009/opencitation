import Link from "next/link";
import { WikiBreadcrumbs } from "@/components/wiki/wiki-breadcrumbs";
import { getDocContent } from "@/lib/docs";

export const metadata = { title: "Lists & Projects — OpenCitation Docs" };

export default async function Organize() {
  const html = await getDocContent("organize");

  return (
    <div>
      <WikiBreadcrumbs items={[{ label: "Docs", href: "/docs" }, { label: "Lists & Projects" }]} />
      <div className="docs-content" dangerouslySetInnerHTML={{ __html: html }} />
      <div className="flex justify-between mt-10 pt-4 border-t border-wiki-border-light text-sm">
        <Link href="/docs/source-types" className="text-wiki-link hover:underline">
          ← Source Types
        </Link>
        <Link href="/docs/sharing" className="text-wiki-link hover:underline">
          Next: Sharing & Export →
        </Link>
      </div>
    </div>
  );
}
