import Link from "next/link";
import { WikiBreadcrumbs } from "@/components/wiki/wiki-breadcrumbs";

export const metadata = { title: "Lists & Projects — OpenCitation Docs" };

export default function Organize() {
  return (
    <div>
      <WikiBreadcrumbs items={[{ label: "Docs", href: "/docs" }, { label: "Lists & Projects" }]} />

      <h1 className="text-2xl font-bold mt-2 mb-1">Lists & Projects</h1>
      <p className="text-wiki-text-muted text-sm mb-6">
        Lists hold citations. Projects hold Lists. A two-level hierarchy that scales from a single bibliography to a multi-chapter thesis.
      </p>

      <h2 className="text-xl font-bold border-b border-wiki-border-light pb-1 mb-3 mt-4">Lists</h2>
      <p className="text-sm mb-3 leading-relaxed">
        A <strong>List</strong> is a named collection of citations — roughly equivalent to a bibliography or works cited page. You might have one List per paper, per course, or per project.
      </p>

      <h3 className="text-base font-bold mt-4 mb-1">Creating a List</h3>
      <p className="text-sm mb-3 leading-relaxed">
        Go to <Link href="/lists" className="text-wiki-link hover:underline">/lists</Link> and click <strong>New List</strong>. Give it a name. You can also create a List on-the-fly when saving a citation from the citation page.
      </p>

      <h3 className="text-base font-bold mt-4 mb-1">Managing citations in a List</h3>
      <p className="text-sm mb-3 leading-relaxed">
        Open a List to see all its citations. From here you can:
      </p>
      <ul className="list-disc pl-5 text-sm mb-3 space-y-1 leading-relaxed">
        <li>Edit any citation — click <span className="font-mono bg-wiki-offwhite border border-wiki-border-light px-1 text-xs">[edit]</span></li>
        <li>Delete a citation — click <span className="font-mono bg-wiki-offwhite border border-wiki-border-light px-1 text-xs">[delete]</span></li>
        <li>Copy a citation to clipboard — click <span className="font-mono bg-wiki-offwhite border border-wiki-border-light px-1 text-xs">[copy]</span></li>
        <li>Reorder citations by dragging the drag handle on the left</li>
        <li>Switch the citation style for the whole List using the style selector</li>
      </ul>

      <h3 className="text-base font-bold mt-4 mb-1">Reordering</h3>
      <p className="text-sm mb-3 leading-relaxed">
        Citations in a List can be dragged into any order. Grab the handle on the left edge of a citation card and drag it up or down. You can also use{" "}
        <kbd className="font-mono bg-wiki-offwhite border border-wiki-border-light px-1 text-xs">J</kbd> /{" "}
        <kbd className="font-mono bg-wiki-offwhite border border-wiki-border-light px-1 text-xs">K</kbd>{" "}
        to move keyboard selection.
      </p>

      <h2 className="text-xl font-bold border-b border-wiki-border-light pb-1 mb-3 mt-8">Projects</h2>
      <p className="text-sm mb-3 leading-relaxed">
        A <strong>Project</strong> is a container for multiple Lists. Use it to group all the bibliographies for a single thesis, course, or research project.
      </p>

      <h3 className="text-base font-bold mt-4 mb-1">Creating a Project</h3>
      <p className="text-sm mb-3 leading-relaxed">
        Go to <Link href="/projects" className="text-wiki-link hover:underline">/projects</Link> and click <strong>New Project</strong>. You can add existing Lists to the Project or create new Lists directly inside it.
      </p>

      <h3 className="text-base font-bold mt-4 mb-1">Standalone vs. project Lists</h3>
      <p className="text-sm mb-3 leading-relaxed">
        Lists can exist on their own (shown on <Link href="/lists" className="text-wiki-link hover:underline">/lists</Link>) or belong to a Project. A List can only belong to one Project at a time. Moving a List to a Project removes it from the standalone view.
      </p>

      <h2 className="text-xl font-bold border-b border-wiki-border-light pb-1 mb-3 mt-8">Tags</h2>
      <p className="text-sm mb-3 leading-relaxed">
        Lists support color-coded tags for quick visual organization. Tags appear on the Lists overview page. They&apos;re for your own reference — tags are not included in exports or share links.
      </p>

      <h2 className="text-xl font-bold border-b border-wiki-border-light pb-1 mb-3 mt-8">Offline support</h2>
      <p className="text-sm mb-3 leading-relaxed">
        All Lists and their citations are mirrored locally in IndexedDB. If you lose your internet connection, you can still read and edit your citations. Changes sync automatically when you reconnect.
      </p>

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
