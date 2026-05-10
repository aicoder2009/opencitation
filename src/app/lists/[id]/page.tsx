"use client";

import { useState, useEffect, use, useRef, useMemo } from "react";
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
import { ShareDialog } from "@/components/wiki/share-dialog";
import { CitationAddModal } from "@/components/wiki/citation-add-modal";
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
  toRTF,
} from "@/lib/citation/exporters";
import { useTagColors } from "@/lib/tag-colors";
import { pickFactoid } from "@/lib/did-you-know";
import type { SourceType, AccessType, CitationFields as FullCitationFields, CitationStyle } from "@/types";
import { CITATION_STYLES, CITATION_STYLE_LABELS } from "@/types";
import posthog from "posthog-js";

interface List {
  id: string;
  name: string;
  description?: string;
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

type ReadingStatus = "to-read" | "reading" | "read" | "cited";

interface CitationQuote {
  text: string;
  page?: string;
}

interface Citation {
  id: string;
  listId: string;
  style: string;
  formattedText: string;
  formattedHtml: string;
  fields?: CitationFields;
  tags?: string[];
  notes?: string;
  quotes?: CitationQuote[];
  readingStatus?: ReadingStatus;
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
  const [editDescription, setEditDescription] = useState("");
  const [isShareDialogOpen, setIsShareDialogOpen] = useState(false);
  const [showCiteModal, setShowCiteModal] = useState(false);
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
  const [isSelectMode, setIsSelectMode] = useState(false);
  const [selectedCitationIds, setSelectedCitationIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    setFactoid(pickFactoid());
  }, []);

  // Detect mixed citation styles
  const { styleCounts, uniqueStyles, hasMixedStyles } = useMemo(() => {
    const counts = citations.reduce<Record<string, number>>((acc, c) => {
      acc[c.style] = (acc[c.style] || 0) + 1;
      return acc;
    }, {});
    const styles = Object.keys(counts);
    return { styleCounts: counts, uniqueStyles: styles, hasMixedStyles: styles.length > 1 };
  }, [citations]);

  // Get all unique tags from citations
  const allTags = useMemo(
    () => Array.from(new Set(citations.flatMap((c) => c.tags || []))).sort(),
    [citations]
  );

  // Filter citations based on search query and tag filter
  const filteredCitations = useMemo(
    () => citations.filter((citation) => {
      if (filterTag && (!citation.tags || !citation.tags.includes(filterTag))) {
        return false;
      }
      if (!searchQuery.trim()) return true;
      const query = searchQuery.toLowerCase();
      return citation.formattedText.toLowerCase().includes(query);
    }),
    [citations, filterTag, searchQuery]
  );

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
          const cit = filteredCitations[selectedIndex];
          navigator.clipboard.writeText(cit.formattedText);
          posthog.capture("citation_copied", {
            citation_style: cit.style,
            source_type: cit.fields?.sourceType,
            method: "keyboard_shortcut",
          });
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

      const [listResponse, citationsResponse] = await Promise.all([
        fetch(`/api/lists/${listId}`),
        fetch(`/api/lists/${listId}/citations`),
      ]);

      const [listResult, citationsResult] = await Promise.all([
        listResponse.json(),
        citationsResponse.json(),
      ]);

      if (!listResult.success) {
        setError(listResult.error || "List not found");
        return;
      }

      setList(listResult.data);
      setEditName(listResult.data.name);
      setEditDescription(listResult.data.description || "");

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
    const trimmedName = editName.trim();
    const trimmedDesc = editDescription.trim();
    if (!trimmedName) {
      setIsEditing(false);
      return;
    }

    const nameChanged = trimmedName !== list?.name;
    const descChanged = trimmedDesc !== (list?.description || "");
    if (!nameChanged && !descChanged) {
      setIsEditing(false);
      return;
    }

    const body: { name?: string; description?: string } = {};
    if (nameChanged) body.name = trimmedName;
    if (descChanged) body.description = trimmedDesc;

    try {
      const response = await fetch(`/api/lists/${listId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const result = await response.json();

      if (result.success) {
        setList(result.data);
        setEditName(result.data.name);
        setEditDescription(result.data.description || "");
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

    const citation = citations.find((c) => c.id === citationId);
    try {
      const response = await fetch(`/api/lists/${listId}/citations/${citationId}`, {
        method: "DELETE",
      });

      const result = await response.json();

      if (result.success) {
        setCitations((prev) => prev.filter((c) => c.id !== citationId));
        posthog.capture("citation_deleted", {
          citation_style: citation?.style,
          source_type: citation?.fields?.sourceType,
        });
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

  const handleSaveNotes = async (citationId: string, notes: string) => {
    try {
      const response = await fetch(`/api/lists/${listId}/citations/${citationId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notes }),
      });
      const result = await response.json();
      if (result.success) {
        setCitations((prev) =>
          prev.map((c) => (c.id === citationId ? { ...c, notes: notes || undefined } : c))
        );
      }
    } catch (err) {
      console.error("Error saving notes:", err);
    }
  };

  const handleSaveQuotes = async (citationId: string, quotes: CitationQuote[]) => {
    try {
      const response = await fetch(`/api/lists/${listId}/citations/${citationId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ quotes }),
      });
      const result = await response.json();
      if (result.success) {
        setCitations((prev) =>
          prev.map((c) => (c.id === citationId ? { ...c, quotes } : c))
        );
      }
    } catch (err) {
      console.error("Error saving quotes:", err);
    }
  };

  const copyAllCitations = () => {
    const allText = citations.map((c) => c.formattedText).join("\n\n");
    navigator.clipboard.writeText(allText);
    posthog.capture("citations_copied_all", { citation_count: citations.length });
  };

  const toggleSelectMode = () => {
    setIsSelectMode((prev) => !prev);
    setSelectedCitationIds(new Set());
  };

  const toggleCitationSelect = (id: string) => {
    setSelectedCitationIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const selectedCitations = filteredCitations.filter((c) => selectedCitationIds.has(c.id));

  const selectAll = () => setSelectedCitationIds(new Set(filteredCitations.map((c) => c.id)));
  const deselectAll = () => setSelectedCitationIds(new Set());

  const copySelected = () => {
    const text = selectedCitations.map((c) => c.formattedText).join("\n\n");
    navigator.clipboard.writeText(text);
    posthog.capture("citations_bulk_copied", { citation_count: selectedCitations.length });
  };

  const copySelectedBibTeX = () => {
    const fields = selectedCitations.map((c) => c.fields).filter(Boolean) as unknown as FullCitationFields[];
    if (fields.length === 0) { setError("No selected citations have structured fields for BibTeX."); return; }
    navigator.clipboard.writeText(toBibTeXMultiple(fields));
    posthog.capture("citations_bulk_copied", { format: "bibtex", citation_count: fields.length });
  };

  const deleteSelected = async () => {
    const count = selectedCitationIds.size;
    if (!confirm(`Delete ${count} citation${count === 1 ? "" : "s"}?`)) return;
    const ids = [...selectedCitationIds];
    setCitations((prev) => prev.filter((c) => !selectedCitationIds.has(c.id)));
    setSelectedCitationIds(new Set());
    try {
      await Promise.all(
        ids.map((id) =>
          fetch(`/api/lists/${listId}/citations/${id}`, { method: "DELETE" })
        )
      );
      posthog.capture("citations_bulk_deleted", { count });
    } catch (err) {
      console.error("Error deleting selected citations:", err);
      setError("Some citations could not be deleted.");
      fetchListAndCitations();
    }
  };

  const exportSelectedText = () => {
    const text = selectedCitations.map((c) => c.formattedText).join("\n\n");
    downloadFile(text, "txt", "text/plain");
    posthog.capture("citation_exported", { format: "txt", citation_count: selectedCitations.length, bulk: true });
  };

  const exportSelectedMarkdown = () => {
    downloadFile(toMarkdown(selectedCitations, list?.name), "md", "text/markdown");
    posthog.capture("citation_exported", { format: "md", citation_count: selectedCitations.length, bulk: true });
  };

  const exportSelectedHTML = () => {
    downloadFile(toHTML(selectedCitations, list?.name), "html", "text/html");
    posthog.capture("citation_exported", { format: "html", citation_count: selectedCitations.length, bulk: true });
  };

  const exportSelectedRTF = () => {
    downloadFile(toRTF(selectedCitations, list?.name), "rtf", "application/rtf");
    posthog.capture("citation_exported", { format: "rtf", citation_count: selectedCitations.length, bulk: true });
  };

  const exportSelectedBibTeX = () => {
    const fields = selectedCitations.map((c) => c.fields).filter(Boolean) as unknown as FullCitationFields[];
    if (fields.length === 0) { setError("No selected citations have structured fields for BibTeX."); return; }
    downloadFile(toBibTeXMultiple(fields), "bib", "application/x-bibtex");
    posthog.capture("citation_exported", { format: "bibtex", citation_count: fields.length, bulk: true });
  };

  const exportSelectedRIS = () => {
    const fields = selectedCitations.map((c) => c.fields).filter(Boolean) as unknown as FullCitationFields[];
    if (fields.length === 0) { setError("No selected citations have structured fields for RIS."); return; }
    downloadFile(toRISMultiple(fields), "ris", "application/x-research-info-systems");
    posthog.capture("citation_exported", { format: "ris", citation_count: fields.length, bulk: true });
  };

  const exportSelectedCSLJSON = () => {
    const fields = selectedCitations.map((c) => c.fields).filter(Boolean) as unknown as FullCitationFields[];
    if (fields.length === 0) { setError("No selected citations have structured fields for CSL JSON."); return; }
    downloadFile(toCSLJSON(fields), "json", "application/vnd.citationstyles.csl+json");
    posthog.capture("citation_exported", { format: "csl_json", citation_count: fields.length, bulk: true });
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
    posthog.capture("citation_exported", { format: "txt", citation_count: citations.length });
  };

  const exportMarkdown = () => {
    downloadFile(toMarkdown(citations, list?.name), "md", "text/markdown");
    posthog.capture("citation_exported", { format: "md", citation_count: citations.length });
  };

  const exportHTML = () => {
    downloadFile(toHTML(citations, list?.name), "html", "text/html");
    posthog.capture("citation_exported", { format: "html", citation_count: citations.length });
  };

  const exportRTF = () => {
    downloadFile(toRTF(citations, list?.name), "rtf", "application/rtf");
    posthog.capture("citation_exported", { format: "rtf", citation_count: citations.length });
  };

  const citationsWithFields = useMemo(
    (): FullCitationFields[] => citations.map((c) => c.fields).filter(Boolean) as unknown as FullCitationFields[],
    [citations]
  );

  const exportBibTeX = () => {
    if (citationsWithFields.length === 0) {
      setError("No citations with structured fields to export as BibTeX.");
      return;
    }
    downloadFile(toBibTeXMultiple(citationsWithFields), "bib", "application/x-bibtex");
    posthog.capture("citation_exported", { format: "bibtex", citation_count: citationsWithFields.length });
  };

  const copyBibTeX = () => {
    if (citationsWithFields.length === 0) {
      setError("No citations with structured fields to copy as BibTeX.");
      return;
    }
    navigator.clipboard.writeText(toBibTeXMultiple(citationsWithFields));
    posthog.capture("citation_exported", { format: "bibtex_copy", citation_count: citationsWithFields.length });
  };

  const exportRIS = () => {
    if (citationsWithFields.length === 0) {
      setError("No citations with structured fields to export as RIS.");
      return;
    }
    downloadFile(toRISMultiple(citationsWithFields), "ris", "application/x-research-info-systems");
    posthog.capture("citation_exported", { format: "ris", citation_count: citationsWithFields.length });
  };

  const exportZotero = () => {
    const items = citations
      .filter((c) => c.fields)
      .map((c) => ({
        fields: c.fields as unknown as FullCitationFields,
        tags: c.tags,
        notes: c.notes,
        quotes: c.quotes,
      }));
    if (items.length === 0) {
      setError("No citations with structured fields to export to Zotero.");
      return;
    }
    const ris = toRISMultiple(items);
    const blob = new Blob([ris], { type: "application/x-research-info-systems" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${list?.name || "citations"}-zotero.ris`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    posthog.capture("citation_exported", { format: "ris_zotero", citation_count: items.length });
  };

  const exportCSLJSON = () => {
    if (citationsWithFields.length === 0) {
      setError("No citations with structured fields to export as CSL JSON.");
      return;
    }
    downloadFile(toCSLJSON(citationsWithFields), "json", "application/vnd.citationstyles.csl+json");
    posthog.capture("citation_exported", { format: "csl_json", citation_count: citationsWithFields.length });
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
      posthog.capture("citations_reformatted", { target_style: target, count: updates.length });
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
      posthog.capture("citations_sorted", { citation_count: sorted.length });
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
        posthog.capture("citation_reordered");
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
        posthog.capture("citation_edited", { citation_style: style });
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
                <div className="space-y-2">
                  <input
                    type="text"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="text-xl font-bold w-full"
                    onKeyDown={(e) => e.key === "Enter" && handleUpdateName()}
                    placeholder="List name"
                    autoFocus
                  />
                  <textarea
                    value={editDescription}
                    onChange={(e) => setEditDescription(e.target.value)}
                    className="w-full text-sm h-20"
                    placeholder="Description (optional)"
                  />
                  <div className="flex gap-2">
                    <WikiButton onClick={handleUpdateName}>Save</WikiButton>
                    <WikiButton
                      onClick={() => {
                        setIsEditing(false);
                        setEditName(list?.name || "");
                        setEditDescription(list?.description || "");
                      }}
                    >
                      Cancel
                    </WikiButton>
                  </div>
                </div>
              ) : (
                <>
                  <h1 className="text-2xl font-bold mb-1">
                    {list?.name}
                    <button
                      onClick={() => setIsEditing(true)}
                      className="ml-2 text-wiki-link text-sm font-normal hover:underline"
                    >
                      [edit]
                    </button>
                  </h1>
                  {list?.description && (
                    <p className="text-sm mb-1 max-w-2xl">{list.description}</p>
                  )}
                </>
              )}
              <p className="text-wiki-text-muted text-sm">
                {citations.length} citation{citations.length !== 1 ? "s" : ""}
              </p>
            </div>
            <div className="flex gap-2">
              <WikiButton onClick={() => setIsShareDialogOpen(true)}>
                Share
              </WikiButton>
              <WikiButton variant="primary" onClick={() => setShowCiteModal(true)}>
                Add Citation
              </WikiButton>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 text-sm">
              {error}
              <button
                onClick={() => setError(null)}
                className="ml-2 text-red-500 hover:text-red-700"
                aria-label="Dismiss error"
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
              {!isSelectMode ? (
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
                      { label: "Word (hanging indent)", hint: ".rtf", onClick: exportRTF },
                      { label: "Markdown", hint: ".md", onClick: exportMarkdown },
                      { label: "HTML", hint: ".html", onClick: exportHTML },
                      { label: "Zotero (File > Import)", hint: ".ris", onClick: exportZotero },
                      { label: "BibTeX (LaTeX)", hint: ".bib", onClick: exportBibTeX },
                      { label: "Copy BibTeX", hint: "to clipboard", onClick: copyBibTeX },
                      { label: "RIS (EndNote, Mendeley)", hint: ".ris", onClick: exportRIS },
                      { label: "CSL JSON", hint: ".json", onClick: exportCSLJSON },
                    ]}
                  />
                  <WikiButton onClick={toggleSelectMode} title="Select citations for bulk actions">
                    Select
                  </WikiButton>
                </div>
              ) : (
                <div className="flex flex-wrap items-center gap-3">
                  <span className="text-sm text-wiki-text-muted">
                    {selectedCitationIds.size} of {filteredCitations.length} selected
                  </span>
                  <WikiButton
                    onClick={selectedCitationIds.size === filteredCitations.length ? deselectAll : selectAll}
                  >
                    {selectedCitationIds.size === filteredCitations.length ? "Deselect All" : "Select All"}
                  </WikiButton>
                  <WikiButton
                    onClick={copySelected}
                    disabled={selectedCitationIds.size === 0}
                    title="Copy selected citations to clipboard"
                  >
                    Copy
                  </WikiButton>
                  <WikiButton
                    onClick={copySelectedBibTeX}
                    disabled={selectedCitationIds.size === 0}
                    title="Copy selected citations as BibTeX to clipboard"
                  >
                    Copy BibTeX
                  </WikiButton>
                  <WikiDropdown
                    label="Export"
                    disabled={selectedCitationIds.size === 0}
                    items={[
                      { label: "Plain text", hint: ".txt", onClick: exportSelectedText },
                      { label: "Word (hanging indent)", hint: ".rtf", onClick: exportSelectedRTF },
                      { label: "Markdown", hint: ".md", onClick: exportSelectedMarkdown },
                      { label: "HTML", hint: ".html", onClick: exportSelectedHTML },
                      { label: "BibTeX (LaTeX)", hint: ".bib", onClick: exportSelectedBibTeX },
                      { label: "RIS (EndNote, Mendeley)", hint: ".ris", onClick: exportSelectedRIS },
                      { label: "CSL JSON", hint: ".json", onClick: exportSelectedCSLJSON },
                    ]}
                  />
                  <WikiButton
                    onClick={deleteSelected}
                    disabled={selectedCitationIds.size === 0}
                    title="Delete selected citations"
                  >
                    Delete
                  </WikiButton>
                  <WikiButton onClick={toggleSelectMode}>
                    Done
                  </WikiButton>
                </div>
              )}
            </div>
          )}

          {/* Citations */}
          {citations.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-wiki-text-muted mb-4">
                This list is empty. Add your first citation!
              </p>
              <WikiButton variant="primary" onClick={() => setShowCiteModal(true)}>
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
                      onSaveNotes={handleSaveNotes}
                      onSaveQuotes={handleSaveQuotes}
                      isSelectMode={isSelectMode}
                      isChecked={selectedCitationIds.has(citation.id)}
                      onCheckToggle={() => toggleCitationSelect(citation.id)}
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

      <ShareDialog
        isOpen={isShareDialogOpen}
        onClose={() => setIsShareDialogOpen(false)}
        type="list"
        targetId={listId}
        targetName={list?.name}
      />

      <CitationAddModal
        isOpen={showCiteModal}
        onClose={() => setShowCiteModal(false)}
        listId={listId}
        listName={list?.name ?? ""}
        onCitationAdded={fetchListAndCitations}
      />

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
