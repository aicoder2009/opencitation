import Link from "next/link";
import { WikiBreadcrumbs } from "@/components/wiki/wiki-breadcrumbs";
import { getDocContent } from "@/lib/docs";

export const metadata = { title: "Sharing & Export — OpenCitation Docs" };

export default async function Sharing() {
  const html = await getDocContent("sharing");

  return (
    <div>
      <WikiBreadcrumbs items={[{ label: "Docs", href: "/docs" }, { label: "Sharing & Export" }]} />
      <div className="docs-content" dangerouslySetInnerHTML={{ __html: html }} />
      <div className="flex justify-between mt-10 pt-4 border-t border-wiki-border-light text-sm">
        <Link href="/docs/organize" className="text-wiki-link hover:underline">
          ← Lists & Projects
        </Link>
        <Link href="/docs/keyboard-shortcuts" className="text-wiki-link hover:underline">
          Next: Keyboard Shortcuts →
        </Link>
      </div>
    </div>
  );
}
