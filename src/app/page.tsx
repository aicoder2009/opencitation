"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { WikiLayout } from "@/components/wiki/wiki-layout";
import { WikiBreadcrumbs } from "@/components/wiki/wiki-breadcrumbs";
import { WikiCollapsible } from "@/components/wiki/wiki-collapsible";
import { WikiButton } from "@/components/wiki/wiki-button";

export default function Home() {
  const router = useRouter();
  const [quickAddInput, setQuickAddInput] = useState("");

  const handleQuickAdd = () => {
    if (quickAddInput.trim()) {
      // Navigate to cite page with the input pre-filled
      router.push(`/cite?input=${encodeURIComponent(quickAddInput.trim())}`);
    } else {
      router.push("/cite");
    }
  };

  const handleSourceTypeClick = (sourceType: string) => {
    router.push(`/cite?tab=manual&source=${sourceType}`);
  };

  return (
    <WikiLayout>
      <WikiBreadcrumbs
        items={[
          { label: "Home" },
        ]}
      />

      <div className="mt-6">
        <div className="border border-wiki-border-light bg-wiki-white p-6 md:p-8">
          <h1 className="text-2xl font-bold mb-1">OpenCitation</h1>
          <p className="text-wiki-text-muted text-sm mb-8">
            From OpenCitation, the free citation tool
          </p>

          <WikiCollapsible title="Contents" defaultOpen>
            <nav className="text-sm">
              <ol className="list-decimal list-inside space-y-1">
                <li>
                  <a href="#quick-add" className="text-wiki-link hover:underline">Quick Add</a>
                </li>
                <li>
                  <a href="#manual-entry" className="text-wiki-link hover:underline">Manual Entry</a>
                </li>
                <li>
                  <a href="#my-citations" className="text-wiki-link hover:underline">My Citations</a>
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
                value={quickAddInput}
                onChange={(e) => setQuickAddInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleQuickAdd()}
              />
              <WikiButton variant="primary" onClick={handleQuickAdd}>
                Generate Citation
              </WikiButton>
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
              <WikiButton onClick={() => handleSourceTypeClick("book")}>Book</WikiButton>
              <WikiButton onClick={() => handleSourceTypeClick("journal")}>Journal</WikiButton>
              <WikiButton onClick={() => handleSourceTypeClick("website")}>Website</WikiButton>
              <WikiButton onClick={() => handleSourceTypeClick("blog")}>Blog</WikiButton>
              <WikiButton onClick={() => handleSourceTypeClick("newspaper")}>Newspaper</WikiButton>
              <WikiButton onClick={() => handleSourceTypeClick("video")}>Video</WikiButton>
              <WikiButton onClick={() => router.push("/cite?tab=manual")}>More...</WikiButton>
            </div>
          </section>

          <section id="my-citations" className="mt-8">
            <h2 className="text-xl font-bold border-b border-wiki-border-light pb-2 mb-4">
              My Citations
            </h2>
            <p className="text-wiki-text-muted">
              <a href="/sign-in" className="text-wiki-link hover:underline">Sign in</a> to save and organize your citations
              into Lists and Projects.
            </p>
          </section>
        </div>
      </div>
    </WikiLayout>
  );
}
