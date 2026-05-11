import Link from "next/link";
import { WikiBreadcrumbs } from "@/components/wiki/wiki-breadcrumbs";

export const metadata = { title: "Browser Extension — OpenCitation Docs" };

export default function BrowserExtensionPage() {
  return (
    <div>
      <WikiBreadcrumbs
        items={[
          { label: "Docs", href: "/docs" },
          { label: "Browser Extension" },
        ]}
      />
      <h1 className="text-2xl font-bold mb-4">Browser Extension</h1>
      <p className="text-wiki-text-muted">Coming soon.</p>
      <div className="flex justify-start mt-10 pt-4 border-t border-wiki-border-light text-sm">
        <Link href="/docs/keyboard-shortcuts" className="text-wiki-link hover:underline">
          ← Keyboard Shortcuts
        </Link>
      </div>
    </div>
  );
}
