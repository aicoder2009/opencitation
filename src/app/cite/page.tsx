"use client";

import { useState } from "react";
import { WikiLayout } from "@/components/wiki/wiki-layout";
import { WikiBreadcrumbs } from "@/components/wiki/wiki-breadcrumbs";
import { WikiTabs } from "@/components/wiki/wiki-tabs";
import { WikiCollapsible } from "@/components/wiki/wiki-collapsible";
import { WikiButton } from "@/components/wiki/wiki-button";

const SOURCE_TYPES = [
  "Book",
  "Journal",
  "Website",
  "Blog",
  "Newspaper",
  "Video",
  "Image",
  "Film",
  "TV Series",
  "TV Episode",
  "Miscellaneous",
] as const;

const CITATION_STYLES = ["APA 7th", "MLA 9th", "Chicago 17th", "Harvard"] as const;

const ACCESS_TYPES = ["Web", "Print", "Database", "App", "Archive"] as const;

export default function CitePage() {
  const [activeTab, setActiveTab] = useState("quick-add");
  const [selectedStyle, setSelectedStyle] = useState<string>("APA 7th");
  const [selectedSourceType, setSelectedSourceType] = useState<string>("Website");
  const [selectedAccessType, setSelectedAccessType] = useState<string>("Web");
  const [inputValue, setInputValue] = useState("");
  const [generatedCitation, setGeneratedCitation] = useState<string | null>(null);

  const handleGenerate = () => {
    // Placeholder - will connect to citation engine in Sprint 2
    setGeneratedCitation(
      `Sample citation for "${inputValue || "example.com"}" in ${selectedStyle} format.`
    );
  };

  return (
    <WikiLayout>
      <WikiBreadcrumbs
        items={[
          { label: "Home", href: "/" },
          { label: "Cite" },
        ]}
      />

      <div className="mt-6">
        <h1 className="text-2xl font-bold mb-1">Create Citation</h1>
        <p className="text-wiki-text-muted text-sm mb-6">
          Generate properly formatted citations from URLs, DOIs, ISBNs, or manual entry
        </p>

        {/* Citation Style Selector */}
        <div className="mb-6 p-4 bg-wiki-offwhite border border-wiki-border-light">
          <label className="block text-sm font-medium mb-2">Citation Style</label>
          <div className="flex flex-wrap gap-2">
            {CITATION_STYLES.map((style) => (
              <WikiButton
                key={style}
                variant={selectedStyle === style ? "primary" : "default"}
                onClick={() => setSelectedStyle(style)}
                className={selectedStyle === style ? "border-wiki-link" : ""}
              >
                {style}
              </WikiButton>
            ))}
          </div>
        </div>

        <WikiTabs
          tabs={[
            { id: "quick-add", label: "Quick Add", active: activeTab === "quick-add" },
            { id: "manual", label: "Manual Entry", active: activeTab === "manual" },
          ]}
          onTabChange={setActiveTab}
        />

        <div className="border border-wiki-border-light border-t-0 bg-wiki-white p-6 md:p-8">
          {activeTab === "quick-add" && (
            <div>
              <h2 className="text-lg font-bold mb-4">Quick Add</h2>
              <p className="mb-4 text-sm text-wiki-text-muted">
                Enter a URL, DOI, or ISBN to automatically extract citation information.
              </p>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">
                    URL, DOI, or ISBN
                  </label>
                  <input
                    type="text"
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    placeholder="https://example.com/article or 10.1000/xyz123 or 978-3-16-148410-0"
                    className="w-full"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">
                    Source Type
                  </label>
                  <select
                    value={selectedSourceType}
                    onChange={(e) => setSelectedSourceType(e.target.value)}
                    className="w-full max-w-xs"
                  >
                    {SOURCE_TYPES.map((type) => (
                      <option key={type} value={type}>
                        {type}
                      </option>
                    ))}
                  </select>
                </div>

                <WikiButton variant="primary" onClick={handleGenerate}>
                  Generate Citation
                </WikiButton>
              </div>
            </div>
          )}

          {activeTab === "manual" && (
            <div>
              <h2 className="text-lg font-bold mb-4">Manual Entry</h2>
              <p className="mb-4 text-sm text-wiki-text-muted">
                Select a source type and fill in the citation details.
              </p>

              <div className="space-y-5">
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Source Type
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {SOURCE_TYPES.map((type) => (
                      <WikiButton
                        key={type}
                        variant={selectedSourceType === type ? "primary" : "default"}
                        onClick={() => setSelectedSourceType(type)}
                        className={selectedSourceType === type ? "border-wiki-link" : ""}
                      >
                        {type}
                      </WikiButton>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">
                    Access Type
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {ACCESS_TYPES.map((type) => (
                      <WikiButton
                        key={type}
                        variant={selectedAccessType === type ? "primary" : "default"}
                        onClick={() => setSelectedAccessType(type)}
                        className={selectedAccessType === type ? "border-wiki-link" : ""}
                      >
                        {type}
                      </WikiButton>
                    ))}
                  </div>
                </div>

                <WikiCollapsible
                  title={`${selectedSourceType} Fields`}
                  defaultOpen
                >
                  <div className="space-y-4">
                    {/* Dynamic fields based on source type - placeholder */}
                    <div>
                      <label className="block text-sm font-medium mb-1">
                        Author(s)
                      </label>
                      <input
                        type="text"
                        placeholder="Last, First M."
                        className="w-full"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">
                        Title
                      </label>
                      <input type="text" placeholder="Title of work" className="w-full" />
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium mb-1">
                          Year
                        </label>
                        <input type="text" placeholder="2024" className="w-full" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-1">
                          Publisher / Source
                        </label>
                        <input
                          type="text"
                          placeholder="Publisher name"
                          className="w-full"
                        />
                      </div>
                    </div>
                    {selectedAccessType === "Web" && (
                      <div>
                        <label className="block text-sm font-medium mb-1">
                          URL
                        </label>
                        <input
                          type="url"
                          placeholder="https://example.com"
                          className="w-full"
                        />
                      </div>
                    )}
                  </div>
                </WikiCollapsible>

                <WikiButton variant="primary" onClick={handleGenerate}>
                  Generate Citation
                </WikiButton>
              </div>
            </div>
          )}

          {/* Generated Citation Preview */}
          {generatedCitation && (
            <div className="mt-8 pt-6 border-t border-wiki-border-light">
              <h3 className="text-lg font-bold mb-4">Generated Citation</h3>
              <div className="p-4 bg-wiki-offwhite border border-wiki-border-light">
                <p className="citation-text">{generatedCitation}</p>
              </div>
              <div className="mt-4 flex flex-wrap gap-3">
                <WikiButton
                  variant="primary"
                  onClick={() => navigator.clipboard.writeText(generatedCitation)}
                >
                  Copy to Clipboard
                </WikiButton>
                <WikiButton disabled>Add to List</WikiButton>
                <WikiButton disabled>Export</WikiButton>
              </div>
            </div>
          )}
        </div>
      </div>
    </WikiLayout>
  );
}
