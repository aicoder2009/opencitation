"use client";

import { useState } from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { useTagColors } from "@/lib/tag-colors";
import { generateInTextCitation } from "@/lib/citation";
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

const READING_STATUS_LABELS: Record<ReadingStatus, string> = {
  "to-read": "to read",
  reading: "reading",
  read: "read",
  cited: "cited",
};

const READING_STATUS_STYLES: Record<ReadingStatus, string> = {
  "to-read": "bg-amber-50 text-amber-800 border-amber-300",
  reading: "bg-blue-50 text-blue-800 border-blue-300",
  read: "bg-green-50 text-green-800 border-green-300",
  cited: "bg-purple-50 text-purple-800 border-purple-300",
};

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
  onSetReadingStatus?: (id: string, status: ReadingStatus | null) => void | Promise<void>;
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
  onSetReadingStatus,
}: SortableCitationProps) {
  const [internalIsEditing, setInternalIsEditing] = useState(false);
  const isEditingMode = internalIsEditing || externalIsEditing;
  const [isSaving, setIsSaving] = useState(false);
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
    try {
      await onEdit(citation.id, editFields);
      setInternalIsEditing(false);
      onEditDone?.();
    } catch (err) {
      console.error("Failed to save:", err);
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
          ? "border-wiki-link ring-2 ring-wiki-link/20"
          : "border-wiki-border-light"
      }`}
    >
      {/* Header with drag handle */}
      <div className="flex items-center gap-2 p-3 bg-wiki-tab-bg border-b border-wiki-border-light">
        <button
          {...attributes}
          {...listeners}
          className="cursor-grab active:cursor-grabbing p-1 hover:bg-wiki-border-light rounded text-wiki-text-muted"
          title="Drag to reorder"
        >
          <svg
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
        {onSetReadingStatus && (
          <select
            value={citation.readingStatus ?? ""}
            onChange={(e) => {
              const v = e.target.value;
              onSetReadingStatus(citation.id, v === "" ? null : (v as ReadingStatus));
            }}
            onClick={(e) => e.stopPropagation()}
            className={`ml-auto text-xs px-2 py-0.5 border ${
              citation.readingStatus
                ? READING_STATUS_STYLES[citation.readingStatus]
                : "bg-wiki-white text-wiki-text-muted border-wiki-border-light"
            }`}
            title="Reading status"
          >
            <option value="">no status</option>
            <option value="to-read">{READING_STATUS_LABELS["to-read"]}</option>
            <option value="reading">{READING_STATUS_LABELS["reading"]}</option>
            <option value="read">{READING_STATUS_LABELS["read"]}</option>
            <option value="cited">{READING_STATUS_LABELS["cited"]}</option>
          </select>
        )}
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
                />
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={saveEditing}
                disabled={isSaving}
                className="px-3 py-1 text-sm bg-wiki-link text-white hover:bg-wiki-link-hover disabled:opacity-50"
              >
                {isSaving ? "Saving..." : "Save"}
              </button>
              <button
                onClick={cancelEditing}
                className="px-3 py-1 text-sm border border-wiki-border-light hover:bg-wiki-offwhite"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <>
            <p
              className="citation-text mb-4"
              dangerouslySetInnerHTML={{ __html: citation.formattedHtml }}
            />
            <div className="flex flex-wrap gap-2 mb-3">
              <button
                onClick={() => onCopy(citation.formattedText)}
                className="text-wiki-link text-sm hover:underline"
              >
                [copy]
              </button>
              {citation.fields && (
                <button
                  onClick={() =>
                    onCopy(
                      generateInTextCitation(
                        citation.fields as unknown as FullCitationFields,
                        citation.style as CitationStyle
                      )
                    )
                  }
                  className="text-wiki-link text-sm hover:underline"
                  title={`In-text citation (${citation.style.toUpperCase()})`}
                >
                  [copy in-text]
                </button>
              )}
              <button
                onClick={startEditing}
                className="text-wiki-link text-sm hover:underline"
              >
                [edit]
              </button>
              <button
                onClick={() => onDelete(citation.id)}
                className="text-red-600 text-sm hover:underline"
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
                  autoFocus
                />
                <div className="flex gap-2">
                  <button
                    onClick={async () => {
                      await onSaveNotes(citation.id, notesDraft.trim());
                      setEditingNotes(false);
                    }}
                    className="px-3 py-1 text-sm bg-wiki-link text-white hover:bg-wiki-link-hover"
                  >
                    Save notes
                  </button>
                  <button
                    onClick={() => setEditingNotes(false)}
                    className="px-3 py-1 text-sm border border-wiki-border-light hover:bg-wiki-offwhite"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : citation.notes ? (
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-medium text-wiki-text-muted">Notes</span>
                  <button
                    onClick={() => {
                      setNotesDraft(citation.notes ?? "");
                      setEditingNotes(true);
                    }}
                    className="text-wiki-link text-xs hover:underline"
                  >
                    [edit]
                  </button>
                  <button
                    onClick={() => onSaveNotes(citation.id, "")}
                    className="text-red-600 text-xs hover:underline"
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
                className="text-wiki-link text-xs hover:underline"
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
                    />
                    <button
                      onClick={() =>
                        setQuotesDraft(quotesDraft.filter((_, idx) => idx !== i))
                      }
                      className="text-red-600 text-xs hover:underline pt-1"
                    >
                      remove
                    </button>
                  </div>
                ))}
                <div className="flex gap-2">
                  <button
                    onClick={() =>
                      setQuotesDraft([...quotesDraft, { text: "", page: "" }])
                    }
                    className="text-wiki-link text-xs hover:underline"
                  >
                    + add quote
                  </button>
                </div>
                <div className="flex gap-2">
                  <button
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
                    className="px-3 py-1 text-sm bg-wiki-link text-white hover:bg-wiki-link-hover"
                  >
                    Save quotes
                  </button>
                  <button
                    onClick={() => setEditingQuotes(false)}
                    className="px-3 py-1 text-sm border border-wiki-border-light hover:bg-wiki-offwhite"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : citation.quotes && citation.quotes.length > 0 ? (
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-medium text-wiki-text-muted">
                    Quotes ({citation.quotes.length})
                  </span>
                  <button
                    onClick={() => {
                      setQuotesDraft(citation.quotes ?? []);
                      setEditingQuotes(true);
                    }}
                    className="text-wiki-link text-xs hover:underline"
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
                className="text-wiki-link text-xs hover:underline"
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
                    className="hover:text-red-600"
                    title="Remove tag"
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
                  className="text-wiki-link text-xs hover:underline"
                >
                  add
                </button>
                <button
                  onClick={() => {
                    setEditingTagsId(null);
                    setNewTagInput("");
                  }}
                  className="text-wiki-text-muted text-xs hover:underline"
                >
                  cancel
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
                            className={`inline-flex items-center px-2 py-0.5 text-xs border hover:opacity-80 ${color.bg} ${color.text} ${color.border}`}
                            title={`Add "${tag}"`}
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
                className="text-wiki-link text-xs hover:underline"
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
