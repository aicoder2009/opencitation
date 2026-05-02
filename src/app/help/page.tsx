import Link from "next/link";
import { WikiLayout } from "@/components/wiki/wiki-layout";
import { WikiBreadcrumbs } from "@/components/wiki/wiki-breadcrumbs";
import { WikiCollapsible } from "@/components/wiki/wiki-collapsible";
import { SHORTCUTS, formatShortcutKey } from "@/lib/keyboard-shortcuts";

export const metadata = { title: "Help — OpenCitation" };

export default function HelpPage() {
  return (
    <WikiLayout>
      <WikiBreadcrumbs items={[{ label: "Help" }]} />

      <h1 className="text-2xl font-bold mt-2 mb-1">Help: OpenCitation</h1>
      <p className="text-wiki-text-muted text-sm mb-4">
        Free, ad-free citation manager. Generate, organize, and share citations in APA, MLA, Chicago, or Harvard.
      </p>

      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="flex-1">
          <WikiCollapsible title="Contents" defaultOpen={true}>
            <ol className="text-sm space-y-1 pl-1">
              {[
                ["Overview", "#overview"],
                ["Quick Add — lookup by identifier", "#quick-add"],
                ["Manual entry", "#manual"],
                ["Citation styles", "#styles"],
                ["Source types", "#source-types"],
                ["Lists & Projects", "#organize"],
                ["Sharing & Export", "#sharing"],
                ["Keyboard shortcuts", "#shortcuts"],
                ["Browser extension", "#extension"],
                ["Desktop app & PWA", "#desktop"],
                ["Reporting issues", "#issues"],
              ].map(([label, href], i) => (
                <li key={href}>
                  <a href={href} className="text-wiki-link hover:underline">
                    {i + 1}. {label}
                  </a>
                </li>
              ))}
            </ol>
          </WikiCollapsible>
        </div>

        <div className="sm:w-56 shrink-0 border border-wiki-border-light bg-wiki-offwhite p-3 text-sm self-start">
          <p className="font-bold text-wiki-text mb-2">Quick links</p>
          <ul className="space-y-1">
            <li><Link href="/cite" className="text-wiki-link hover:underline">Citation generator →</Link></li>
            <li><Link href="/lists" className="text-wiki-link hover:underline">My Lists →</Link></li>
            <li><Link href="/projects" className="text-wiki-link hover:underline">My Projects →</Link></li>
            <li><Link href="/docs" className="text-wiki-link hover:underline">Full documentation →</Link></li>
          </ul>
        </div>
      </div>

      {/* === OVERVIEW === */}
      <section id="overview">
        <h2 className="text-xl font-bold border-b border-wiki-border-light pb-1 mb-3 mt-2">1. Overview</h2>
        <p className="text-sm mb-3 leading-relaxed">
          OpenCitation is an open-source citation manager designed for students, researchers, and anyone who needs properly formatted references. It is ad-free and free to use.
        </p>
        <p className="text-sm mb-3 leading-relaxed">
          The core workflow: <strong>generate</strong> a citation from a URL, DOI, ISBN, or identifier — or enter fields manually — then <strong>save</strong> it to a List, and <strong>export or share</strong> the List when you&apos;re done.
        </p>
        <p className="text-sm mb-3 leading-relaxed">
          OpenCitation works offline. Citations are cached locally and sync when you reconnect. It can be installed as a desktop app (Electron) or a Progressive Web App.
        </p>
        <p className="text-sm text-wiki-text-muted">
          <Link href="/docs" className="text-wiki-link hover:underline">Read more in the full documentation →</Link>
        </p>
      </section>

      {/* === QUICK ADD === */}
      <section id="quick-add">
        <h2 className="text-xl font-bold border-b border-wiki-border-light pb-1 mb-3 mt-8">2. Quick Add — lookup by identifier</h2>
        <p className="text-sm mb-3 leading-relaxed">
          Go to <Link href="/cite" className="text-wiki-link hover:underline">/cite</Link> and paste any of the following into the Quick Add box. OpenCitation detects the type automatically and fetches metadata from the appropriate source.
        </p>
        <table className="w-full border-collapse text-sm mb-3">
          <thead>
            <tr className="bg-wiki-tab-bg">
              <th className="border border-wiki-border px-3 py-1 text-left font-medium">Identifier</th>
              <th className="border border-wiki-border px-3 py-1 text-left font-medium">Example</th>
            </tr>
          </thead>
          <tbody>
            {[
              ["URL", "https://www.nytimes.com/2024/..."],
              ["DOI", "10.1038/nature12345"],
              ["ISBN", "9780385533348"],
              ["PubMed ID", "PMID:12345678"],
              ["arXiv ID", "arXiv:2301.00001"],
              ["Wikipedia article title", "Climate change"],
            ].map(([type, ex], i) => (
              <tr key={type} className={i % 2 === 1 ? "bg-wiki-offwhite" : ""}>
                <td className="border border-wiki-border px-3 py-1">{type}</td>
                <td className="border border-wiki-border px-3 py-1 font-mono text-xs text-wiki-text-muted">{ex}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <p className="text-sm mb-3 leading-relaxed">
          After lookup, review the filled fields — auto-fetched metadata is sometimes incomplete. Select a citation style, then copy or save to a List.
        </p>
        <p className="text-sm text-wiki-text-muted">
          <Link href="/docs/citations" className="text-wiki-link hover:underline">Read more: Generating Citations →</Link>
        </p>
      </section>

      {/* === MANUAL ENTRY === */}
      <section id="manual">
        <h2 className="text-xl font-bold border-b border-wiki-border-light pb-1 mb-3 mt-8">3. Manual entry</h2>
        <p className="text-sm mb-3 leading-relaxed">
          Switch to the <strong>Manual</strong> tab on the citation page. Select a source type first — the form adapts to show only the relevant fields. Fill in the required fields and click <strong>Generate</strong>.
        </p>
        <p className="text-sm mb-3 leading-relaxed">
          The <strong>Templates</strong> button provides pre-filled examples (a journal article, a book, a news article) so you can edit rather than type from scratch.
        </p>
        <p className="text-sm text-wiki-text-muted">
          <Link href="/docs/citations" className="text-wiki-link hover:underline">Read more: Generating Citations →</Link>
        </p>
      </section>

      {/* === STYLES === */}
      <section id="styles">
        <h2 className="text-xl font-bold border-b border-wiki-border-light pb-1 mb-3 mt-8">4. Citation styles</h2>
        <p className="text-sm mb-3 leading-relaxed">
          Choose a style from the dropdown on the citation page or inside any List. Switching style re-formats all citations instantly — the underlying field data is never lost.
        </p>
        <table className="w-full border-collapse text-sm mb-3">
          <thead>
            <tr className="bg-wiki-tab-bg">
              <th className="border border-wiki-border px-3 py-1 text-left font-medium">Style</th>
              <th className="border border-wiki-border px-3 py-1 text-left font-medium">Common in</th>
              <th className="border border-wiki-border px-3 py-1 text-left font-medium">In-text format</th>
            </tr>
          </thead>
          <tbody>
            {[
              ["APA 7th", "Psychology, social sciences", "(Author, Year)"],
              ["MLA 9th", "Literature, humanities", "(Author Page)"],
              ["Chicago 17th", "History, fine arts", "Footnote / (Author Year)"],
              ["Harvard", "Sciences, UK/AU universities", "(Author, Year)"],
            ].map(([style, field, intext], i) => (
              <tr key={style} className={i % 2 === 1 ? "bg-wiki-offwhite" : ""}>
                <td className="border border-wiki-border px-3 py-1 font-medium">{style}</td>
                <td className="border border-wiki-border px-3 py-1 text-wiki-text-muted">{field}</td>
                <td className="border border-wiki-border px-3 py-1 font-mono text-xs">{intext}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <p className="text-sm text-wiki-text-muted">
          <Link href="/docs/styles" className="text-wiki-link hover:underline">Read more: Citation Styles →</Link>
        </p>
      </section>

      {/* === SOURCE TYPES === */}
      <section id="source-types">
        <h2 className="text-xl font-bold border-b border-wiki-border-light pb-1 mb-3 mt-8">5. Source types</h2>
        <p className="text-sm mb-3 leading-relaxed">
          OpenCitation supports 27 source types. The form adapts its fields based on the selected type.
        </p>
        <p className="text-sm mb-3 leading-relaxed">
          Categories: <strong>Print & Long-form</strong> (book, journal, newspaper, thesis…), <strong>Web & Digital</strong> (website, blog, dataset, AI-generated…), <strong>Audiovisual</strong> (video, film, podcast…), <strong>Visual & Archival</strong> (image, artwork), and <strong>Other</strong> (interview, legal case, miscellaneous).
        </p>
        <p className="text-sm text-wiki-text-muted">
          <Link href="/docs/source-types" className="text-wiki-link hover:underline">Full source types reference →</Link>
        </p>
      </section>

      {/* === ORGANIZE === */}
      <section id="organize">
        <h2 className="text-xl font-bold border-b border-wiki-border-light pb-1 mb-3 mt-8">6. Lists & Projects</h2>
        <p className="text-sm mb-3 leading-relaxed">
          <strong>Lists</strong> are collections of citations (one bibliography = one List). <strong>Projects</strong> are containers for multiple Lists — useful for a thesis, course, or research project with several bibliographies.
        </p>
        <p className="text-sm mb-3 leading-relaxed">
          Inside a List, drag citations to reorder them. Use color-coded tags to organize Lists on the overview page.
        </p>
        <p className="text-sm text-wiki-text-muted">
          <Link href="/docs/organize" className="text-wiki-link hover:underline">Read more: Lists & Projects →</Link>
        </p>
      </section>

      {/* === SHARING === */}
      <section id="sharing">
        <h2 className="text-xl font-bold border-b border-wiki-border-light pb-1 mb-3 mt-8">7. Sharing & Export</h2>
        <p className="text-sm mb-3 leading-relaxed">
          <strong>Share link:</strong> generate a public read-only URL for any List or Project. No account needed to view it.
        </p>
        <p className="text-sm mb-3 leading-relaxed">
          <strong>Export formats:</strong>
        </p>
        <ul className="list-disc pl-5 text-sm mb-3 space-y-1">
          <li><strong>Plain text (.txt)</strong> — paste into any document</li>
          <li><strong>BibTeX (.bib)</strong> — for LaTeX, Overleaf, Zotero, JabRef</li>
          <li><strong>RIS (.ris)</strong> — for Zotero, Mendeley, EndNote, RefWorks</li>
        </ul>
        <p className="text-sm mb-3 leading-relaxed">
          <strong>Embed badge:</strong> include a small image badge on any site that links to your shared List and shows the citation count.
        </p>
        <p className="text-sm text-wiki-text-muted">
          <Link href="/docs/sharing" className="text-wiki-link hover:underline">Read more: Sharing & Export →</Link>
        </p>
      </section>

      {/* === SHORTCUTS === */}
      <section id="shortcuts">
        <h2 className="text-xl font-bold border-b border-wiki-border-light pb-1 mb-3 mt-8">8. Keyboard shortcuts</h2>
        <p className="text-sm mb-3 leading-relaxed">
          Press <kbd className="font-mono bg-wiki-offwhite border border-wiki-border-light px-1 text-xs">?</kbd> anywhere to show a shortcut reference overlay.
        </p>
        <table className="w-full border-collapse text-sm mb-3">
          <thead>
            <tr className="bg-wiki-tab-bg">
              <th className="border border-wiki-border px-3 py-1 text-left font-medium w-28">Key</th>
              <th className="border border-wiki-border px-3 py-1 text-left font-medium">Action</th>
              <th className="border border-wiki-border px-3 py-1 text-left font-medium w-20">Scope</th>
            </tr>
          </thead>
          <tbody>
            {SHORTCUTS.map((s, i) => (
              <tr key={s.key + s.scope} className={i % 2 === 1 ? "bg-wiki-offwhite" : ""}>
                <td className="border border-wiki-border px-3 py-1">
                  <kbd className="font-mono bg-wiki-offwhite border border-wiki-border-light px-1 text-xs">
                    {formatShortcutKey(s)}
                  </kbd>
                </td>
                <td className="border border-wiki-border px-3 py-1 text-wiki-text-muted">{s.description}</td>
                <td className="border border-wiki-border px-3 py-1 text-wiki-text-muted capitalize">{s.scope}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <p className="text-sm text-wiki-text-muted">
          <Link href="/docs/keyboard-shortcuts" className="text-wiki-link hover:underline">Full shortcuts reference →</Link>
        </p>
      </section>

      {/* === EXTENSION === */}
      <section id="extension">
        <h2 className="text-xl font-bold border-b border-wiki-border-light pb-1 mb-3 mt-8">9. Browser extension</h2>
        <p className="text-sm mb-3 leading-relaxed">
          The OpenCitation extension adds a toolbar button to Chrome and Edge. Click it on any page to instantly generate a citation for that URL. Right-click any link and choose <strong>Cite this page</strong> to cite it without navigating away.
        </p>
        <p className="text-sm mb-3 leading-relaxed">
          To install: clone the repository, open <span className="font-mono bg-wiki-offwhite border border-wiki-border-light px-1 text-xs">chrome://extensions/</span>, enable Developer mode, click <strong>Load unpacked</strong>, and select the <span className="font-mono bg-wiki-offwhite border border-wiki-border-light px-1 text-xs">browser-extension/</span> folder.
        </p>
        <p className="text-sm text-wiki-text-muted">
          <Link href="/docs/browser-extension" className="text-wiki-link hover:underline">Full installation guide →</Link>
        </p>
      </section>

      {/* === DESKTOP === */}
      <section id="desktop">
        <h2 className="text-xl font-bold border-b border-wiki-border-light pb-1 mb-3 mt-8">10. Desktop app & PWA</h2>
        <p className="text-sm mb-3 leading-relaxed">
          <strong>PWA (Progressive Web App):</strong> In Chrome or Edge, click the install icon in the address bar. On iOS Safari, use Share → Add to Home Screen. The installed app works fully offline.
        </p>
        <p className="text-sm mb-3 leading-relaxed">
          <strong>Electron desktop app:</strong> Available for macOS, Windows, and Linux. Download from the GitHub releases page or build from source with <span className="font-mono bg-wiki-offwhite border border-wiki-border-light px-1 text-xs">npm run electron:build</span>.
        </p>
        <p className="text-sm mb-3 leading-relaxed">
          Both the PWA and Electron app use the same data as the web app — changes sync automatically across all your devices.
        </p>
      </section>

      {/* === ISSUES === */}
      <section id="issues">
        <h2 className="text-xl font-bold border-b border-wiki-border-light pb-1 mb-3 mt-8">11. Reporting issues</h2>
        <p className="text-sm mb-3 leading-relaxed">
          Found a bug or have a suggestion?{" "}
          <a
            href="https://github.com/aicoder2009/opencitation/issues"
            target="_blank"
            rel="noopener noreferrer"
            className="text-wiki-link hover:underline"
          >
            Open an issue on GitHub
          </a>
          . Include the citation source, the style you were using, and what the output looked like vs. what you expected.
        </p>
        <p className="text-sm mb-3 leading-relaxed">
          You can also use the <strong>Report Issue</strong> link in the app (bottom of any page) to file a report directly from the interface.
        </p>
      </section>

      <div className="mt-10 pt-4 border-t border-wiki-border-light text-xs text-wiki-text-muted flex flex-col sm:flex-row justify-between gap-2">
        <span>
          OpenCitation is open source.{" "}
          <a
            href="https://github.com/aicoder2009/opencitation"
            target="_blank"
            rel="noopener noreferrer"
            className="text-wiki-link hover:underline"
          >
            View source on GitHub
          </a>
          .
        </span>
        <Link href="/docs" className="text-wiki-link hover:underline">
          Full documentation →
        </Link>
      </div>
    </WikiLayout>
  );
}
