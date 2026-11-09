"use client";

import { useState } from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { useTagColors } from "@/lib/tag-colors";
import { generateInTextCitation } from "@/lib/citation";
import DOMPurify from "isomorphic-dompurify";
import { WikiButton } from "@/components/wiki/wiki-button";
import { WikiNotice } from "@/components/wiki/wiki-notice";
import type { CitationFields as FullCitationFields, CitationStyle } from "@/types";

interface CitationFields {
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

interface EditableFields {
  title: string;
  authorFirst: string;
  authorMiddle: string;
  authorLast: string;
  authorIsOrganization: boolean;
  year: string;
  url: string;
}

interface SortableCitationProps {
  citation: Citation;
  index: number;
  isSelected?: boolean;
  isEditing?: boolean;
  availableTags?: string[];
  onSelect?: () => void;
  onCopy: (text: string) => void;
  onDelete: (id: string) => void;
  onEdit: (id: string, fields: EditableFields) => Promise<void>;
  onAddTag: (id: string, tag: string) => void;
  onRemoveTag: (id: string, tag: string) => void;
  editingTagsId: string | null;
  setEditingTagsId: (id: string | null) => void;
  newTagInput: string;
  setNewTagInput: (value: string) => void;
  onEditDone?: () => void;
  onSaveNotes?: (id: string, notes: string) => void | Promise<void>;
  onSaveQuotes?: (id: string, quotes: CitationQuote[]) => void | Promise<void>;
  isSelectMode?: boolean;
  isChecked?: boolean;
  onCheckToggle?: () => void;
  onShare?: (citationId: string) => void;
}

export function SortableCitation({
  citation,
  index,
  isSelected = false,
  isEditing: externalIsEditing = false,
  availableTags = [],
  onSelect,
  onCopy,
  onDelete,
  onEdit,
  onAddTag,
  onRemoveTag,
  editingTagsId,
  setEditingTagsId,
  newTagInput,
  setNewTagInput,
  onEditDone,
  onSaveNotes,
  onSaveQuotes,
  isSelectMode = false,
  isChecked = false,
  onCheckToggle,
  onShare,
}: SortableCitationProps) {
  const [internalIsEditing, setInternalIsEditing] = useState(false);
  const isEditingMode = internalIsEditing || externalIsEditing;
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [copiedKey, setCopiedKey] = useState<"copy" | "copy-in-text" | null>(null);
  const { getColor } = useTagColors();
  const [editingNotes, setEditingNotes] = useState(false);
  const [notesDraft, setNotesDraft] = useState("");
  const [editingQuotes, setEditingQuotes] = useState(false);
  const [quotesDraft, setQuotesDraft] = useState<CitationQuote[]>([]);
  const [editFields, setEditFields] = useState<EditableFields>({
    title: "",
    authorFirst: "",
    authorMiddle: "",
    authorLast: "",
    authorIsOrganization: false,
    year: "",
    url: "",
  });

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: citation.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const startEditing = () => {
    const fields = citation.fields || {};
    const firstAuthor = fields.authors?.[0];
    setEditFields({
      title: (fields.title as string) || "",
      authorFirst: firstAuthor?.firstName || "",
      authorMiddle: firstAuthor?.middleName || "",
      authorLast: firstAuthor?.lastName || "",
      authorIsOrganization: firstAuthor?.isOrganization || false,
      year: fields.publicationDate?.year?.toString() || "",
      url: (fields.url as string) || "",
    });
    setInternalIsEditing(true);
  };

  const cancelEditing = () => {
    setInternalIsEditing(false);
    onEditDone?.();
  };

  const saveEditing = async () => {
    setIsSaving(true);
    setSaveError(null);
    try {
      await onEdit(citation.id, editFields);
      setInternalIsEditing(false);
      onEditDone?.();
    } catch (err) {
      console.error("Failed to save:", err);
      setSaveError("Failed to save changes. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  // Handle external edit trigger
  if (externalIsEditing && !internalIsEditing) {
    startEditing();
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      onClick={onSelect}
      className={`border bg-wiki-white transition-colors ${
        isDragging ? "shadow-lg z-10" : ""
      } ${
        isSelected
          ? "border-2 border-wiki-link"
          : "border-wiki-border-light"
      }`}
    >
      {/* Header with drag handle */}
      <div className="flex items-center gap-2 p-3 bg-wiki-tab-bg border-b border-wiki-border-light">
        {isSelectMode && (
          <input
            type="checkbox"
            checked={isChecked}
            onChange={(e) => { e.stopPropagation(); onCheckToggle?.(); }}
            onClick={(e) => e.stopPropagation()}
            aria-label={`Select citation ${index + 1}`}
            className="w-4 h-4 cursor-pointer"
          />
        )}
        <button
          {...attributes}
          {...listeners}
          className="cursor-grab active:cursor-grabbing p-1 hover:bg-wiki-border-light text-wiki-text-muted focus-visible:outline-dotted focus-visible:outline-1 focus-visible:outline-wiki-text"
          title="Drag to reorder"
          aria-label="Drag to reorder"
        >
          <svg
            aria-hidden="true"
            width="16"
            height="16"
            viewBox="0 0 16 16"
            fill="currentColor"
          >
            <path d="M4 4h2v2H4V4zm0 3h2v2H4V7zm0 3h2v2H4v-2zm3-6h2v2H7V4zm0 3h2v2H7V7zm0 3h2v2H7v-2zm3-6h2v2h-2V4zm0 3h2v2h-2V7zm0 3h2v2h-2v-2z" />
          </svg>
        </button>
        <span className="font-medium text-sm">
          Citation {index + 1} ({citation.style.toUpperCase()})
        </span>
      </div>

      {/* Content */}
      <div className="p-4">
        {isEditingMode ? (
          <div className="space-y-3 mb-4">
            <div>
              <label className="block text-xs font-medium text-wiki-text-muted mb-1">Title</label>
              <input
                type="text"
                value={editFields.title}
                onChange={(e) => setEditFields({ ...editFields, title: e.target.value })}
                className="w-full px-2 py-1 text-sm border border-wiki-border-light"
                placeholder="Title"
                aria-label="Citation title"
              />
            </div>
            <div className="space-y-1">
              <label className="flex items-center gap-2 text-xs text-wiki-text-muted">
                <input
                  type="checkbox"
                  checked={editFields.authorIsOrganization}
                  onChange={(e) =>
                    setEditFields({
                      ...editFields,
                      authorIsOrganization: e.target.checked,
                      authorFirst: e.target.checked ? "" : editFields.authorFirst,
                      authorMiddle: e.target.checked ? "" : editFields.authorMiddle,
                    })
                  }
                />
                Organization / group author
              </label>
              {editFields.authorIsOrganization ? (
                <div>
                  <label className="block text-xs font-medium text-wiki-text-muted mb-1">Organization name</label>
                  <input
                    type="text"
                    value={editFields.authorLast}
                    onChange={(e) => setEditFields({ ...editFields, authorLast: e.target.value })}
                    className="w-full px-2 py-1 text-sm border border-wiki-border-light"
                    placeholder="World Health Organization"
                    aria-label="Organization name"
                  />
                </div>
              ) : (
                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="block text-xs font-medium text-wiki-text-muted mb-1">First Name</label>
                    <input
                      type="text"
                      value={editFields.authorFirst}
                      onChange={(e) => setEditFields({ ...editFields, authorFirst: e.target.value })}
                      className="w-full px-2 py-1 text-sm border border-wiki-border-light"
                      placeholder="First"
                      aria-label="First name"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-wiki-text-muted mb-1">Middle</label>
                    <input
                      type="text"
                      value={editFields.authorMiddle}
                      onChange={(e) => setEditFields({ ...editFields, authorMiddle: e.target.value })}
                      className="w-full px-2 py-1 text-sm border border-wiki-border-light"
                      placeholder="M."
                      aria-label="Middle name or initial"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-wiki-text-muted mb-1">Last Name</label>
                    <input
                      type="text"
                      value={editFields.authorLast}
                      onChange={(e) => setEditFields({ ...editFields, authorLast: e.target.value })}
                      className="w-full px-2 py-1 text-sm border border-wiki-border-light"
                      placeholder="Last"
                      aria-label="Last name"
                    />
                  </div>
                </div>
              )}
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-xs font-medium text-wiki-text-muted mb-1">Year</label>
                <input
                  type="text"
                  value={editFields.year}
                  onChange={(e) => setEditFields({ ...editFields, year: e.target.value })}
                  className="w-full px-2 py-1 text-sm border border-wiki-border-light"
                  placeholder="2024"
                  aria-label="Publication year"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-wiki-text-muted mb-1">URL</label>
                <input
                  type="text"
                  value={editFields.url}
                  onChange={(e) => setEditFields({ ...editFields, url: e.target.value })}
                  className="w-full px-2 py-1 text-sm border border-wiki-border-light"
                  placeholder="https://..."
                  aria-label="URL"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <WikiButton
                variant="primary"
                onClick={saveEditing}
                disabled={isSaving}
              >
                {isSaving ? "Saving..." : "Save"}
              </WikiButton>
              <WikiButton onClick={cancelEditing}>
                Cancel
              </WikiButton>
            </div>
            {saveError && (
              <WikiNotice variant="warn" onDismiss={() => setSaveError(null)}>{saveError}</WikiNotice>
            )}
          </div>
        ) : (
          <>
            <div className="bg-wiki-offwhite border border-wiki-border-light p-3 mb-4">
              <p
                className="citation-text"
                dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(citation.formattedHtml) }}
              />
            </div>
            <div className="flex flex-wrap gap-3 mb-3">
              <button
                onClick={() => {
                  onCopy(citation.formattedText);
                  setCopiedKey("copy");
                  setTimeout(() => setCopiedKey(null), 1500);
                }}
                className="text-wiki-link text-sm hover:underline focus-visible:outline-dotted focus-visible:outline-1 focus-visible:outline-wiki-text"
                aria-label={copiedKey === "copy" ? "Copied citation" : "Copy citation"}
              >
                {copiedKey === "copy" ? "[copied!]" : "[copy]"}
              </button>
              {citation.fields && (
                <button
                  onClick={() => {
                    onCopy(
                      generateInTextCitation(
                        citation.fields as unknown as FullCitationFields,
                        citation.style as CitationStyle
                      )
                    );
                    setCopiedKey("copy-in-text");
                    setTimeout(() => setCopiedKey(null), 1500);
                  }}
                  className="text-wiki-link text-sm hover:underline focus-visible:outline-dotted focus-visible:outline-1 focus-visible:outline-wiki-text"
                  title={`In-text citation (${citation.style.toUpperCase()})`}
                  aria-label={copiedKey === "copy-in-text" ? "Copied in-text citation" : "Copy in-text citation"}
                >
                  {copiedKey === "copy-in-text" ? "[copied!]" : "[copy in-text]"}
                </button>
              )}
              <button
                onClick={startEditing}
                className="text-wiki-link text-sm hover:underline focus-visible:outline-dotted focus-visible:outline-1 focus-visible:outline-wiki-text"
                aria-label="Edit citation"
              >
                [edit]
              </button>
              {onShare && (
                <button
                  onClick={() => onShare(citation.id)}
                  className="text-wiki-link text-sm hover:underline focus-visible:outline-dotted focus-visible:outline-1 focus-visible:outline-wiki-text"
                  aria-label="Share citation"
                >
                  [share]
                </button>
              )}
              <button
                onClick={() => onDelete(citation.id)}
                className="text-wiki-link text-sm hover:underline focus-visible:outline-dotted focus-visible:outline-1 focus-visible:outline-wiki-text"
                aria-label="Delete citation"
              >
                [delete]
              </button>
            </div>
          </>
        )}

        {/* Notes Section */}
        {onSaveNotes && (
          <div className="pt-3 border-t border-wiki-border-light mb-3">
            {editingNotes ? (
              <div className="space-y-2">
                <label className="block text-xs font-medium text-wiki-text-muted">
                  Notes (annotation / summary)
                </label>
                <textarea
                  value={notesDraft}
                  onChange={(e) => setNotesDraft(e.target.value)}
                  rows={4}
                  className="w-full px-2 py-1 text-sm border border-wiki-border-light"
                  placeholder="Summarize this source, capture an argument, or note why it matters..."
                  aria-label="Notes (annotation or summary)"
                  autoFocus
                />
                <div className="flex gap-2">
                  <WikiButton
                    variant="primary"
                    onClick={async () => {
                      await onSaveNotes(citation.id, notesDraft.trim());
                      setEditingNotes(false);
                    }}
                  >
                    Save notes
                  </WikiButton>
                  <WikiButton onClick={() => setEditingNotes(false)}>
                    Cancel
                  </WikiButton>
                </div>
              </div>
            ) : citation.notes ? (
              <div>
                <div className="flex items-center gap-3 mb-1">
                  <span className="text-xs font-medium text-wiki-text-muted">Notes</span>
                  <button
                    onClick={() => {
                      setNotesDraft(citation.notes ?? "");
                      setEditingNotes(true);
                    }}
                    className="text-wiki-link text-xs hover:underline focus-visible:outline-dotted focus-visible:outline-1 focus-visible:outline-wiki-text"
                    aria-label="Edit notes"
                  >
                    [edit]
                  </button>
                  <button
                    onClick={() => {
                      const label = citation.fields?.title || citation.formattedText?.slice(0, 60) || "this citation";
                      // eslint-disable-next-line no-alert
                      if (confirm(`Clear notes for "${label}"?`)) onSaveNotes(citation.id, "");
                    }}
                    className="text-wiki-link text-xs hover:underline focus-visible:outline-dotted focus-visible:outline-1 focus-visible:outline-wiki-text"
                  >
                    [clear]
                  </button>
                </div>
                <p className="text-sm whitespace-pre-wrap">{citation.notes}</p>
              </div>
            ) : (
              <button
                onClick={() => {
                  setNotesDraft("");
                  setEditingNotes(true);
                }}
                className="text-wiki-link text-xs hover:underline focus-visible:outline-dotted focus-visible:outline-1 focus-visible:outline-wiki-text"
                aria-label="Add notes to citation"
              >
                [+ add notes]
              </button>
            )}
          </div>
        )}

        {/* Quotes Section */}
        {onSaveQuotes && (
          <div className="pt-3 border-t border-wiki-border-light mb-3">
            {editingQuotes ? (
              <div className="space-y-2">
                <label className="block text-xs font-medium text-wiki-text-muted">
                  Pulled quotes
                </label>
                {quotesDraft.map((q, i) => (
                  <div key={i} className="flex gap-2 items-start">
                    <textarea
                      value={q.text}
                      onChange={(e) => {
                        const next = [...quotesDraft];
                        next[i] = { ...next[i], text: e.target.value };
                        setQuotesDraft(next);
                      }}
                      rows={2}
                      className="flex-1 px-2 py-1 text-sm border border-wiki-border-light"
                      placeholder='"A direct quotation from the source..."'
                      aria-label={`Quote ${i + 1} text`}
                    />
                    <input
                      type="text"
                      value={q.page ?? ""}
                      onChange={(e) => {
                        const next = [...quotesDraft];
                        next[i] = { ...next[i], page: e.target.value };
                        setQuotesDraft(next);
                      }}
                      className="w-20 px-2 py-1 text-sm border border-wiki-border-light"
                      placeholder="p. 42"
                      aria-label={`Quote ${i + 1} page number`}
                    />
                    <button
                      onClick={() =>
                        setQuotesDraft(quotesDraft.filter((_, idx) => idx !== i))
                      }
                      className="text-wiki-link text-xs hover:underline pt-1 focus-visible:outline-dotted focus-visible:outline-1 focus-visible:outline-wiki-text"
                      aria-label={`Remove quote ${i + 1}`}
                    >
                      [remove]
                    </button>
                  </div>
                ))}
                <div className="flex gap-2">
                  <button
                    onClick={() =>
                      setQuotesDraft([...quotesDraft, { text: "", page: "" }])
                    }
                    className="text-wiki-link text-xs hover:underline focus-visible:outline-dotted focus-visible:outline-1 focus-visible:outline-wiki-text"
                    aria-label="Add another quote"
                  >
                    + add quote
                  </button>
                </div>
                <div className="flex gap-2">
                  <WikiButton
                    variant="primary"
                    onClick={async () => {
                      const cleaned = quotesDraft
                        .map((q) => ({
                          text: q.text.trim(),
                          page: q.page?.trim() || undefined,
                        }))
                        .filter((q) => q.text.length > 0);
                      await onSaveQuotes(citation.id, cleaned);
                      setEditingQuotes(false);
                    }}
                  >
                    Save quotes
                  </WikiButton>
                  <WikiButton onClick={() => setEditingQuotes(false)}>
                    Cancel
                  </WikiButton>
                </div>
              </div>
            ) : citation.quotes && citation.quotes.length > 0 ? (
              <div>
                <div className="flex items-center gap-3 mb-1">
                  <span className="text-xs font-medium text-wiki-text-muted">
                    Quotes ({citation.quotes.length})
                  </span>
                  <button
                    onClick={() => {
                      setQuotesDraft(citation.quotes ?? []);
                      setEditingQuotes(true);
                    }}
                    className="text-wiki-link text-xs hover:underline focus-visible:outline-dotted focus-visible:outline-1 focus-visible:outline-wiki-text"
                    aria-label="Edit quotes"
                  >
                    [edit]
                  </button>
                </div>
                <ul className="space-y-1">
                  {citation.quotes.map((q, i) => (
                    <li key={i} className="text-sm border-l-2 border-wiki-border-light pl-2">
                      <span className="italic">&ldquo;{q.text}&rdquo;</span>
                      {q.page && (
                        <span className="text-wiki-text-muted text-xs ml-1">
                          ({q.page})
                        </span>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            ) : (
              <button
                onClick={() => {
                  setQuotesDraft([{ text: "", page: "" }]);
                  setEditingQuotes(true);
                }}
                className="text-wiki-link text-xs hover:underline focus-visible:outline-dotted focus-visible:outline-1 focus-visible:outline-wiki-text"
                aria-label="Add quotes to citation"
              >
                [+ add quote]
              </button>
            )}
          </div>
        )}

        {/* Tags Section */}
        <div className="pt-3 border-t border-wiki-border-light">
          <div className="flex flex-wrap items-center gap-2">
            {(citation.tags || []).map((tag) => {
              const color = getColor(tag);
              return (
                <span
                  key={tag}
                  className={`inline-flex items-center gap-1 px-2 py-0.5 text-xs border ${color.bg} ${color.text} ${color.border}`}
                >
                  <span>{tag}</span>
                  <button
                    onClick={() => onRemoveTag(citation.id, tag)}
                    className="hover:text-wiki-link focus-visible:outline-dotted focus-visible:outline-1 focus-visible:outline-wiki-text"
                    title="Remove tag"
                    aria-label={`Remove tag ${tag}`}
                  >
                    &times;
                  </button>
                </span>
              );
            })}
            {editingTagsId === citation.id ? (
              <div className="flex flex-wrap items-center gap-1">
                <input
                  type="text"
                  value={newTagInput}
                  onChange={(e) => setNewTagInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      onAddTag(citation.id, newTagInput);
                    } else if (e.key === "Escape") {
                      setEditingTagsId(null);
                      setNewTagInput("");
                    }
                  }}
                  placeholder="tag name"
                  className="w-24 px-1 py-0.5 text-xs border border-wiki-border-light"
                  autoFocus
                />
                <button
                  onClick={() => onAddTag(citation.id, newTagInput)}
                  className="text-wiki-link text-xs hover:underline focus-visible:outline-dotted focus-visible:outline-1 focus-visible:outline-wiki-text"
                  aria-label="Add tag"
                >
                  [add]
                </button>
                <button
                  onClick={() => {
                    setEditingTagsId(null);
                    setNewTagInput("");
                  }}
                  className="text-wiki-text-muted text-xs hover:underline focus-visible:outline-dotted focus-visible:outline-1 focus-visible:outline-wiki-text"
                  aria-label="Cancel adding tag"
                >
                  [cancel]
                </button>
                {(() => {
                  const existing = new Set(citation.tags || []);
                  const query = newTagInput.trim().toLowerCase();
                  const suggestions = availableTags
                    .filter((t) => !existing.has(t))
                    .filter((t) => !query || t.includes(query))
                    .slice(0, 8);
                  if (suggestions.length === 0) return null;
                  return (
                    <>
                      <span className="text-xs text-wiki-text-muted ml-1">or reuse:</span>
                      {suggestions.map((tag) => {
                        const color = getColor(tag);
                        return (
                          <button
                            key={tag}
                            type="button"
                            onClick={() => onAddTag(citation.id, tag)}
                            className={`inline-flex items-center px-2 py-0.5 text-xs border focus-visible:outline-dotted focus-visible:outline-1 focus-visible:outline-wiki-text ${color.bg} ${color.text} ${color.border}`}
                            title={`Add "${tag}"`}
                            aria-label={`Add tag ${tag}`}
                          >
                            + {tag}
                          </button>
                        );
                      })}
                    </>
                  );
                })()}
              </div>
            ) : (
              <button
                onClick={() => setEditingTagsId(citation.id)}
                className="text-wiki-link text-xs hover:underline focus-visible:outline-dotted focus-visible:outline-1 focus-visible:outline-wiki-text"
                aria-label="Add tag to citation"
              >
                [+ add tag]
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
