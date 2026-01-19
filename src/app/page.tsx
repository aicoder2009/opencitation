import { WikiLayout } from "@/components/wiki/wiki-layout";
import { WikiBreadcrumbs } from "@/components/wiki/wiki-breadcrumbs";
import { WikiTabs } from "@/components/wiki/wiki-tabs";
import { WikiCollapsible } from "@/components/wiki/wiki-collapsible";
import { WikiButton } from "@/components/wiki/wiki-button";

export default function Home() {
  return (
    <WikiLayout>
      <WikiBreadcrumbs
        items={[
          { label: "Home", href: "/" },
          { label: "Cite", href: "/cite" },
        ]}
      />

      <div className="mt-6">
        <WikiTabs
          tabs={[
            { id: "article", label: "Article", active: true },
            { id: "discussion", label: "Discussion" },
            { id: "edit", label: "Edit" },
            { id: "history", label: "History" },
          ]}
        />

        <div className="border border-wiki-border-light border-t-0 bg-wiki-white p-6 md:p-8">
          <h1 className="text-2xl font-bold mb-1">OpenCitation</h1>
          <p className="text-wiki-text-muted text-sm mb-8">
            From OpenCitation, the free citation tool
          </p>

          <WikiCollapsible title="Contents" defaultOpen>
            <nav className="text-sm">
              <ol className="list-decimal list-inside space-y-1">
                <li>
                  <a href="#quick-add">Quick Add</a>
                </li>
                <li>
                  <a href="#manual-entry">Manual Entry</a>
                </li>
                <li>
                  <a href="#my-citations">My Citations</a>
                </li>
              </ol>
            </nav>
          </WikiCollapsible>

          <section id="quick-add" className="mt-8">
            <h2 className="text-xl font-bold border-b border-wiki-border-light pb-2 mb-4">
              Quick Add
            </h2>
            <p className="mb-4">
              Enter a URL, DOI, or ISBN to automatically generate a citation.
            </p>
            <div className="flex flex-col sm:flex-row gap-3">
              <input
                type="text"
                placeholder="Enter URL, DOI, or ISBN..."
                className="flex-1"
              />
              <WikiButton variant="primary">Generate Citation</WikiButton>
            </div>
          </section>

          <section id="manual-entry" className="mt-8">
            <h2 className="text-xl font-bold border-b border-wiki-border-light pb-2 mb-4">
              Manual Entry
            </h2>
            <p className="mb-4">
              Select a source type and enter the citation details manually.
            </p>
            <div className="flex flex-wrap gap-2">
              <WikiButton>Book</WikiButton>
              <WikiButton>Journal</WikiButton>
              <WikiButton>Website</WikiButton>
              <WikiButton>Blog</WikiButton>
              <WikiButton>Newspaper</WikiButton>
              <WikiButton>Video</WikiButton>
              <WikiButton>More...</WikiButton>
            </div>
          </section>

          <section id="my-citations" className="mt-8">
            <h2 className="text-xl font-bold border-b border-wiki-border-light pb-2 mb-4">
              My Citations
            </h2>
            <p className="text-wiki-text-muted">
              <a href="/sign-in">Sign in</a> to save and organize your citations
              into Lists and Projects.
            </p>
          </section>

          <hr className="my-8 border-wiki-border-light" />

          <div className="flex flex-wrap gap-3">
            <WikiButton disabled>Copy</WikiButton>
            <WikiButton disabled>Export</WikiButton>
            <WikiButton disabled>Add to Project</WikiButton>
          </div>
        </div>
      </div>
    </WikiLayout>
  );
}
