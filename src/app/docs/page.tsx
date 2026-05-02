import Link from "next/link";
import { WikiBreadcrumbs } from "@/components/wiki/wiki-breadcrumbs";

export const metadata = { title: "Documentation — OpenCitation" };

const sections = [
  {
    href: "/docs/getting-started",
    label: "Getting Started",
    description: "Create an account, generate your first citation, and set up the PWA.",
  },
  {
    href: "/docs/citations",
    label: "Generating Citations",
    description: "Use Quick Add to auto-fill from a URL, DOI, ISBN, PubMed ID, or arXiv ID. Or enter fields manually.",
  },
  {
    href: "/docs/styles",
    label: "Citation Styles",
    description: "APA 7th, MLA 9th, Chicago 17th, and Harvard — how each one formats your sources.",
  },
  {
    href: "/docs/source-types",
    label: "Source Types",
    description: "All 27 supported source types: books, journals, websites, videos, datasets, AI content, and more.",
  },
  {
    href: "/docs/organize",
    label: "Lists & Projects",
    description: "Organize citations into Lists. Group Lists into Projects for courses, theses, or research.",
  },
  {
    href: "/docs/sharing",
    label: "Sharing & Export",
    description: "Share via public link, export as plain text, BibTeX (.bib), or RIS (.ris), or embed a badge.",
  },
  {
    href: "/docs/keyboard-shortcuts",
    label: "Keyboard Shortcuts",
    description: "Power-user shortcuts for the citation page and list view.",
  },
  {
    href: "/docs/browser-extension",
    label: "Browser Extension",
    description: "Cite any webpage in one click from Chrome, Edge, or Firefox.",
  },
];

export default function DocsIndex() {
  return (
    <div>
      <WikiBreadcrumbs items={[{ label: "Docs" }]} />
      <h1 className="text-2xl font-bold mt-2 mb-1">OpenCitation Documentation</h1>
      <p className="text-wiki-text-muted text-sm mb-6">
        Everything you need to generate, organize, and share citations.
      </p>

      <div className="border border-wiki-border-light bg-wiki-offwhite p-4 mb-8 text-sm">
        <p className="mb-2">
          <strong>New here?</strong> Start with{" "}
          <Link href="/docs/getting-started" className="text-wiki-link hover:underline">
            Getting Started
          </Link>{" "}
          to create your first citation in under a minute.
        </p>
        <p>
          Want the short version?{" "}
          <Link href="/help" className="text-wiki-link hover:underline">
            Read the Help page
          </Link>{" "}
          — it covers everything on one page.
        </p>
      </div>

      <h2 className="text-xl font-bold border-b border-wiki-border-light pb-1 mb-4">Contents</h2>
      <div className="space-y-0">
        {sections.map((s, i) => (
          <div key={s.href} className="flex gap-3 py-3 border-b border-wiki-border-light last:border-0">
            <span className="text-wiki-text-muted text-sm w-5 shrink-0 pt-px">{i + 1}.</span>
            <div>
              <Link href={s.href} className="text-wiki-link hover:underline font-medium text-sm">
                {s.label}
              </Link>
              <p className="text-sm text-wiki-text-muted mt-0.5">{s.description}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-8 border border-wiki-border-light bg-wiki-offwhite p-3 text-xs text-wiki-text-muted">
        Found a problem?{" "}
        <a
          href="https://github.com/aicoder2009/opencitation/issues"
          target="_blank"
          rel="noopener noreferrer"
          className="text-wiki-link hover:underline"
        >
          Open an issue on GitHub
        </a>
        .
      </div>
    </div>
  );
}
