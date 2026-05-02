import Link from "next/link";
import { WikiBreadcrumbs } from "@/components/wiki/wiki-breadcrumbs";

export const metadata = { title: "Getting Started — OpenCitation Docs" };

export default function GettingStarted() {
  return (
    <div>
      <WikiBreadcrumbs items={[{ label: "Docs", href: "/docs" }, { label: "Getting Started" }]} />

      <h1 className="text-2xl font-bold mt-2 mb-1">Getting Started</h1>
      <p className="text-wiki-text-muted text-sm mb-6">Up and running in under a minute.</p>

      <h2 className="text-xl font-bold border-b border-wiki-border-light pb-1 mb-3 mt-8">1. Create an account</h2>
      <p className="text-sm mb-3 leading-relaxed">
        Go to{" "}
        <Link href="/sign-up" className="text-wiki-link hover:underline">
          opencitation.app/sign-up
        </Link>{" "}
        and create a free account. OpenCitation uses Clerk for authentication — you can sign up with email or a Google account.
      </p>
      <p className="text-sm mb-3 leading-relaxed">
        You can also use the citation generator at{" "}
        <Link href="/cite" className="text-wiki-link hover:underline">
          /cite
        </Link>{" "}
        without an account. Signing in lets you save citations to Lists and Projects.
      </p>

      <h2 className="text-xl font-bold border-b border-wiki-border-light pb-1 mb-3 mt-8">2. Generate your first citation</h2>
      <p className="text-sm mb-3 leading-relaxed">
        Navigate to{" "}
        <Link href="/cite" className="text-wiki-link hover:underline">
          /cite
        </Link>
        . In the <strong>Quick Add</strong> box, paste any of the following:
      </p>
      <table className="w-full border-collapse text-sm mb-4">
        <thead>
          <tr className="bg-wiki-tab-bg">
            <th className="border border-wiki-border px-3 py-1 text-left font-medium">Identifier</th>
            <th className="border border-wiki-border px-3 py-1 text-left font-medium">Example</th>
            <th className="border border-wiki-border px-3 py-1 text-left font-medium">Source</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td className="border border-wiki-border px-3 py-1">URL</td>
            <td className="border border-wiki-border px-3 py-1 font-mono text-xs">https://example.com/article</td>
            <td className="border border-wiki-border px-3 py-1 text-wiki-text-muted">OpenGraph metadata</td>
          </tr>
          <tr className="bg-wiki-offwhite">
            <td className="border border-wiki-border px-3 py-1">DOI</td>
            <td className="border border-wiki-border px-3 py-1 font-mono text-xs">10.1038/nature12345</td>
            <td className="border border-wiki-border px-3 py-1 text-wiki-text-muted">CrossRef</td>
          </tr>
          <tr>
            <td className="border border-wiki-border px-3 py-1">ISBN</td>
            <td className="border border-wiki-border px-3 py-1 font-mono text-xs">9780385533348</td>
            <td className="border border-wiki-border px-3 py-1 text-wiki-text-muted">Open Library / Google Books</td>
          </tr>
          <tr className="bg-wiki-offwhite">
            <td className="border border-wiki-border px-3 py-1">PubMed ID</td>
            <td className="border border-wiki-border px-3 py-1 font-mono text-xs">PMID:12345678</td>
            <td className="border border-wiki-border px-3 py-1 text-wiki-text-muted">PubMed</td>
          </tr>
          <tr>
            <td className="border border-wiki-border px-3 py-1">arXiv ID</td>
            <td className="border border-wiki-border px-3 py-1 font-mono text-xs">arXiv:2301.00001</td>
            <td className="border border-wiki-border px-3 py-1 text-wiki-text-muted">arXiv</td>
          </tr>
        </tbody>
      </table>
      <p className="text-sm mb-3 leading-relaxed">
        Click <strong>Generate</strong> (or press <kbd className="font-mono bg-wiki-offwhite border border-wiki-border-light px-1 text-xs">G</kbd>). The fields are filled automatically — review them, choose a citation style, then copy or save.
      </p>

      <h2 className="text-xl font-bold border-b border-wiki-border-light pb-1 mb-3 mt-8">3. Save to a List</h2>
      <p className="text-sm mb-3 leading-relaxed">
        After generating a citation, click <strong>Save to List</strong> (or press{" "}
        <kbd className="font-mono bg-wiki-offwhite border border-wiki-border-light px-1 text-xs">Ctrl + S</kbd>
        ). Choose an existing List or create a new one. Your citations are synced to the cloud and also cached locally so the app works offline.
      </p>

      <h2 className="text-xl font-bold border-b border-wiki-border-light pb-1 mb-3 mt-8">4. Install as a PWA (optional)</h2>
      <p className="text-sm mb-3 leading-relaxed">
        OpenCitation is a Progressive Web App. In Chrome or Edge, look for the install icon in the address bar and click <strong>Install</strong>. On iOS Safari, tap the Share button and choose <strong>Add to Home Screen</strong>.
      </p>
      <p className="text-sm mb-3 leading-relaxed">
        Once installed, the app works fully offline — citations you&apos;ve saved are available without a network connection, and any changes sync when you reconnect.
      </p>

      <div className="flex justify-end mt-10 pt-4 border-t border-wiki-border-light text-sm">
        <Link href="/docs/citations" className="text-wiki-link hover:underline">
          Next: Generating Citations →
        </Link>
      </div>
    </div>
  );
}
