"use client";

import { useEffect, useRef, useState } from "react";
import DOMPurify from "isomorphic-dompurify";
import { WikiButton } from "./wiki-button";
import { WikiNotice } from "./wiki-notice";
import { WikiSelect } from "./wiki-select";
import { formatCitation } from "@/lib/citation";
import { buildCitationFields } from "@/lib/citation/build-fields";
import type { CitationStyle, SourceType, CitationFields } from "@/types";

interface CitationAddModalProps {
  isOpen: boolean;
  onClose: () => void;
  listId: string;
  listName: string;
  onCitationAdded: () => void;
}

const CITATION_STYLES: { value: CitationStyle; label: string }[] = [
  { value: "apa", label: "APA 7th" },
  { value: "mla", label: "MLA 9th" },
  { value: "chicago", label: "Chicago 17th" },
  { value: "harvard", label: "Harvard" },
];

const ARXIV_BARE = /^(?:arxiv:)?(\d{4}\.\d{4,5}(?:v\d+)?)$/i;
const ARXIV_OLD = /^(?:arxiv:)?([a-z-]+\/\d{7}(?:v\d+)?)$/i;
const DOI_RE = /^10\.\d{4,}/;
const ISBN_RE = /^(97[89])?\d{9}[\dX]$/i;
const ISBN_DASHES = /^\d{1,5}-\d{1,7}-\d{1,7}-[\dX]$/i;

function detectEndpoint(raw: string): { endpoint: string; body: object } | null {
  const input = raw.trim();
  if (input.match(/^(https?:\/\/|www\.)/i)) {
    return { endpoint: "/api/lookup/url", body: { url: input } };
  }
  const arxivBare = input.match(ARXIV_BARE);
  const arxivOld = input.match(ARXIV_OLD);
  if (arxivBare || arxivOld) {
    const m = arxivBare || arxivOld;
    return { endpoint: "/api/lookup/arxiv", body: { arxivId: m![1] } };
  }
  if (input.match(DOI_RE)) {
    return { endpoint: "/api/lookup/doi", body: { doi: input } };
  }
  if (input.match(ISBN_RE) || input.match(ISBN_DASHES)) {
    return { endpoint: "/api/lookup/isbn", body: { isbn: input.replace(/[-\s]/g, "") } };
  }
  return null;
}

const FOCUSABLE = 'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

export function CitationAddModal({
  isOpen,
  onClose,
  listId,
  listName,
  onCitationAdded,
}: CitationAddModalProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const dialogRef = useRef<HTMLDivElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);
  const headingId = `modal-heading-${listId}`;
  const [input, setInput] = useState("");
  const [selectedStyle, setSelectedStyle] = useState<CitationStyle>("apa");
  const [addMore, setAddMore] = useState(false);
  const [isLooking, setIsLooking] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [lookupError, setLookupError] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [citationFields, setCitationFields] = useState<CitationFields | null>(null);
  const [generatedCitation, setGeneratedCitation] = useState<{ text: string; html: string } | null>(null);
  const [addedCount, setAddedCount] = useState(0);
  const [showSuccess, setShowSuccess] = useState(false);
  const successTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Focus management: save previous focus, move into dialog on open, restore on close
  useEffect(() => {
    if (isOpen) {
      previousFocusRef.current = document.activeElement as HTMLElement;
      setTimeout(() => inputRef.current?.focus(), 50);
    } else {
      previousFocusRef.current?.focus();
      // Reset everything on close
      setInput("");
      setCitationFields(null);
      setGeneratedCitation(null);
      setLookupError(null);
      setSaveError(null);
      setAddedCount(0);
      setShowSuccess(false);
      setAddMore(false);
    }
  }, [isOpen]);

  // Escape to close
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [isOpen, onClose]);

  // Reformat when style changes
  useEffect(() => {
    if (!citationFields) return;
    const formatted = formatCitation(citationFields, selectedStyle);
    setGeneratedCitation(formatted);
  }, [selectedStyle, citationFields]);

  const handleLookup = async () => {
    if (!input.trim()) return;
    const detected = detectEndpoint(input);
    if (!detected) {
      setLookupError("Could not detect input type. Enter a URL, DOI, ISBN, or arXiv ID.");
      return;
    }

    setIsLooking(true);
    setLookupError(null);
    setCitationFields(null);
    setGeneratedCitation(null);
    setSaveError(null);

    try {
      const res = await fetch(detected.endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(detected.body),
      });
      const result = await res.json();
      if (!result.success) {
        setLookupError(result.error || "Lookup failed. Check the URL/ID and try again.");
        return;
      }
      const data = result.data as Record<string, unknown>;
      const autoType =
        detected.endpoint === "/api/lookup/arxiv"
          ? ("preprint" as SourceType)
          : (data.suggestedSourceType as SourceType | undefined) ?? "website";
      const fields = buildCitationFields(data, autoType, "web");
      const formatted = formatCitation(fields, selectedStyle);
      setCitationFields(fields);
      setGeneratedCitation(formatted);
    } catch {
      setLookupError("Network error. Please try again.");
    } finally {
      setIsLooking(false);
    }
  };

  const handleAdd = async () => {
    if (!generatedCitation || !citationFields) return;

    setIsSaving(true);
    setSaveError(null);

    try {
      const res = await fetch(`/api/lists/${listId}/citations`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fields: citationFields,
          style: selectedStyle,
          formattedText: generatedCitation.text,
          formattedHtml: generatedCitation.html,
        }),
      });
      const result = await res.json();
      if (!result.success) {
        setSaveError(result.error || "Failed to add citation.");
        return;
      }

      onCitationAdded();

      if (addMore) {
        // Stay open — reset for next entry
        setAddedCount((n) => n + 1);
        setInput("");
        setCitationFields(null);
        setGeneratedCitation(null);
        setLookupError(null);
        setSaveError(null);
        setShowSuccess(true);
        if (successTimer.current) clearTimeout(successTimer.current);
        successTimer.current = setTimeout(() => setShowSuccess(false), 1500);
        setTimeout(() => inputRef.current?.focus(), 30);
      } else {
        onClose();
      }
    } catch {
      setSaveError("Network error. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleFocusTrap = (e: React.KeyboardEvent) => {
    if (e.key !== "Tab") return;
    const focusable = Array.from(
      dialogRef.current?.querySelectorAll<HTMLElement>(FOCUSABLE) ?? []
    );
    if (focusable.length === 0) return;
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (e.shiftKey) {
      if (document.activeElement === first) { e.preventDefault(); last.focus(); }
    } else {
      if (document.activeElement === last) { e.preventDefault(); first.focus(); }
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={headingId}
        onKeyDown={handleFocusTrap}
        className="bg-wiki-white border border-wiki-border-light w-full max-w-xl mx-4 shadow-lg max-h-[90vh] flex flex-col"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-wiki-border-light">
          <div>
            <h2 id={headingId} className="font-bold text-base">Add Citation</h2>
            <p className="text-xs text-wiki-text-muted mt-0.5">
              to &ldquo;{listName}&rdquo;
              {addMore && addedCount > 0 && (
                <span className="ml-2 text-wiki-link font-medium">
                  {addedCount} added
                </span>
              )}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-wiki-text-muted hover:text-wiki-text text-sm focus-visible:outline-dotted focus-visible:outline-1 focus-visible:outline-wiki-text"
            aria-label="Close"
          >
            [close]
          </button>
        </div>

        {/* Body */}
        <div className="p-5 overflow-y-auto space-y-4">
          {/* Input + style row */}
          <div className="flex gap-2 items-start">
            <div className="flex-1">
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={(e) => { setInput(e.target.value); setLookupError(null); }}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    if (generatedCitation) handleAdd();
                    else handleLookup();
                  }
                }}
                placeholder="URL, DOI, ISBN, or arXiv ID"
                aria-label="URL, DOI, ISBN, or arXiv ID"
                className="w-full"
                disabled={isLooking || isSaving}
              />
            </div>
            <WikiSelect
              value={selectedStyle}
              onChange={(v) => setSelectedStyle(v as CitationStyle)}
              options={CITATION_STYLES}
              className="w-32"
            />
          </div>

          {lookupError && (
            <WikiNotice variant="warn" onDismiss={() => setLookupError(null)}>{lookupError}</WikiNotice>
          )}

          {/* Citation preview */}
          {generatedCitation && (
            <div className="border border-wiki-border-light bg-wiki-offwhite p-3 text-sm">
              <p className="text-xs font-semibold text-wiki-text-muted uppercase tracking-wide mb-1.5">
                Preview
              </p>
              <p
                className="citation-text"
                dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(generatedCitation.html) }}
              />
            </div>
          )}

          {saveError && (
            <WikiNotice variant="warn" onDismiss={() => setSaveError(null)}>{saveError}</WikiNotice>
          )}

          {showSuccess && (
            <WikiNotice>✓ Added to &ldquo;{listName}&rdquo;</WikiNotice>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-wiki-border-light flex items-center justify-between gap-3">
          <div className="flex items-center gap-4">
            <a
              href="/cite"
              className="text-xs text-wiki-link hover:underline"
              tabIndex={-1}
            >
              Full citation editor →
            </a>
            <label className="flex items-center gap-1.5 text-xs text-wiki-text-muted cursor-pointer select-none">
              <input
                type="checkbox"
                checked={addMore}
                onChange={(e) => setAddMore(e.target.checked)}
                className="cursor-pointer"
              />
              Add multiple
            </label>
          </div>
          <div className="flex gap-2">
            <WikiButton onClick={onClose} disabled={isSaving}>
              Done
            </WikiButton>
            {!generatedCitation ? (
              <WikiButton
                variant="primary"
                onClick={handleLookup}
                disabled={!input.trim() || isLooking}
              >
                {isLooking ? "Looking up…" : "Look Up"}
              </WikiButton>
            ) : (
              <WikiButton
                variant="primary"
                onClick={handleAdd}
                disabled={isSaving}
              >
                {isSaving ? "Adding…" : "Add to List"}
              </WikiButton>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
