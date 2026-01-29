"use client";

import { useState, useEffect, use } from "react";
import { WikiLayout } from "@/components/wiki/wiki-layout";
import { WikiBreadcrumbs } from "@/components/wiki/wiki-breadcrumbs";
import { WikiButton } from "@/components/wiki/wiki-button";
import { WikiCollapsible } from "@/components/wiki/wiki-collapsible";

interface SharedCitation {
  id: string;
  style: string;
  formattedText: string;
  formattedHtml: string;
  createdAt: string;
}

interface SharedList {
  id: string;
  name: string;
  citations: SharedCitation[];
}

interface SharedData {
  type: "list" | "project";
  id: string;
  name: string;
  description?: string;
  citations?: SharedCitation[];
  lists?: SharedList[];
}

export default function SharePage({ params }: { params: Promise<{ code: string }> }) {
  const { code } = use(params);
  const [data, setData] = useState<SharedData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchSharedContent();
  }, [code]);

  const fetchSharedContent = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/share/${code}`);
      const result = await response.json();

      if (result.success) {
        setData(result.data);
      } else {
        setError(result.error || "Share link not found or expired");
      }
    } catch (err) {
      console.error("Error fetching shared content:", err);
      setError("Failed to load shared content");
    } finally {
      setIsLoading(false);
    }
  };

  const copyAllCitations = (citations: SharedCitation[]) => {
    const allText = citations.map((c) => c.formattedText).join("\n\n");
    navigator.clipboard.writeText(allText);
  };

  const exportCitations = (citations: SharedCitation[], name: string) => {
    const allText = citations.map((c) => c.formattedText).join("\n\n");
    const blob = new Blob([allText], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${name}-${Date.now()}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  if (isLoading) {
    return (
      <WikiLayout>
        <div className="flex items-center justify-center py-12">
          <p className="text-wiki-text-muted">Loading shared content...</p>
        </div>
      </WikiLayout>
    );
  }

  if (error || !data) {
    return (
      <WikiLayout>
        <WikiBreadcrumbs
          items={[
            { label: "Home", href: "/" },
            { label: "Shared Content" },
          ]}
        />
        <div className="mt-6 p-6 border border-wiki-border-light bg-wiki-white">
          <div className="text-center py-8">
            <h1 className="text-2xl font-bold mb-4">Content Not Found</h1>
            <p className="text-wiki-text-muted mb-6">
              {error || "This share link may have expired or been removed."}
            </p>
            <WikiButton onClick={() => window.location.href = "/"}>
              Go to Home
            </WikiButton>
          </div>
        </div>
      </WikiLayout>
    );
  }

  if (data.type === "list") {
    return (
      <WikiLayout>
        <WikiBreadcrumbs
          items={[
            { label: "Home", href: "/" },
            { label: "Shared List" },
          ]}
        />

        <div className="mt-6">
          <div className="border border-wiki-border-light bg-wiki-white p-6 md:p-8">
            {/* Header */}
            <div className="flex items-start justify-between mb-6">
              <div>
                <div className="text-xs text-wiki-text-muted uppercase tracking-wide mb-1">
                  Shared List
                </div>
                <h1 className="text-2xl font-bold mb-1">{data.name}</h1>
                <p className="text-wiki-text-muted text-sm">
                  {data.citations?.length || 0} citation{(data.citations?.length || 0) !== 1 ? "s" : ""}
                </p>
              </div>
            </div>

            {/* Actions */}
            {data.citations && data.citations.length > 0 && (
              <div className="mb-6 flex flex-wrap gap-3">
                <WikiButton onClick={() => copyAllCitations(data.citations!)}>
                  Copy All
                </WikiButton>
                <WikiButton onClick={() => exportCitations(data.citations!, data.name)}>
                  Export .txt
                </WikiButton>
              </div>
            )}

            {/* Citations */}
            {!data.citations || data.citations.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-wiki-text-muted">
                  This list has no citations.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {data.citations.map((citation, index) => (
                  <WikiCollapsible
                    key={citation.id}
                    title={`Citation ${index + 1} (${citation.style.toUpperCase()})`}
                    defaultOpen={index === 0}
                  >
                    <div className="p-4 bg-wiki-offwhite border border-wiki-border-light">
                      <p
                        className="citation-text mb-4"
                        dangerouslySetInnerHTML={{ __html: citation.formattedHtml }}
                      />
                      <button
                        onClick={() => navigator.clipboard.writeText(citation.formattedText)}
                        className="text-wiki-link text-sm hover:underline"
                      >
                        [copy]
                      </button>
                    </div>
                  </WikiCollapsible>
                ))}
              </div>
            )}

            {/* Footer */}
            <div className="mt-8 pt-6 border-t border-wiki-border-light text-center">
              <p className="text-wiki-text-muted text-sm mb-4">
                This list was shared via OpenCitation
              </p>
              <WikiButton variant="primary" onClick={() => window.location.href = "/cite"}>
                Create Your Own Citations
              </WikiButton>
            </div>
          </div>
        </div>
      </WikiLayout>
    );
  }

  // Project view
  return (
    <WikiLayout>
      <WikiBreadcrumbs
        items={[
          { label: "Home", href: "/" },
          { label: "Shared Project" },
        ]}
      />

      <div className="mt-6">
        <div className="border border-wiki-border-light bg-wiki-white p-6 md:p-8">
          {/* Header */}
          <div className="mb-6">
            <div className="text-xs text-wiki-text-muted uppercase tracking-wide mb-1">
              Shared Project
            </div>
            <h1 className="text-2xl font-bold mb-1">{data.name}</h1>
            {data.description && (
              <p className="text-wiki-text-muted mb-2">{data.description}</p>
            )}
            <p className="text-wiki-text-muted text-sm">
              {data.lists?.length || 0} list{(data.lists?.length || 0) !== 1 ? "s" : ""}
            </p>
          </div>

          {/* Lists */}
          {!data.lists || data.lists.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-wiki-text-muted">
                This project has no lists.
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {data.lists.map((list) => (
                <div key={list.id} className="border border-wiki-border-light">
                  <div className="p-4 bg-wiki-offwhite border-b border-wiki-border-light flex items-center justify-between">
                    <div>
                      <h2 className="font-bold">{list.name}</h2>
                      <p className="text-wiki-text-muted text-sm">
                        {list.citations.length} citation{list.citations.length !== 1 ? "s" : ""}
                      </p>
                    </div>
                    {list.citations.length > 0 && (
                      <div className="flex gap-2">
                        <WikiButton onClick={() => copyAllCitations(list.citations)}>
                          Copy All
                        </WikiButton>
                        <WikiButton onClick={() => exportCitations(list.citations, list.name)}>
                          Export
                        </WikiButton>
                      </div>
                    )}
                  </div>
                  <div className="p-4">
                    {list.citations.length === 0 ? (
                      <p className="text-wiki-text-muted text-sm">No citations in this list.</p>
                    ) : (
                      <div className="space-y-3">
                        {list.citations.map((citation, index) => (
                          <div key={citation.id} className="p-3 bg-wiki-offwhite border border-wiki-border-light">
                            <div className="text-xs text-wiki-text-muted mb-1">
                              {citation.style.toUpperCase()}
                            </div>
                            <p
                              className="citation-text text-sm"
                              dangerouslySetInnerHTML={{ __html: citation.formattedHtml }}
                            />
                            <button
                              onClick={() => navigator.clipboard.writeText(citation.formattedText)}
                              className="text-wiki-link text-xs hover:underline mt-2"
                            >
                              [copy]
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Footer */}
          <div className="mt-8 pt-6 border-t border-wiki-border-light text-center">
            <p className="text-wiki-text-muted text-sm mb-4">
              This project was shared via OpenCitation
            </p>
            <WikiButton variant="primary" onClick={() => window.location.href = "/cite"}>
              Create Your Own Citations
            </WikiButton>
          </div>
        </div>
      </div>
    </WikiLayout>
  );
}
