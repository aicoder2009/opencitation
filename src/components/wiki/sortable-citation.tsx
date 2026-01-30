"use client";

import { useState } from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

interface CitationFields {
  title?: string;
  authors?: Array<{ firstName?: string; lastName: string }>;
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
  const hash = tag.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return TAG_COLORS[hash % TAG_COLORS.length];
}

interface EditableFields {
  title: string;
  authorFirst: string;
  authorLast: string;
  year: string;
  url: string;
}

interface SortableCitationProps {
  citation: Citation;
  index: number;
  isSelected?: boolean;
  isEditing?: boolean;
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
  const [editFields, setEditFields] = useState<EditableFields>({
    title: "",
    authorFirst: "",
    authorLast: "",
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
      authorLast: firstAuthor?.lastName || "",
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
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-xs font-medium text-wiki-text-muted mb-1">Author First Name</label>
                <input
                  type="text"
                  value={editFields.authorFirst}
                  onChange={(e) => setEditFields({ ...editFields, authorFirst: e.target.value })}
                  className="w-full px-2 py-1 text-sm border border-wiki-border-light"
                  placeholder="First name"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-wiki-text-muted mb-1">Author Last Name</label>
                <input
                  type="text"
                  value={editFields.authorLast}
                  onChange={(e) => setEditFields({ ...editFields, authorLast: e.target.value })}
                  className="w-full px-2 py-1 text-sm border border-wiki-border-light"
                  placeholder="Last name"
                />
              </div>
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
              const color = getTagColor(tag);
              return (
                <span
                  key={tag}
                  className={`inline-flex items-center gap-1 px-2 py-0.5 text-xs border ${color.bg} ${color.text} ${color.border}`}
                >
                  {tag}
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
              <div className="flex items-center gap-1">
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
