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
  tags?: string[];
  createdAt: string;
  updatedAt: string;
}

// Predefined tag colors
const TAG_COLORS = [
  { bg: "bg-blue-100", text: "text-blue-700", border: "border-blue-200" },
  { bg: "bg-green-100", text: "text-green-700", border: "border-green-200" },
  { bg: "bg-purple-100", text: "text-purple-700", border: "border-purple-200" },
  { bg: "bg-orange-100", text: "text-orange-700", border: "border-orange-200" },
  { bg: "bg-pink-100", text: "text-pink-700", border: "border-pink-200" },
  { bg: "bg-teal-100", text: "text-teal-700", border: "border-teal-200" },
];

function getTagColor(tag: string) {
  // Generate consistent color based on tag name
  const hash = tag.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return TAG_COLORS[hash % TAG_COLORS.length];
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
  const [searchQuery, setSearchQuery] = useState("");
  const [filterTag, setFilterTag] = useState<string | null>(null);
  const [editingTagsCitationId, setEditingTagsCitationId] = useState<string | null>(null);
  const [newTagInput, setNewTagInput] = useState("");

  // Get all unique tags from citations
  const allTags = Array.from(
    new Set(citations.flatMap((c) => c.tags || []))
  ).sort();

  // Filter citations based on search query and tag filter
  const filteredCitations = citations.filter((citation) => {
    // Tag filter
    if (filterTag && (!citation.tags || !citation.tags.includes(filterTag))) {
      return false;
    }
    // Search filter
    if (!searchQuery.trim()) return true;
    const query = searchQuery.toLowerCase();
    return citation.formattedText.toLowerCase().includes(query);
  });

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

  const handleAddTag = async (citationId: string, newTag: string) => {
    const tag = newTag.trim().toLowerCase();
    if (!tag) return;

    const citation = citations.find((c) => c.id === citationId);
    if (!citation) return;

    const currentTags = citation.tags || [];
    if (currentTags.includes(tag)) return;

    const updatedTags = [...currentTags, tag];

    try {
      const response = await fetch(`/api/lists/${listId}/citations/${citationId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tags: updatedTags }),
      });

      const result = await response.json();

      if (result.success) {
        setCitations((prev) =>
          prev.map((c) => (c.id === citationId ? { ...c, tags: updatedTags } : c))
        );
      }
    } catch (err) {
      console.error("Error adding tag:", err);
    }

    setNewTagInput("");
  };

  const handleRemoveTag = async (citationId: string, tagToRemove: string) => {
    const citation = citations.find((c) => c.id === citationId);
    if (!citation) return;

    const updatedTags = (citation.tags || []).filter((t) => t !== tagToRemove);

    try {
      const response = await fetch(`/api/lists/${listId}/citations/${citationId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tags: updatedTags }),
      });

      const result = await response.json();

      if (result.success) {
        setCitations((prev) =>
          prev.map((c) => (c.id === citationId ? { ...c, tags: updatedTags } : c))
        );
        // Clear filter if removing the filtered tag
        if (filterTag === tagToRemove && !citations.some((c) => c.tags?.includes(tagToRemove) && c.id !== citationId)) {
          setFilterTag(null);
        }
      }
    } catch (err) {
      console.error("Error removing tag:", err);
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

          {/* Search and Actions */}
          {citations.length > 0 && (
            <div className="mb-6 space-y-4">
              {/* Search */}
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Search citations..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="flex-1 max-w-sm"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery("")}
                    className="text-wiki-text-muted hover:text-wiki-text text-sm"
                  >
                    Clear
                  </button>
                )}
              </div>
              {/* Tag Filter */}
              {allTags.length > 0 && (
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-sm text-wiki-text-muted">Filter by tag:</span>
                  <button
                    onClick={() => setFilterTag(null)}
                    className={`px-2 py-0.5 text-xs border ${
                      filterTag === null
                        ? "bg-wiki-link text-white border-wiki-link"
                        : "bg-white text-wiki-text border-wiki-border-light hover:border-wiki-link"
                    }`}
                  >
                    All
                  </button>
                  {allTags.map((tag) => {
                    const color = getTagColor(tag);
                    const isActive = filterTag === tag;
                    return (
                      <button
                        key={tag}
                        onClick={() => setFilterTag(isActive ? null : tag)}
                        className={`px-2 py-0.5 text-xs border ${
                          isActive
                            ? "bg-wiki-link text-white border-wiki-link"
                            : `${color.bg} ${color.text} ${color.border} hover:opacity-80`
                        }`}
                      >
                        {tag}
                      </button>
                    );
                  })}
                </div>
              )}
              {(searchQuery || filterTag) && (
                <p className="text-sm text-wiki-text-muted">
                  Showing {filteredCitations.length} of {citations.length} citations
                  {filterTag && <span className="ml-1">(filtered by tag: {filterTag})</span>}
                </p>
              )}
              {/* Actions */}
              <div className="flex flex-wrap gap-3">
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
          ) : filteredCitations.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-wiki-text-muted">
                No citations match your search.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredCitations.map((citation, index) => (
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
                    <div className="flex flex-wrap gap-2 mb-3">
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
                    {/* Tags Section */}
                    <div className="pt-3 border-t border-wiki-border-light">
                      <div className="flex flex-wrap items-center gap-2">
                        {(citation.tags || []).map((tag) => {
                          const color = getTagColor(tag);
                          return (
                            <span
                              key={tag}
                              className={`inline-flex items-center gap-1 px-2 py-0.5 text-xs border ${color.bg} ${color.text} ${color.border}`}
                            >
                              {tag}
                              <button
                                onClick={() => handleRemoveTag(citation.id, tag)}
                                className="hover:text-red-600"
                                title="Remove tag"
                              >
                                &times;
                              </button>
                            </span>
                          );
                        })}
                        {editingTagsCitationId === citation.id ? (
                          <div className="flex items-center gap-1">
                            <input
                              type="text"
                              value={newTagInput}
                              onChange={(e) => setNewTagInput(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === "Enter") {
                                  handleAddTag(citation.id, newTagInput);
                                } else if (e.key === "Escape") {
                                  setEditingTagsCitationId(null);
                                  setNewTagInput("");
                                }
                              }}
                              placeholder="tag name"
                              className="w-24 px-1 py-0.5 text-xs border border-wiki-border-light"
                              autoFocus
                            />
                            <button
                              onClick={() => handleAddTag(citation.id, newTagInput)}
                              className="text-wiki-link text-xs hover:underline"
                            >
                              add
                            </button>
                            <button
                              onClick={() => {
                                setEditingTagsCitationId(null);
                                setNewTagInput("");
                              }}
                              className="text-wiki-text-muted text-xs hover:underline"
                            >
                              cancel
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => setEditingTagsCitationId(citation.id)}
                            className="text-wiki-link text-xs hover:underline"
                          >
                            [+ add tag]
                          </button>
                        )}
                      </div>
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
