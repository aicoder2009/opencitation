"use client";

import { useState, useEffect, use, useRef } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { WikiLayout } from "@/components/wiki/wiki-layout";
import { WikiBreadcrumbs } from "@/components/wiki/wiki-breadcrumbs";
import { WikiButton } from "@/components/wiki/wiki-button";
import { WikiDropdown } from "@/components/wiki/wiki-dropdown";
import { SortableCitation } from "@/components/wiki/sortable-citation";
import { TagColorPicker } from "@/components/wiki/tag-color-picker";
import { PrintAnimation } from "@/components/retro/print-animation";
import { ShortcutHelp, useKeyboardShortcuts } from "@/components/wiki/shortcut-help";
import { formatCitation } from "@/lib/citation";
import {
  toBibTeXMultiple,
  toRISMultiple,
  toMarkdown,
  toHTML,
  toCSLJSON,
} from "@/lib/citation/exporters";
import { useTagColors } from "@/lib/tag-colors";
import { pickFactoid } from "@/lib/did-you-know";
import type { SourceType, AccessType, CitationFields as FullCitationFields, CitationStyle } from "@/types";
import { CITATION_STYLES, CITATION_STYLE_LABELS } from "@/types";

interface List {
  id: string;
  name: string;
  projectId?: string;
  createdAt: string;
  updatedAt: string;
}

interface CitationFields {
  sourceType?: SourceType;
  accessType?: AccessType;
  title?: string;
  authors?: Array<{ firstName?: string; middleName?: string; lastName: string; isOrganization?: boolean }>;
  publicationDate?: { year?: number; month?: number; day?: number };
  url?: string;
  doi?: string;
  [key: string]: unknown;
}

interface Citation {
  id: string;
  listId: string;
  style: string;
  formattedText: string;
  formattedHtml: string;
  fields?: CitationFields;
  tags?: string[];
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
  const [copySuccess, setCopySuccess] = useState(false);
  const [showPrintAnimation, setShowPrintAnimation] = useState(false);
  const [printSoundEnabled, setPrintSoundEnabled] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterTag, setFilterTag] = useState<string | null>(null);
  const [editingTagsCitationId, setEditingTagsCitationId] = useState<string | null>(null);
  const [newTagInput, setNewTagInput] = useState("");
  const [selectedIndex, setSelectedIndex] = useState<number>(-1);
  const [editingCitationId, setEditingCitationId] = useState<string | null>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const { getColor: getTagColor, setColor: setTagColor, clearColor: clearTagColor } = useTagColors();
  const [tagColorPickerOpen, setTagColorPickerOpen] = useState<string | null>(null);
  const [reformatTarget, setReformatTarget] = useState<CitationStyle>("apa");
  const [isReformatting, setIsReformatting] = useState(false);
  const [factoid, setFactoid] = useState<string>("");

  useEffect(() => {
    setFactoid(pickFactoid());
  }, []);

  // Detect mixed citation styles
  const styleCounts = citations.reduce<Record<string, number>>((acc, c) => {
    acc[c.style] = (acc[c.style] || 0) + 1;
    return acc;
  }, {});
  const uniqueStyles = Object.keys(styleCounts);
  const hasMixedStyles = uniqueStyles.length > 1;

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

  // Keyboard shortcuts
  useKeyboardShortcuts(
    {
      j: () => {
        // Move selection down
        if (filteredCitations.length === 0) return;
        setSelectedIndex((prev) =>
          prev < filteredCitations.length - 1 ? prev + 1 : prev
        );
      },
      k: () => {
        // Move selection up
        if (filteredCitations.length === 0) return;
        setSelectedIndex((prev) => (prev > 0 ? prev - 1 : 0));
      },
      e: () => {
        // Edit selected citation
        if (selectedIndex >= 0 && selectedIndex < filteredCitations.length) {
          setEditingCitationId(filteredCitations[selectedIndex].id);
        }
      },
      d: () => {
        // Delete selected citation
        if (selectedIndex >= 0 && selectedIndex < filteredCitations.length) {
          handleDeleteCitation(filteredCitations[selectedIndex].id);
        }
      },
      c: () => {
        // Copy selected citation
        if (selectedIndex >= 0 && selectedIndex < filteredCitations.length) {
          navigator.clipboard.writeText(filteredCitations[selectedIndex].formattedText);
        }
      },
      "/": () => {
        // Focus search
        searchInputRef.current?.focus();
      },
      escape: () => {
        // Clear selection or blur search
        if (document.activeElement === searchInputRef.current) {
          searchInputRef.current?.blur();
        } else {
          setSelectedIndex(-1);
          setEditingCitationId(null);
        }
      },
    },
    [filteredCitations, selectedIndex]
  );

  // Reset selection when citations change
  useEffect(() => {
    if (selectedIndex >= filteredCitations.length) {
      setSelectedIndex(filteredCitations.length - 1);
    }
  }, [filteredCitations.length, selectedIndex]);

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

  const downloadFile = (content: string, extension: string, mimeType: string) => {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${list?.name || "citations"}-${Date.now()}.${extension}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const exportAllCitations = () => {
    const allText = citations.map((c) => c.formattedText).join("\n\n");
    downloadFile(allText, "txt", "text/plain");
  };

  const exportMarkdown = () => {
    downloadFile(toMarkdown(citations, list?.name), "md", "text/markdown");
  };

  const exportHTML = () => {
    downloadFile(toHTML(citations, list?.name), "html", "text/html");
  };

  const citationsWithFields = (): FullCitationFields[] =>
    citations
      .map((c) => c.fields)
      .filter(Boolean) as unknown as FullCitationFields[];

  const exportBibTeX = () => {
    const fieldsList = citationsWithFields();
    if (fieldsList.length === 0) {
      setError("No citations with structured fields to export as BibTeX.");
      return;
    }
    downloadFile(toBibTeXMultiple(fieldsList), "bib", "application/x-bibtex");
  };

  const exportRIS = () => {
    const fieldsList = citationsWithFields();
    if (fieldsList.length === 0) {
      setError("No citations with structured fields to export as RIS.");
      return;
    }
    downloadFile(toRISMultiple(fieldsList), "ris", "application/x-research-info-systems");
  };

  const exportCSLJSON = () => {
    const fieldsList = citationsWithFields();
    if (fieldsList.length === 0) {
      setError("No citations with structured fields to export as CSL JSON.");
      return;
    }
    downloadFile(toCSLJSON(fieldsList), "json", "application/vnd.citationstyles.csl+json");
  };

  const handleShare = async () => {
    try {
      setIsSharing(true);
      setCopySuccess(false);
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
        try {
          await navigator.clipboard.writeText(url);
          setCopySuccess(true);
        } catch {
          // Clipboard failed, user can manually copy
        }
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

  const copyShareUrl = async () => {
    if (shareUrl) {
      try {
        await navigator.clipboard.writeText(shareUrl);
        setCopySuccess(true);
      } catch {
        // Fallback: select text for manual copy
      }
    }
  };

  // Drag and drop sensors
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleReformatAll = async () => {
    const target = reformatTarget;
    const needsUpdate = citations.filter((c) => c.style !== target && c.fields);
    const missingFields = citations.filter((c) => c.style !== target && !c.fields);
    if (needsUpdate.length === 0) {
      if (missingFields.length > 0) {
        setError(
          `Cannot reformat ${missingFields.length} citation${missingFields.length === 1 ? "" : "s"} without structured fields.`
        );
      }
      return;
    }

    setIsReformatting(true);
    try {
      const updates = await Promise.all(
        needsUpdate.map(async (c) => {
          const formatted = formatCitation(
            c.fields as Parameters<typeof formatCitation>[0],
            target
          );
          const response = await fetch(`/api/lists/${listId}/citations/${c.id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              style: target,
              formattedText: formatted.text,
              formattedHtml: formatted.html,
            }),
          });
          const result = await response.json();
          if (!result.success) throw new Error(result.error || "Failed");
          return {
            id: c.id,
            style: target,
            formattedText: formatted.text,
            formattedHtml: formatted.html,
          };
        })
      );
      const updateMap = new Map(updates.map((u) => [u.id, u]));
      setCitations((prev) =>
        prev.map((c) => {
          const u = updateMap.get(c.id);
          return u ? { ...c, ...u } : c;
        })
      );
      if (missingFields.length > 0) {
        setError(
          `Reformatted ${updates.length}. ${missingFields.length} citation${missingFields.length === 1 ? "" : "s"} could not be converted (no structured fields).`
        );
      }
    } catch (err) {
      console.error("Reformat failed:", err);
      setError("Failed to reformat some citations");
    } finally {
      setIsReformatting(false);
    }
  };

  const sortKey = (c: Citation): string => {
    const lastName = c.fields?.authors?.[0]?.lastName;
    if (lastName) return lastName.toLowerCase();
    const title = c.fields?.title;
    if (typeof title === "string" && title) return title.toLowerCase();
    return c.formattedText.toLowerCase();
  };

  const handleAlphabetize = async () => {
    const sorted = [...citations].sort((a, b) => sortKey(a).localeCompare(sortKey(b)));
    const previous = citations;
    setCitations(sorted);
    try {
      const response = await fetch(`/api/lists/${listId}/citations/reorder`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ citationIds: sorted.map((c) => c.id) }),
      });
      if (!response.ok) throw new Error("Failed to save order");
    } catch (err) {
      console.error("Failed to save order:", err);
      setCitations(previous);
      setError("Failed to save sorted order");
    }
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = citations.findIndex((c) => c.id === active.id);
      const newIndex = citations.findIndex((c) => c.id === over.id);

      const newCitations = arrayMove(citations, oldIndex, newIndex);
      setCitations(newCitations);

      // Save new order to backend
      try {
        await fetch(`/api/lists/${listId}/citations/reorder`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            citationIds: newCitations.map((c) => c.id),
          }),
        });
      } catch (err) {
        console.error("Failed to save order:", err);
        // Revert on error
        setCitations(citations);
      }
    }
  };

  const handleEditCitation = async (
    citationId: string,
    editFields: { title: string; authorFirst: string; authorMiddle: string; authorLast: string; authorIsOrganization: boolean; year: string; url: string }
  ) => {
    const citation = citations.find((c) => c.id === citationId);
    if (!citation) return;

    // Build updated fields
    const updatedFields: CitationFields = {
      ...(citation.fields || {}),
      title: editFields.title || citation.fields?.title,
      url: editFields.url || citation.fields?.url,
    };

    // Update author if provided
    if (editFields.authorLast) {
      updatedFields.authors = [
        editFields.authorIsOrganization
          ? { lastName: editFields.authorLast, isOrganization: true }
          : {
              firstName: editFields.authorFirst || undefined,
              middleName: editFields.authorMiddle || undefined,
              lastName: editFields.authorLast,
            },
      ];
    }

    // Update year if provided
    if (editFields.year) {
      updatedFields.publicationDate = {
        ...(citation.fields?.publicationDate || {}),
        year: parseInt(editFields.year, 10),
      };
    }

    // Regenerate formatted citation
    const style = citation.style as CitationStyle;
    // Use type assertion for citation fields since we're working with partial data
    const formatted = formatCitation(updatedFields as Parameters<typeof formatCitation>[0], style);

    try {
      const response = await fetch(`/api/lists/${listId}/citations/${citationId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fields: updatedFields,
          formattedText: formatted.text,
          formattedHtml: formatted.html,
        }),
      });

      const result = await response.json();

      if (result.success) {
        setCitations((prev) =>
          prev.map((c) =>
            c.id === citationId
              ? {
                  ...c,
                  fields: updatedFields,
                  formattedText: formatted.text,
                  formattedHtml: formatted.html,
                }
              : c
          )
        );
      } else {
        throw new Error(result.error || "Failed to update citation");
      }
    } catch (err) {
      console.error("Error updating citation:", err);
      throw err;
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
              {copySuccess ? "Copied! " : "Share link: "}
              <button
                onClick={copyShareUrl}
                className="text-green-800 hover:underline font-medium"
                title="Click to copy"
              >
                {shareUrl}
              </button>
              {!copySuccess && (
                <button
                  onClick={copyShareUrl}
                  className="ml-2 text-green-600 hover:text-green-800"
                >
                  [copy]
                </button>
              )}
              <button
                onClick={() => { setShareUrl(null); setCopySuccess(false); }}
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
                  ref={searchInputRef}
                  type="text"
                  placeholder="Search citations... (press / to focus)"
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
              {/* Tag Filter + Colors */}
              {allTags.length > 0 && (
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-sm text-wiki-text-muted">Tags:</span>
                  <button
                    onClick={() => setFilterTag(null)}
                    className={`px-2 py-0.5 text-xs border ${
                      filterTag === null
                        ? "bg-wiki-link text-white border-wiki-link"
                        : "bg-wiki-white text-wiki-text border-wiki-border-light hover:border-wiki-link"
                    }`}
                  >
                    All
                  </button>
                  {allTags.map((tag) => {
                    const color = getTagColor(tag);
                    const isActive = filterTag === tag;
                    const isPickerOpen = tagColorPickerOpen === tag;
                    return (
                      <span
                        key={tag}
                        className={`relative inline-flex items-stretch text-xs border ${
                          isActive
                            ? `${color.activeBg} ${color.activeText} ${color.activeBorder}`
                            : `${color.bg} ${color.text} ${color.border}`
                        }`}
                      >
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setTagColorPickerOpen(isPickerOpen ? null : tag);
                          }}
                          className={`flex items-center justify-center px-1.5 border-r hover:opacity-80 ${
                            isActive ? "border-white/40" : color.border
                          }`}
                          title="Change color"
                          aria-haspopup="dialog"
                          aria-expanded={isPickerOpen}
                          aria-label={`Change color for ${tag}`}
                        >
                          <span
                            className={`w-2.5 h-2.5 rounded-full border ${
                              isActive ? "bg-white border-white" : `${color.bg} ${color.border}`
                            }`}
                            aria-hidden
                          />
                        </button>
                        <button
                          type="button"
                          onClick={() => setFilterTag(isActive ? null : tag)}
                          className="px-2 py-0.5 hover:opacity-80"
                          aria-pressed={isActive}
                          title={isActive ? "Clear filter" : `Filter by ${tag}`}
                        >
                          {tag}
                        </button>
                        {isPickerOpen && (
                          <TagColorPicker
                            tagName={tag}
                            currentColor={color.name}
                            onPick={(name) => setTagColor(tag, name)}
                            onReset={() => clearTagColor(tag)}
                            onClose={() => setTagColorPickerOpen(null)}
                          />
                        )}
                      </span>
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
              {/* Mixed styles warning */}
              {hasMixedStyles && (
                <div className="p-3 bg-amber-50 border border-amber-300 text-amber-900 dark:bg-amber-950 dark:border-amber-800 dark:text-amber-200 text-sm">
                  <div className="font-bold mb-1">Warning: mixed citation styles</div>
                  <div className="mb-2">
                    This list has citations in different styles:{" "}
                    {uniqueStyles.map((s, i) => (
                      <span key={s}>
                        <b>{CITATION_STYLE_LABELS[s as CitationStyle] ?? s}</b> (
                        {styleCounts[s]})
                        {i < uniqueStyles.length - 1 ? ", " : ""}
                      </span>
                    ))}
                    . Exports (BibTeX, RIS, CSL JSON, etc.) assume a consistent style.
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <label htmlFor="reformat-target" className="text-xs">
                      Reformat all to:
                    </label>
                    <select
                      id="reformat-target"
                      value={reformatTarget}
                      onChange={(e) => setReformatTarget(e.target.value as CitationStyle)}
                      className="text-xs"
                      disabled={isReformatting}
                    >
                      {CITATION_STYLES.map((s) => (
                        <option key={s} value={s}>
                          {CITATION_STYLE_LABELS[s]}
                        </option>
                      ))}
                    </select>
                    <WikiButton
                      onClick={handleReformatAll}
                      disabled={isReformatting}
                      title="Regenerate every citation using the selected style"
                    >
                      {isReformatting ? "Reformatting..." : "Apply to all"}
                    </WikiButton>
                  </div>
                </div>
              )}
              {/* Actions */}
              <div className="flex flex-wrap gap-3">
                <WikiButton onClick={copyAllCitations}>
                  Copy All
                </WikiButton>
                <WikiButton
                  onClick={handleAlphabetize}
                  disabled={citations.length < 2}
                  title="Sort citations alphabetically by author (or title)"
                >
                  Sort A–Z
                </WikiButton>
                <WikiButton onClick={() => setShowPrintAnimation(true)}>
                  Print
                </WikiButton>
                <WikiDropdown
                  label="Export"
                  items={[
                    { label: "Plain text", hint: ".txt", onClick: exportAllCitations },
                    { label: "Markdown", hint: ".md", onClick: exportMarkdown },
                    { label: "HTML", hint: ".html", onClick: exportHTML },
                    { label: "BibTeX (LaTeX)", hint: ".bib", onClick: exportBibTeX },
                    { label: "RIS (Zotero, EndNote, Mendeley)", hint: ".ris", onClick: exportRIS },
                    { label: "CSL JSON", hint: ".json", onClick: exportCSLJSON },
                  ]}
                />
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
              {factoid && (
                <div className="mt-8 mx-auto max-w-lg border border-wiki-border-light bg-wiki-offwhite p-4 text-left text-sm">
                  <div className="font-bold mb-1 text-wiki-text">Did you know...</div>
                  <p className="text-wiki-text-muted italic">{factoid}</p>
                  <button
                    type="button"
                    onClick={() => setFactoid(pickFactoid())}
                    className="mt-2 text-xs text-wiki-link hover:underline"
                  >
                    [another fact]
                  </button>
                </div>
              )}
            </div>
          ) : filteredCitations.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-wiki-text-muted">
                No citations match your search.
              </p>
            </div>
          ) : (
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              <SortableContext
                items={filteredCitations.map((c) => c.id)}
                strategy={verticalListSortingStrategy}
              >
                <div className="space-y-4">
                  {filteredCitations.map((citation, index) => (
                    <SortableCitation
                      key={citation.id}
                      citation={citation}
                      index={index}
                      isSelected={selectedIndex === index}
                      isEditing={editingCitationId === citation.id}
                      availableTags={allTags}
                      onSelect={() => setSelectedIndex(index)}
                      onCopy={(text) => navigator.clipboard.writeText(text)}
                      onDelete={handleDeleteCitation}
                      onEdit={handleEditCitation}
                      onAddTag={handleAddTag}
                      onRemoveTag={handleRemoveTag}
                      editingTagsId={editingTagsCitationId}
                      setEditingTagsId={setEditingTagsCitationId}
                      newTagInput={newTagInput}
                      setNewTagInput={setNewTagInput}
                      onEditDone={() => setEditingCitationId(null)}
                    />
                  ))}
                </div>
              </SortableContext>
            </DndContext>
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

      {/* Keyboard Shortcuts Help - press ? to show */}
      <ShortcutHelp scope="list" />
    </WikiLayout>
  );
}
