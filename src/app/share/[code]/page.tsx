"use client";

import { useState, useEffect, use, useCallback } from "react";
import { useUser } from "@clerk/nextjs";
import { WikiLayout } from "@/components/wiki/wiki-layout";
import { WikiBreadcrumbs } from "@/components/wiki/wiki-breadcrumbs";
import { WikiButton } from "@/components/wiki/wiki-button";
import { WikiCollapsible } from "@/components/wiki/wiki-collapsible";
import { toRTF } from "@/lib/citation/exporters";
import { parseShareSegment } from "@/lib/share-utils";
import DOMPurify from "isomorphic-dompurify";
import posthog from "posthog-js";

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
  type: "list" | "project" | "citation";
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

interface SaveResult {
  type: "list" | "project";
  id: string;
  name: string;
}

export default function SharePage({ params }: { params: Promise<{ code: string }> }) {
  const { code: segment } = use(params);
  const { code } = parseShareSegment(segment);
  const { isLoaded: isAuthLoaded, isSignedIn } = useUser();
  const [data, setData] = useState<SharedData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copyFeedback, setCopyFeedback] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [saveResult, setSaveResult] = useState<SaveResult | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [requiresPassword, setRequiresPassword] = useState(false);
  const [passwordInput, setPasswordInput] = useState("");
  const [unlockedPassword, setUnlockedPassword] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [isUnlocking, setIsUnlocking] = useState(false);

  const fetchSharedContent = useCallback(async (password?: string) => {
    setIsLoading(true);
    try {
      const headers: HeadersInit = password ? { "x-share-password": password } : {};
      const response = await fetch(`/api/share/${code}`, { headers });
      const result = await response.json();

      if (result.success) {
        setData(result.data);
        setError(null);
        setRequiresPassword(false);
        if (password) setUnlockedPassword(password);
        const d = result.data as SharedData;
        posthog.capture("share_page_viewed", {
          share_type: d.type,
          citation_count: d.type === "list"
            ? (d.citations?.length ?? 0)
            : (d.lists?.reduce((s, l) => s + l.citations.length, 0) ?? 0),
          list_count: d.type === "project" ? (d.lists?.length ?? 0) : 1,
          had_password: !!password,
        });
        return true;
      }
      if (response.status === 401 && result.requiresPassword) {
        setRequiresPassword(true);
        if (password) setPasswordError("Incorrect password");
        return false;
      }
      setError(result.error || "Share link not found or expired");
      return false;
    } catch (err) {
      console.error("Error fetching shared content:", err);
      setError("Failed to load shared content");
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [code]);

  useEffect(() => {
    fetchSharedContent();
  }, [fetchSharedContent]);

  // Maintain <link rel="canonical"> pointing at the slugged URL so search
  // engines and reader-mode tools can pick the share's preferred URL.
  useEffect(() => {
    if (typeof document === "undefined") return;
    const href = `${window.location.origin}/share/${segment}`;
    let link = document.querySelector<HTMLLinkElement>('link[rel="canonical"]');
    const created = !link;
    if (!link) {
      link = document.createElement("link");
      link.rel = "canonical";
      document.head.appendChild(link);
    }
    const prev = link.href;
    link.href = href;
    return () => {
      if (created) {
        link?.remove();
      } else if (link) {
        link.href = prev;
      }
    };
  }, [segment]);

  const handleUnlock = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!passwordInput) return;
    setIsUnlocking(true);
    setPasswordError(null);
    await fetchSharedContent(passwordInput);
    setIsUnlocking(false);
  };

  const flashCopy = (message: string) => {
    setCopyFeedback(message);
    window.setTimeout(() => setCopyFeedback((m) => (m === message ? null : m)), 1600);
  };

  const copyAllCitations = async (citations: SharedCitation[]) => {
    const allText = citations.map((c) => c.formattedText).join("\n\n");
    try {
      await navigator.clipboard.writeText(allText);
      flashCopy(`Copied ${citations.length} citation${citations.length === 1 ? "" : "s"}`);
      posthog.capture("share_all_copied", { citation_count: citations.length, share_code: code });
    } catch {
      flashCopy("Copy failed");
    }
  };

  const copyOne = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      flashCopy("Copied");
      posthog.capture("share_citation_copied", { share_code: code });
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
    posthog.capture("share_exported", { format: "txt", citation_count: citations.length, share_code: code });
  };

  const exportCitationsRTF = (citations: SharedCitation[], name: string) => {
    downloadBlob(toRTF(citations, name), name, "rtf", "application/rtf");
    posthog.capture("share_exported", { format: "rtf", citation_count: citations.length, share_code: code });
  };

  const handleSave = async () => {
    setIsSaving(true);
    setSaveError(null);
    try {
      const headers: HeadersInit = unlockedPassword
        ? { "x-share-password": unlockedPassword }
        : {};
      const response = await fetch(`/api/share/${code}/clone`, {
        method: "POST",
        headers,
      });
      const result = await response.json();
      if (result.success) {
        setSaveResult(result.data);
        posthog.capture("share_saved_to_account", {
          share_type: result.data.type,
          share_code: code,
        });
      } else {
        setSaveError(result.error || "Failed to save");
      }
    } catch {
      setSaveError("Failed to save to your account");
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <WikiLayout>
        <WikiBreadcrumbs
          items={[{ label: "Home", href: "/" }, { label: "Loading..." }]}
        />
        <div className="flex items-center justify-center py-12">
          <span className="text-sm text-wiki-text-muted">Loading…</span>
        </div>
      </WikiLayout>
    );
  }

  if (requiresPassword && !data) {
    return (
      <WikiLayout>
        <WikiBreadcrumbs
          items={[
            { label: "Home", href: "/" },
            { label: "Locked share" },
          ]}
        />
        <div className="mt-6 max-w-md mx-auto p-6 border border-wiki-border-light bg-wiki-white">
          <h1 className="text-lg font-bold mb-2">Password required</h1>
          <p className="text-sm text-wiki-text-muted mb-4">
            This share is password-protected. Enter the password to view its
            contents.
          </p>
          <form onSubmit={handleUnlock} className="space-y-3">
            <div>
              <label htmlFor="share-password" className="block text-xs font-medium mb-1">
                Password
              </label>
              <input
                id="share-password"
                type="password"
                value={passwordInput}
                onChange={(e) => { setPasswordInput(e.target.value); setPasswordError(null); }}
                aria-invalid={!!passwordError}
                aria-describedby={passwordError ? "share-password-error" : undefined}
                autoFocus
                className="w-full"
              />
              {passwordError && (
                <p id="share-password-error" role="alert" className="mt-1 text-xs text-wiki-text">
                  {passwordError}
                </p>
              )}
            </div>
            <WikiButton variant="primary" disabled={!passwordInput || isUnlocking}>
              {isUnlocking ? "Unlocking…" : "Unlock"}
            </WikiButton>
          </form>
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

  if (data.type === "list" || data.type === "citation") {
    return (
      <WikiLayout>
        <WikiBreadcrumbs
          items={[
            { label: "Home", href: "/" },
            { label: data.type === "citation" ? "Shared Citation" : "Shared List" },
          ]}
        />

        <div
          role="status"
          aria-live="polite"
          aria-atomic="true"
          className={
            copyFeedback
              ? "fixed top-4 right-4 z-50 bg-wiki-white border border-wiki-border-light px-3 py-2 text-sm"
              : "sr-only"
          }
        >
          {copyFeedback}
        </div>

        <div className="mt-6">
          <article className="border border-wiki-border-light bg-wiki-white p-6 md:p-8">
            {/* Header */}
            <div className="flex items-start justify-between mb-6">
              <div>
                <div className="text-xs text-wiki-text-muted uppercase tracking-wide mb-1">
                  {data.type === "citation" ? "Shared Citation" : "Shared List"}
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
                        dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(citation.formattedHtml) }}
                      />
                      <button
                        onClick={() => copyOne(citation.formattedText)}
                        className="text-wiki-link text-sm hover:underline focus-visible:outline-dotted focus-visible:outline-1 focus-visible:outline-wiki-text"
                      >
                        [copy]
                      </button>
                    </div>
                  </WikiCollapsible>
                ))}
              </div>
            )}

            {/* Footer */}
            <div className="mt-8 pt-6 border-t border-wiki-border-light text-center space-y-3">
              <p className="text-wiki-text-muted text-sm">
                This list was shared via OpenCitation
              </p>
              {isAuthLoaded && (
                isSignedIn ? (
                  saveResult ? (
                    <p className="text-sm">
                      Saved!{" "}
                      <a
                        href={`/lists/${saveResult.id}`}
                        className="text-wiki-link hover:underline"
                      >
                        Open &ldquo;{saveResult.name}&rdquo;
                      </a>
                    </p>
                  ) : (
                    <div className="flex flex-col items-center gap-2">
                      <WikiButton onClick={handleSave} disabled={isSaving}>
                        {isSaving ? "Saving…" : "Save to my account"}
                      </WikiButton>
                      {saveError && (
                        <p role="alert" className="text-wiki-text text-xs">{saveError}</p>
                      )}
                    </div>
                  )
                ) : (
                  <a
                    href={`/sign-up?redirect_url=/share/${segment}`}
                    className="text-wiki-link hover:underline text-sm"
                  >
                    Create a free account to save a copy
                  </a>
                )
              )}
              <div>
                <WikiButton variant="primary" onClick={() => (window.location.href = "/cite")}>
                  Create Your Own Citations
                </WikiButton>
              </div>
            </div>
          </article>
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

      <div
        role="status"
        aria-live="polite"
        aria-atomic="true"
        className={
          copyFeedback
            ? "fixed top-4 right-4 z-50 bg-wiki-white border border-wiki-border-light px-3 py-2 text-sm"
            : "sr-only"
        }
      >
        {copyFeedback}
      </div>

      <div className="mt-6">
        <article className="border border-wiki-border-light bg-wiki-white p-6 md:p-8">
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
                              dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(citation.formattedHtml) }}
                            />
                            <button
                              onClick={() => copyOne(citation.formattedText)}
                              className="text-wiki-link text-xs hover:underline mt-2 focus-visible:outline-dotted focus-visible:outline-1 focus-visible:outline-wiki-text"
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
          <div className="mt-8 pt-6 border-t border-wiki-border-light text-center space-y-3">
            <p className="text-wiki-text-muted text-sm">
              This project was shared via OpenCitation
            </p>
            {isAuthLoaded && (
              isSignedIn ? (
                saveResult ? (
                  <p className="text-sm">
                    Saved!{" "}
                    <a
                      href={`/projects/${saveResult.id}`}
                      className="text-wiki-link hover:underline"
                    >
                      Open &ldquo;{saveResult.name}&rdquo;
                    </a>
                  </p>
                ) : (
                  <div className="flex flex-col items-center gap-2">
                    <WikiButton onClick={handleSave} disabled={isSaving}>
                      {isSaving ? "Saving…" : "Save to my account"}
                    </WikiButton>
                    {saveError && (
                      <p className="text-wiki-text text-xs">{saveError}</p>
                    )}
                  </div>
                )
              ) : (
                <a
                  href={`/sign-up?redirect_url=/share/${segment}`}
                  className="text-wiki-link hover:underline text-sm"
                >
                  Create a free account to save a copy
                </a>
              )
            )}
            <div>
              <WikiButton variant="primary" onClick={() => (window.location.href = "/cite")}>
                Create Your Own Citations
              </WikiButton>
            </div>
          </div>
        </article>
      </div>
    </WikiLayout>
  );
}
