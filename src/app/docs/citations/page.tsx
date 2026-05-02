import Link from "next/link";
import { WikiBreadcrumbs } from "@/components/wiki/wiki-breadcrumbs";

export const metadata = { title: "Generating Citations — OpenCitation Docs" };

export default function Citations() {
  return (
    <div>
      <WikiBreadcrumbs items={[{ label: "Docs", href: "/docs" }, { label: "Generating Citations" }]} />

      <h1 className="text-2xl font-bold mt-2 mb-1">Generating Citations</h1>
      <p className="text-wiki-text-muted text-sm mb-6">
        Two paths: auto-fill from an identifier, or enter fields manually.
      </p>

      <h2 className="text-xl font-bold border-b border-wiki-border-light pb-1 mb-3 mt-8">Quick Add</h2>
      <p className="text-sm mb-3 leading-relaxed">
        Quick Add fetches metadata automatically. Paste any of the supported identifiers into the input and click <strong>Generate</strong>.
      </p>

      <h3 className="text-base font-bold mt-4 mb-1">Supported identifiers</h3>
      <table className="w-full border-collapse text-sm mb-4">
        <thead>
          <tr className="bg-wiki-tab-bg">
            <th className="border border-wiki-border px-3 py-1 text-left font-medium">Type</th>
            <th className="border border-wiki-border px-3 py-1 text-left font-medium">Format</th>
            <th className="border border-wiki-border px-3 py-1 text-left font-medium">Data source</th>
          </tr>
        </thead>
        <tbody>
          {[
            ["URL", "Any https:// address", "OpenGraph / page metadata"],
            ["DOI", "10.xxxx/xxxxx", "CrossRef"],
            ["ISBN-10 / ISBN-13", "0385533349 or 9780385533348", "Open Library, Google Books"],
            ["PubMed ID", "PMID:12345678 or just the number", "PubMed API"],
            ["arXiv ID", "arXiv:2301.00001 or 2301.00001", "arXiv API"],
            ["Wikipedia title", "Paste the article title", "Wikipedia API"],
          ].map(([type, format, source], i) => (
            <tr key={type} className={i % 2 === 1 ? "bg-wiki-offwhite" : ""}>
              <td className="border border-wiki-border px-3 py-1 font-medium">{type}</td>
              <td className="border border-wiki-border px-3 py-1 font-mono text-xs">{format}</td>
              <td className="border border-wiki-border px-3 py-1 text-wiki-text-muted">{source}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="border border-wiki-border-light bg-wiki-offwhite p-3 text-sm mb-4">
        <strong>Tip:</strong> OpenCitation auto-detects the identifier type — you don&apos;t need to select it manually. Just paste and generate.
      </div>

      <h3 className="text-base font-bold mt-4 mb-1">When auto-fill is incomplete</h3>
      <p className="text-sm mb-3 leading-relaxed">
        Metadata APIs sometimes return incomplete data — a missing publisher, wrong year, or no page numbers. Always review the filled fields before saving. You can edit any field directly in the form after lookup.
      </p>

      <h2 className="text-xl font-bold border-b border-wiki-border-light pb-1 mb-3 mt-8">Manual Entry</h2>
      <p className="text-sm mb-3 leading-relaxed">
        Switch to the <strong>Manual</strong> tab on the citation page. Select your source type first — the form shows only the fields relevant to that type. Required fields are marked.
      </p>

      <h3 className="text-base font-bold mt-4 mb-1">Common fields</h3>
      <table className="w-full border-collapse text-sm mb-4">
        <thead>
          <tr className="bg-wiki-tab-bg">
            <th className="border border-wiki-border px-3 py-1 text-left font-medium">Field</th>
            <th className="border border-wiki-border px-3 py-1 text-left font-medium">Notes</th>
          </tr>
        </thead>
        <tbody>
          {[
            ["Authors", "Enter each author as 'Last, First'. Separate multiple authors with a new line."],
            ["Title", "Use the exact title. For articles, do not add quotes — the formatter does that."],
            ["Year", "4-digit publication year."],
            ["URL / DOI", "Include for online sources so readers can verify access."],
            ["Access date", "Required by some styles for web sources. Defaults to today."],
            ["Pages", "Use 'pp. 12–34' format or just '12–34'; the formatter normalizes it."],
          ].map(([field, note], i) => (
            <tr key={field} className={i % 2 === 1 ? "bg-wiki-offwhite" : ""}>
              <td className="border border-wiki-border px-3 py-1 font-medium">{field}</td>
              <td className="border border-wiki-border px-3 py-1 text-wiki-text-muted">{note}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <h2 className="text-xl font-bold border-b border-wiki-border-light pb-1 mb-3 mt-8">Citation Templates</h2>
      <p className="text-sm mb-3 leading-relaxed">
        The <strong>Templates</strong> button (top-right of the form) shows pre-filled examples for common sources — a journal article, a book, a news article, etc. Selecting a template populates the form so you can edit rather than type from scratch.
      </p>

      <h2 className="text-xl font-bold border-b border-wiki-border-light pb-1 mb-3 mt-8">Copying & Saving</h2>
      <p className="text-sm mb-3 leading-relaxed">
        Once generated, the formatted citation appears at the bottom. Click <strong>Copy</strong> to copy it to your clipboard. Click <strong>Save to List</strong> to persist it — you&apos;ll be prompted to choose or create a List.
      </p>

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
