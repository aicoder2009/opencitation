import Link from "next/link";
import { WikiBreadcrumbs } from "@/components/wiki/wiki-breadcrumbs";

export const metadata = { title: "Browser Extension — OpenCitation Docs" };

export default function BrowserExtension() {
  return (
    <div>
      <WikiBreadcrumbs items={[{ label: "Docs", href: "/docs" }, { label: "Browser Extension" }]} />

      <h1 className="text-2xl font-bold mt-2 mb-1">Browser Extension</h1>
      <p className="text-wiki-text-muted text-sm mb-6">
        Cite any webpage in one click without leaving your browser.
      </p>

      <h2 className="text-xl font-bold border-b border-wiki-border-light pb-1 mb-3 mt-4">What it does</h2>
      <p className="text-sm mb-3 leading-relaxed">
        The OpenCitation browser extension adds a toolbar button to Chrome, Edge, and Firefox. Click it on any page to instantly generate a citation for that URL. You can copy it or open it in the full app to save it to a List.
      </p>
      <ul className="list-disc pl-5 text-sm mb-4 space-y-1 leading-relaxed">
        <li>One-click citation generation for the current tab</li>
        <li>Choose APA, MLA, Chicago, or Harvard from the popup</li>
        <li>Copy to clipboard or open in OpenCitation</li>
        <li>Right-click any link and choose <strong>Cite this page</strong></li>
      </ul>

      <h2 className="text-xl font-bold border-b border-wiki-border-light pb-1 mb-3 mt-8">Installation — Chrome & Edge</h2>

      <h3 className="text-base font-bold mt-4 mb-1">From the Chrome Web Store (coming soon)</h3>
      <p className="text-sm mb-3 leading-relaxed">
        The extension will be available on the Chrome Web Store. Until then, install it manually using Developer Mode.
      </p>

      <h3 className="text-base font-bold mt-4 mb-1">Manual install (Developer Mode)</h3>
      <ol className="list-decimal pl-5 text-sm mb-4 space-y-2 leading-relaxed">
        <li>
          Download or clone the{" "}
          <a
            href="https://github.com/aicoder2009/opencitation"
            target="_blank"
            rel="noopener noreferrer"
            className="text-wiki-link hover:underline"
          >
            OpenCitation repository
          </a>
          .
        </li>
        <li>
          Open Chrome and navigate to{" "}
          <span className="font-mono bg-wiki-offwhite border border-wiki-border-light px-1 text-xs">chrome://extensions/</span>
          .
        </li>
        <li>Enable <strong>Developer mode</strong> using the toggle in the top-right corner.</li>
        <li>Click <strong>Load unpacked</strong>.</li>
        <li>
          Select the{" "}
          <span className="font-mono bg-wiki-offwhite border border-wiki-border-light px-1 text-xs">browser-extension/</span>{" "}
          directory from the repository.
        </li>
        <li>The OpenCitation icon appears in your toolbar. Pin it for easy access.</li>
      </ol>

      <h2 className="text-xl font-bold border-b border-wiki-border-light pb-1 mb-3 mt-8">Installation — Firefox</h2>
      <p className="text-sm mb-3 leading-relaxed">
        Firefox uses a slightly different manifest format. The extension works with minor changes — see the repository README for details. Full Firefox support is on the roadmap.
      </p>

      <h2 className="text-xl font-bold border-b border-wiki-border-light pb-1 mb-3 mt-8">Using the extension</h2>
      <ol className="list-decimal pl-5 text-sm mb-4 space-y-2 leading-relaxed">
        <li>Navigate to any webpage you want to cite.</li>
        <li>Click the OpenCitation icon in the browser toolbar.</li>
        <li>Select your citation style from the dropdown.</li>
        <li>Click <strong>Generate Citation</strong>.</li>
        <li>Click <strong>Copy</strong> to copy it, or <strong>Open in app</strong> to save it to a List.</li>
      </ol>

      <h3 className="text-base font-bold mt-4 mb-1">Right-click context menu</h3>
      <p className="text-sm mb-3 leading-relaxed">
        Right-click any link on a page and choose <strong>Cite this page with OpenCitation</strong> to generate a citation for the linked URL without navigating to it.
      </p>

      <h2 className="text-xl font-bold border-b border-wiki-border-light pb-1 mb-3 mt-8">Browser support</h2>
      <table className="w-full border-collapse text-sm mb-4">
        <thead>
          <tr className="bg-wiki-tab-bg">
            <th className="border border-wiki-border px-3 py-1 text-left font-medium">Browser</th>
            <th className="border border-wiki-border px-3 py-1 text-left font-medium">Status</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td className="border border-wiki-border px-3 py-1">Chrome</td>
            <td className="border border-wiki-border px-3 py-1 text-wiki-text-muted">Supported (Manifest V3)</td>
          </tr>
          <tr className="bg-wiki-offwhite">
            <td className="border border-wiki-border px-3 py-1">Edge (Chromium)</td>
            <td className="border border-wiki-border px-3 py-1 text-wiki-text-muted">Supported</td>
          </tr>
          <tr>
            <td className="border border-wiki-border px-3 py-1">Firefox</td>
            <td className="border border-wiki-border px-3 py-1 text-wiki-text-muted">Partial — minor manifest changes needed</td>
          </tr>
          <tr className="bg-wiki-offwhite">
            <td className="border border-wiki-border px-3 py-1">Safari</td>
            <td className="border border-wiki-border px-3 py-1 text-wiki-text-muted">Not currently supported</td>
          </tr>
        </tbody>
      </table>

      <div className="flex justify-between mt-10 pt-4 border-t border-wiki-border-light text-sm">
        <Link href="/docs/keyboard-shortcuts" className="text-wiki-link hover:underline">
          ← Keyboard Shortcuts
        </Link>
        <Link href="/docs" className="text-wiki-link hover:underline">
          ↑ Docs overview
        </Link>
      </div>
    </div>
  );
}
