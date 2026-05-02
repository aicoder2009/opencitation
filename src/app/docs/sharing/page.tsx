import Link from "next/link";
import { WikiBreadcrumbs } from "@/components/wiki/wiki-breadcrumbs";

export const metadata = { title: "Sharing & Export — OpenCitation Docs" };

export default function Sharing() {
  return (
    <div>
      <WikiBreadcrumbs items={[{ label: "Docs", href: "/docs" }, { label: "Sharing & Export" }]} />

      <h1 className="text-2xl font-bold mt-2 mb-1">Sharing & Export</h1>
      <p className="text-wiki-text-muted text-sm mb-6">
        Share a read-only link, download in three formats, or embed a badge on any site.
      </p>

      <h2 className="text-xl font-bold border-b border-wiki-border-light pb-1 mb-3 mt-4">Public share links</h2>
      <p className="text-sm mb-3 leading-relaxed">
        Any List or Project can be shared via a public link. The recipient does not need an OpenCitation account to view it.
      </p>

      <h3 className="text-base font-bold mt-4 mb-1">Creating a share link</h3>
      <p className="text-sm mb-3 leading-relaxed">
        Open a List or Project and click <strong>Share</strong>. A unique link is generated at <span className="font-mono bg-wiki-offwhite border border-wiki-border-light px-1 text-xs">/share/[code]</span>. Anyone with the link can view the citations but cannot edit them.
      </p>

      <h3 className="text-base font-bold mt-4 mb-1">Expiry</h3>
      <p className="text-sm mb-3 leading-relaxed">
        Share links do not expire by default. You can revoke a link at any time from the Share dialog — this immediately invalidates the URL.
      </p>

      <h2 className="text-xl font-bold border-b border-wiki-border-light pb-1 mb-3 mt-8">Export formats</h2>
      <p className="text-sm mb-3 leading-relaxed">
        Export a List or Project from the options menu. Three formats are available:
      </p>

      <table className="w-full border-collapse text-sm mb-4">
        <thead>
          <tr className="bg-wiki-tab-bg">
            <th className="border border-wiki-border px-3 py-1 text-left font-medium">Format</th>
            <th className="border border-wiki-border px-3 py-1 text-left font-medium">Extension</th>
            <th className="border border-wiki-border px-3 py-1 text-left font-medium">Use with</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td className="border border-wiki-border px-3 py-1 font-medium">Plain text</td>
            <td className="border border-wiki-border px-3 py-1 font-mono text-xs">.txt</td>
            <td className="border border-wiki-border px-3 py-1 text-wiki-text-muted">Copy into any document or email</td>
          </tr>
          <tr className="bg-wiki-offwhite">
            <td className="border border-wiki-border px-3 py-1 font-medium">BibTeX</td>
            <td className="border border-wiki-border px-3 py-1 font-mono text-xs">.bib</td>
            <td className="border border-wiki-border px-3 py-1 text-wiki-text-muted">LaTeX, Overleaf, Zotero, JabRef</td>
          </tr>
          <tr>
            <td className="border border-wiki-border px-3 py-1 font-medium">RIS</td>
            <td className="border border-wiki-border px-3 py-1 font-mono text-xs">.ris</td>
            <td className="border border-wiki-border px-3 py-1 text-wiki-text-muted">Zotero, Mendeley, EndNote, RefWorks</td>
          </tr>
        </tbody>
      </table>

      <div className="border border-wiki-border-light bg-wiki-offwhite p-3 text-sm mb-4">
        <strong>Note:</strong> BibTeX and RIS exports include the raw field data for all citations — the export is not style-specific. The citation style only affects the plain-text and display output.
      </div>

      <h2 className="text-xl font-bold border-b border-wiki-border-light pb-1 mb-3 mt-8">Embed badge</h2>
      <p className="text-sm mb-3 leading-relaxed">
        For public research pages, course sites, or portfolios, you can embed a small badge that links to a shared List. The badge is served as an SVG image from <span className="font-mono bg-wiki-offwhite border border-wiki-border-light px-1 text-xs">/api/badge/[code]</span> and can be included in any HTML or Markdown:
      </p>
      <div className="border border-wiki-border-light bg-wiki-offwhite px-3 py-2 text-sm font-mono mb-4">
        {`<img src="https://opencitation.app/api/badge/[code]" alt="Citations" />`}
      </div>
      <p className="text-sm mb-3 leading-relaxed">
        The badge shows the citation count and links back to the public share page.
      </p>

      <h2 className="text-xl font-bold border-b border-wiki-border-light pb-1 mb-3 mt-8">Copying individual citations</h2>
      <p className="text-sm mb-3 leading-relaxed">
        On the citation page or inside a List, click <span className="font-mono bg-wiki-offwhite border border-wiki-border-light px-1 text-xs">[copy]</span> next to any citation to copy it to your clipboard in the currently selected style. The keyboard shortcut{" "}
        <kbd className="font-mono bg-wiki-offwhite border border-wiki-border-light px-1 text-xs">C</kbd>{" "}
        copies the selected citation in list view.
      </p>

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
