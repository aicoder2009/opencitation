import Link from "next/link";
import { WikiBreadcrumbs } from "@/components/wiki/wiki-breadcrumbs";
import { SHORTCUTS, formatShortcutKey } from "@/lib/keyboard-shortcuts";

export const metadata = { title: "Keyboard Shortcuts — OpenCitation Docs" };

export default function KeyboardShortcuts() {
  const global = SHORTCUTS.filter((s) => s.scope === "global");
  const list = SHORTCUTS.filter((s) => s.scope === "list");
  const cite = SHORTCUTS.filter((s) => s.scope === "cite");

  return (
    <div>
      <WikiBreadcrumbs items={[{ label: "Docs", href: "/docs" }, { label: "Keyboard Shortcuts" }]} />

      <h1 className="text-2xl font-bold mt-2 mb-1">Keyboard Shortcuts</h1>
      <p className="text-wiki-text-muted text-sm mb-6">
        Power-user shortcuts for faster navigation. Press{" "}
        <kbd className="font-mono bg-wiki-offwhite border border-wiki-border-light px-1 text-xs">?</kbd>{" "}
        anywhere in the app to show a quick-reference overlay.
      </p>

      <div className="border border-wiki-border-light bg-wiki-offwhite p-3 text-sm mb-6">
        Shortcuts are disabled while typing in input fields. The exception is{" "}
        <kbd className="font-mono bg-wiki-offwhite border border-wiki-border-light px-1 text-xs">Esc</kbd>
        , which always closes modals.
      </div>

      <h2 className="text-xl font-bold border-b border-wiki-border-light pb-1 mb-3 mt-4">Global</h2>
      <p className="text-sm mb-3 text-wiki-text-muted">Available on every page.</p>
      <ShortcutTable shortcuts={global} />

      <h2 className="text-xl font-bold border-b border-wiki-border-light pb-1 mb-3 mt-8">List view</h2>
      <p className="text-sm mb-3 text-wiki-text-muted">Active when viewing a List page.</p>
      <ShortcutTable shortcuts={list} />

      <h2 className="text-xl font-bold border-b border-wiki-border-light pb-1 mb-3 mt-8">Citation page</h2>
      <p className="text-sm mb-3 text-wiki-text-muted">Active on the /cite page.</p>
      <ShortcutTable shortcuts={cite} />

      <div className="flex justify-between mt-10 pt-4 border-t border-wiki-border-light text-sm">
        <Link href="/docs/sharing" className="text-wiki-link hover:underline">
          ← Sharing & Export
        </Link>
        <Link href="/docs/browser-extension" className="text-wiki-link hover:underline">
          Next: Browser Extension →
        </Link>
      </div>
    </div>
  );
}

function ShortcutTable({ shortcuts }: { shortcuts: typeof SHORTCUTS }) {
  return (
    <table className="w-full border-collapse text-sm mb-4">
      <thead>
        <tr className="bg-wiki-tab-bg">
          <th className="border border-wiki-border px-3 py-1 text-left font-medium w-32">Key</th>
          <th className="border border-wiki-border px-3 py-1 text-left font-medium">Action</th>
        </tr>
      </thead>
      <tbody>
        {shortcuts.map((s, i) => (
          <tr key={s.key + s.scope} className={i % 2 === 1 ? "bg-wiki-offwhite" : ""}>
            <td className="border border-wiki-border px-3 py-1">
              <kbd className="font-mono bg-wiki-offwhite border border-wiki-border-light px-1 text-xs">
                {formatShortcutKey(s)}
              </kbd>
            </td>
            <td className="border border-wiki-border px-3 py-1 text-wiki-text-muted">{s.description}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
