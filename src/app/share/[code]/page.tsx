"use client";

import { useState, useEffect, use } from "react";
import { WikiLayout } from "@/components/wiki/wiki-layout";
import { WikiBreadcrumbs } from "@/components/wiki/wiki-breadcrumbs";
import { WikiButton } from "@/components/wiki/wiki-button";
import { WikiCollapsible } from "@/components/wiki/wiki-collapsible";
import { toRTF } from "@/lib/citation/exporters";

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

interface ShareMeta {
  createdAt: string;
  expiresAt?: string;
}

interface SharedData {
  type: "list" | "project";
  id: string;
  name: string;
  description?: string;
  share?: ShareMeta;
  citations?: SharedCitation[];
  lists?: SharedList[];
}

function formatShareFooter(share: ShareMeta | undefined): string | null {
  if (!share) return null;
  const parts: string[] = [];
  try {
    const created = new Date(share.createdAt);
    if (!Number.isNaN(created.getTime())) {
      parts.push(`Shared ${created.toLocaleDateString()}`);
    }
  } catch {
    // ignore
  }
  if (share.expiresAt) {
    try {
      const expires = new Date(share.expiresAt);
      if (!Number.isNaN(expires.getTime())) {
        const ms = expires.getTime() - Date.now();
        if (ms > 0) {
          const days = Math.max(1, Math.round(ms / (24 * 60 * 60 * 1000)));
          parts.push(`expires in ${days} day${days === 1 ? "" : "s"}`);
        } else {
          parts.push("expired");
        }
      }
    } catch {
      // ignore
    }
  }
  return parts.length ? parts.join(" · ") : null;
}

export default function SharePage({ params }: { params: Promise<{ code: string }> }) {
  const { code } = use(params);
  const [data, setData] = useState<SharedData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copyFeedback, setCopyFeedback] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    const fetchSharedContent = async () => {
      try {
        setIsLoading(true);
        const response = await fetch(`/api/share/${code}`);
        const result = await response.json();

        if (cancelled) return;

        if (result.success) {
          setData(result.data);
          setError(null);
        } else {
          setError(result.error || "Share link not found or expired");
        }
      } catch (err) {
        console.error("Error fetching shared content:", err);
        if (!cancelled) setError("Failed to load shared content");
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };

    fetchSharedContent();
    return () => {
      cancelled = true;
    };
  }, [code]);

  const flashCopy = (message: string) => {
    setCopyFeedback(message);
    window.setTimeout(() => setCopyFeedback((m) => (m === message ? null : m)), 1600);
  };

  const copyAllCitations = async (citations: SharedCitation[]) => {
    const allText = citations.map((c) => c.formattedText).join("\n\n");
    try {
      await navigator.clipboard.writeText(allText);
      flashCopy(`Copied ${citations.length} citation${citations.length === 1 ? "" : "s"}`);
    } catch {
      flashCopy("Copy failed");
    }
  };

  const copyOne = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      flashCopy("Copied");
    } catch {
      flashCopy("Copy failed");
    }
  };

  const downloadBlob = (
    content: string,
    name: string,
    extension: string,
    mimeType: string,
  ) => {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    const safeName = name.replace(/[^a-z0-9-_ ]/gi, "_").trim() || "citations";
    a.download = `${safeName}.${extension}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const exportCitations = (citations: SharedCitation[], name: string) => {
    const allText = citations.map((c) => c.formattedText).join("\n\n");
    downloadBlob(allText, name, "txt", "text/plain");
  };

  const exportCitationsRTF = (citations: SharedCitation[], name: string) => {
    downloadBlob(toRTF(citations, name), name, "rtf", "application/rtf");
  };

  if (isLoading) {
    return (
      <WikiLayout>
        <WikiBreadcrumbs
          items={[{ label: "Home", href: "/" }, { label: "Loading..." }]}
        />
        <div className="mt-6 border border-wiki-border-light bg-wiki-white p-6 md:p-8">
          <div className="animate-pulse space-y-4">
            <div className="h-3 w-24 bg-wiki-border-light" />
            <div className="h-6 w-1/2 bg-wiki-border-light" />
            <div className="h-3 w-32 bg-wiki-border-light" />
            <div className="h-24 w-full bg-wiki-offwhite border border-wiki-border-light mt-6" />
            <div className="h-24 w-full bg-wiki-offwhite border border-wiki-border-light" />
          </div>
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
            <WikiButton onClick={() => (window.location.href = "/")}>
              Go to Home
            </WikiButton>
          </div>
        </div>
      </WikiLayout>
    );
  }

  const shareFooter = formatShareFooter(data.share);

  if (data.type === "list") {
    return (
      <WikiLayout>
        <WikiBreadcrumbs
          items={[
            { label: "Home", href: "/" },
            { label: "Shared List" },
          ]}
        />

        {copyFeedback && (
          <div className="fixed top-4 right-4 z-50 bg-wiki-white border border-wiki-border-light px-3 py-2 text-sm shadow-sm">
            {copyFeedback}
          </div>
        )}

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
                  {data.citations?.length || 0} citation
                  {(data.citations?.length || 0) !== 1 ? "s" : ""}
                  {shareFooter ? ` · ${shareFooter}` : ""}
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
                <WikiButton
                  onClick={() => exportCitationsRTF(data.citations!, data.name)}
                  title="Word-compatible with hanging indent"
                >
                  Export .rtf
                </WikiButton>
              </div>
            )}

            {/* Citations */}
            {!data.citations || data.citations.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-wiki-text-muted">This list has no citations.</p>
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
                        onClick={() => copyOne(citation.formattedText)}
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
              <WikiButton variant="primary" onClick={() => (window.location.href = "/cite")}>
                Create Your Own Citations
              </WikiButton>
            </div>
          </div>
        </div>
      </WikiLayout>
    );
  }

  // Project view
  const totalCitations =
    data.lists?.reduce((sum, list) => sum + list.citations.length, 0) || 0;

  return (
    <WikiLayout>
      <WikiBreadcrumbs
        items={[
          { label: "Home", href: "/" },
          { label: "Shared Project" },
        ]}
      />

      {copyFeedback && (
        <div className="fixed top-4 right-4 z-50 bg-wiki-white border border-wiki-border-light px-3 py-2 text-sm shadow-sm">
          {copyFeedback}
        </div>
      )}

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
              {" · "}
              {totalCitations} citation{totalCitations !== 1 ? "s" : ""}
              {shareFooter ? ` · ${shareFooter}` : ""}
            </p>
          </div>

          {/* Lists */}
          {!data.lists || data.lists.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-wiki-text-muted">This project has no lists.</p>
            </div>
          ) : (
            <div className="space-y-6">
              {data.lists.map((list) => (
                <div key={list.id} className="border border-wiki-border-light">
                  <div className="p-4 bg-wiki-offwhite border-b border-wiki-border-light flex items-center justify-between">
                    <div>
                      <h2 className="font-bold">{list.name}</h2>
                      <p className="text-wiki-text-muted text-sm">
                        {list.citations.length} citation
                        {list.citations.length !== 1 ? "s" : ""}
                      </p>
                    </div>
                    {list.citations.length > 0 && (
                      <div className="flex gap-2">
                        <WikiButton onClick={() => copyAllCitations(list.citations)}>
                          Copy All
                        </WikiButton>
                        <WikiButton onClick={() => exportCitations(list.citations, list.name)}>
                          Export .txt
                        </WikiButton>
                        <WikiButton
                          onClick={() => exportCitationsRTF(list.citations, list.name)}
                          title="Word-compatible with hanging indent"
                        >
                          Export .rtf
                        </WikiButton>
                      </div>
                    )}
                  </div>
                  <div className="p-4">
                    {list.citations.length === 0 ? (
                      <p className="text-wiki-text-muted text-sm">
                        No citations in this list.
                      </p>
                    ) : (
                      <div className="space-y-3">
                        {list.citations.map((citation) => (
                          <div
                            key={citation.id}
                            className="p-3 bg-wiki-offwhite border border-wiki-border-light"
                          >
                            <div className="text-xs text-wiki-text-muted mb-1">
                              {citation.style.toUpperCase()}
                            </div>
                            <p
                              className="citation-text text-sm"
                              dangerouslySetInnerHTML={{ __html: citation.formattedHtml }}
                            />
                            <button
                              onClick={() => copyOne(citation.formattedText)}
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
            <WikiButton variant="primary" onClick={() => (window.location.href = "/cite")}>
              Create Your Own Citations
            </WikiButton>
          </div>
        </div>
      </div>
    </WikiLayout>
  );
}
