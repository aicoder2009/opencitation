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
}: SortableCitationProps) {
  const [internalIsEditing, setInternalIsEditing] = useState(false);
  const isEditingMode = internalIsEditing || externalIsEditing;
  const [isSaving, setIsSaving] = useState(false);
  const { getColor } = useTagColors();
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
