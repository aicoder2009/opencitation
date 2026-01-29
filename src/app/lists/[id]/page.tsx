"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import { WikiLayout } from "@/components/wiki/wiki-layout";
import { WikiBreadcrumbs } from "@/components/wiki/wiki-breadcrumbs";
import { WikiButton } from "@/components/wiki/wiki-button";
import { WikiCollapsible } from "@/components/wiki/wiki-collapsible";
import { PrintAnimation } from "@/components/retro/print-animation";

interface List {
  id: string;
  name: string;
  projectId?: string;
  createdAt: string;
  updatedAt: string;
}

interface Citation {
  id: string;
  listId: string;
  style: string;
  formattedText: string;
  formattedHtml: string;
  createdAt: string;
  updatedAt: string;
}

export default function ListDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: listId } = use(params);
  const router = useRouter();
  const { isLoaded, isSignedIn } = useUser();
  const [list, setList] = useState<List | null>(null);
  const [citations, setCitations] = useState<Citation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState("");
  const [shareUrl, setShareUrl] = useState<string | null>(null);
  const [isSharing, setIsSharing] = useState(false);
  const [showPrintAnimation, setShowPrintAnimation] = useState(false);
  const [printSoundEnabled, setPrintSoundEnabled] = useState(true);

  useEffect(() => {
    if (isLoaded && !isSignedIn) {
      router.push(`/sign-in?redirect_url=/lists/${listId}`);
      return;
    }

    if (isSignedIn && listId) {
      fetchListAndCitations();
    }
  }, [isLoaded, isSignedIn, listId, router]);

  const fetchListAndCitations = async () => {
    try {
      setIsLoading(true);

      // Fetch list details
      const listResponse = await fetch(`/api/lists/${listId}`);
      const listResult = await listResponse.json();

      if (!listResult.success) {
        setError(listResult.error || "List not found");
        return;
      }

      setList(listResult.data);
      setEditName(listResult.data.name);

      // Fetch citations
      const citationsResponse = await fetch(`/api/lists/${listId}/citations`);
      const citationsResult = await citationsResponse.json();

      if (citationsResult.success) {
        setCitations(citationsResult.data);
      }
    } catch (err) {
      console.error("Error fetching list:", err);
      setError("Failed to load list");
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateName = async () => {
    if (!editName.trim() || editName.trim() === list?.name) {
      setIsEditing(false);
      return;
    }

    try {
      const response = await fetch(`/api/lists/${listId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: editName.trim() }),
      });

      const result = await response.json();

      if (result.success) {
        setList(result.data);
        setIsEditing(false);
      } else {
        setError(result.error || "Failed to update list");
      }
    } catch (err) {
      console.error("Error updating list:", err);
      setError("Failed to update list");
    }
  };

  const handleDeleteCitation = async (citationId: string) => {
    if (!confirm("Are you sure you want to delete this citation?")) {
      return;
    }

    try {
      const response = await fetch(`/api/lists/${listId}/citations/${citationId}`, {
        method: "DELETE",
      });

      const result = await response.json();

      if (result.success) {
        setCitations((prev) => prev.filter((c) => c.id !== citationId));
      } else {
        setError(result.error || "Failed to delete citation");
      }
    } catch (err) {
      console.error("Error deleting citation:", err);
      setError("Failed to delete citation");
    }
  };

  const copyAllCitations = () => {
    const allText = citations.map((c) => c.formattedText).join("\n\n");
    navigator.clipboard.writeText(allText);
  };

  const exportAllCitations = () => {
    const allText = citations.map((c) => c.formattedText).join("\n\n");
    const blob = new Blob([allText], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${list?.name || "citations"}-${Date.now()}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleShare = async () => {
    try {
      setIsSharing(true);
      const response = await fetch("/api/share", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "list",
          targetId: listId,
        }),
      });

      const result = await response.json();

      if (result.success) {
        const url = `${window.location.origin}/share/${result.data.code}`;
        setShareUrl(url);
        navigator.clipboard.writeText(url);
      } else {
        setError(result.error || "Failed to create share link");
      }
    } catch (err) {
      console.error("Error sharing:", err);
      setError("Failed to create share link");
    } finally {
      setIsSharing(false);
    }
  };

  if (!isLoaded || (isLoaded && !isSignedIn)) {
    return (
      <WikiLayout>
        <div className="flex items-center justify-center py-12">
          <p className="text-wiki-text-muted">Loading...</p>
        </div>
      </WikiLayout>
    );
  }

  if (isLoading) {
    return (
      <WikiLayout>
        <div className="flex items-center justify-center py-12">
          <p className="text-wiki-text-muted">Loading list...</p>
        </div>
      </WikiLayout>
    );
  }

  if (error && !list) {
    return (
      <WikiLayout>
        <WikiBreadcrumbs
          items={[
            { label: "Home", href: "/" },
            { label: "My Lists", href: "/lists" },
            { label: "Error" },
          ]}
        />
        <div className="mt-6 p-6 border border-red-200 bg-red-50 text-red-700">
          <h2 className="font-bold mb-2">Error</h2>
          <p>{error}</p>
          <WikiButton onClick={() => router.push("/lists")} className="mt-4">
            Back to Lists
          </WikiButton>
        </div>
      </WikiLayout>
    );
  }

  return (
    <WikiLayout>
      <WikiBreadcrumbs
        items={[
          { label: "Home", href: "/" },
          { label: "My Lists", href: "/lists" },
          { label: list?.name || "List" },
        ]}
      />

      <div className="mt-6">
        <div className="border border-wiki-border-light bg-wiki-white p-6 md:p-8">
          {/* Header */}
          <div className="flex items-start justify-between mb-6">
            <div className="flex-1">
              {isEditing ? (
                <div className="flex gap-2 items-center">
                  <input
                    type="text"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="text-xl font-bold"
                    onKeyDown={(e) => e.key === "Enter" && handleUpdateName()}
                    autoFocus
                  />
                  <WikiButton onClick={handleUpdateName}>Save</WikiButton>
                  <WikiButton onClick={() => { setIsEditing(false); setEditName(list?.name || ""); }}>
                    Cancel
                  </WikiButton>
                </div>
              ) : (
                <h1 className="text-2xl font-bold mb-1">
                  {list?.name}
                  <button
                    onClick={() => setIsEditing(true)}
                    className="ml-2 text-wiki-link text-sm font-normal hover:underline"
                  >
                    [edit]
                  </button>
                </h1>
              )}
              <p className="text-wiki-text-muted text-sm">
                {citations.length} citation{citations.length !== 1 ? "s" : ""}
              </p>
            </div>
            <div className="flex gap-2">
              <WikiButton onClick={handleShare} disabled={isSharing}>
                {isSharing ? "Sharing..." : "Share"}
              </WikiButton>
              <WikiButton variant="primary" onClick={() => router.push("/cite")}>
                Add Citation
              </WikiButton>
            </div>
          </div>

          {/* Share URL */}
          {shareUrl && (
            <div className="mb-4 p-3 bg-green-50 border border-green-200 text-green-700 text-sm">
              Share link copied to clipboard: {shareUrl}
              <button
                onClick={() => setShareUrl(null)}
                className="ml-2 text-green-500 hover:text-green-700"
              >
                [dismiss]
              </button>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 text-sm">
              {error}
              <button
                onClick={() => setError(null)}
                className="ml-2 text-red-500 hover:text-red-700"
              >
                [dismiss]
              </button>
            </div>
          )}

          {/* Actions */}
          {citations.length > 0 && (
            <div className="mb-6 flex flex-wrap gap-3">
              <WikiButton onClick={copyAllCitations}>
                Copy All
              </WikiButton>
              <WikiButton onClick={exportAllCitations}>
                Export .txt
              </WikiButton>
              <WikiButton onClick={() => setShowPrintAnimation(true)}>
                Print
              </WikiButton>
            </div>
          )}

          {/* Citations */}
          {citations.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-wiki-text-muted mb-4">
                This list is empty. Add your first citation!
              </p>
              <WikiButton variant="primary" onClick={() => router.push("/cite")}>
                Create Citation
              </WikiButton>
            </div>
          ) : (
            <div className="space-y-4">
              {citations.map((citation, index) => (
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
                    <div className="flex gap-2">
                      <button
                        onClick={() => navigator.clipboard.writeText(citation.formattedText)}
                        className="text-wiki-link text-sm hover:underline"
                      >
                        [copy]
                      </button>
                      <button
                        onClick={() => handleDeleteCitation(citation.id)}
                        className="text-red-600 text-sm hover:underline"
                      >
                        [delete]
                      </button>
                    </div>
                  </div>
                </WikiCollapsible>
              ))}
            </div>
          )}

          {/* Back Link */}
          <div className="mt-8 pt-6 border-t border-wiki-border-light">
            <a href="/lists" className="text-wiki-link hover:underline">
              &larr; Back to My Lists
            </a>
          </div>
        </div>
      </div>

      {/* Print Animation Modal */}
      <PrintAnimation
        isOpen={showPrintAnimation}
        onClose={() => setShowPrintAnimation(false)}
        onComplete={() => {
          setShowPrintAnimation(false);
          exportAllCitations();
        }}
        itemCount={citations.length || 1}
        fileName={`${list?.name || "citations"}.txt`}
        soundEnabled={printSoundEnabled}
        onSoundToggle={setPrintSoundEnabled}
      />
    </WikiLayout>
  );
}
