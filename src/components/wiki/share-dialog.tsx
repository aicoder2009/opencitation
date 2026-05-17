"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { WikiButton } from "./wiki-button";
import { WikiNotice } from "./wiki-notice";
import { WikiSpinner } from "./wiki-spinner";
import { slugify } from "@/lib/share-utils";

type SlugMode = "auto" | "custom" | "random";

interface ShareDialogProps {
  isOpen: boolean;
  onClose: () => void;
  type: "list" | "project";
  targetId: string;
  targetName?: string;
}

interface ActiveShare {
  code: string;
  url: string;
  expiresAt?: string;
  hasPassword?: boolean;
  maxViews?: number | null;
  viewCount?: number;
  lastViewedAt?: string | null;
}

interface ShareListEntry {
  code: string;
  type: string;
  targetId: string;
  url?: string;
  expiresAt?: string;
  hasPassword?: boolean;
  maxViews?: number | null;
  viewCount?: number;
  lastViewedAt?: string | null;
}

const FOCUSABLE = 'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

export function ShareDialog({
  isOpen,
  onClose,
  type,
  targetId,
  targetName,
}: ShareDialogProps) {
  const [activeShare, setActiveShare] = useState<ActiveShare | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [isRevoking, setIsRevoking] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);
  const [confirmRevoke, setConfirmRevoke] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [slugMode, setSlugMode] = useState<SlugMode>("auto");
  const [customSlug, setCustomSlug] = useState("");
  const [sharePassword, setSharePassword] = useState("");
  const [maxViewsInput, setMaxViewsInput] = useState("");
  const linkRef = useRef<HTMLInputElement>(null);
  const dialogRef = useRef<HTMLDivElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);
  const headingId = `share-dialog-heading-${targetId}`;
  const slugModeId = `share-slug-mode-${targetId}`;

  const effectiveSlug = useMemo(() => {
    if (slugMode === "random") return undefined;
    if (slugMode === "custom") return slugify(customSlug) || undefined;
    return slugify(targetName ?? "") || undefined;
  }, [slugMode, customSlug, targetName]);

  const urlPreview = useMemo(() => {
    const origin = typeof window === "undefined" ? "" : window.location.origin;
    const codePlaceholder = "xxxxxxxxxxxx";
    return effectiveSlug
      ? `${origin}/share/${effectiveSlug}--${codePlaceholder}`
      : `${origin}/share/${codePlaceholder}`;
  }, [effectiveSlug]);

  const fetchActiveShare = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/share");
      const result = await response.json();
      if (!result.success) {
        setActiveShare(null);
        setError(result.error || "Could not load existing share link.");
        return;
      }
      const match = (result.data as ShareListEntry[]).find(
        (s) => s.type === type && s.targetId === targetId
      );
      if (match) {
        setActiveShare({
          code: match.code,
          url: match.url || `${window.location.origin}/share/${match.code}`,
          expiresAt: match.expiresAt,
          hasPassword: match.hasPassword,
          maxViews: match.maxViews,
          viewCount: match.viewCount,
          lastViewedAt: match.lastViewedAt,
        });
      } else {
        setActiveShare(null);
      }
    } catch {
      setError("Could not load existing share link.");
    } finally {
      setIsLoading(false);
    }
  }, [type, targetId]);

  useEffect(() => {
    if (!isOpen) return;
    setCopySuccess(false);
    setConfirmRevoke(false);
    setError(null);
    fetchActiveShare();
  }, [isOpen, fetchActiveShare]);

  // Focus management: save previous focus, move into dialog on open, restore on close
  useEffect(() => {
    if (isOpen) {
      previousFocusRef.current = document.activeElement as HTMLElement;
      // Small defer so dialog has rendered before we grab focusable elements
      setTimeout(() => {
        const focusable = dialogRef.current?.querySelectorAll<HTMLElement>(FOCUSABLE);
        focusable?.[0]?.focus();
      }, 30);
    } else {
      previousFocusRef.current?.focus();
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [isOpen, onClose]);

  const handleCreate = async () => {
    setIsCreating(true);
    setError(null);
    try {
      const response = await fetch("/api/share", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type,
          targetId,
          slug: effectiveSlug,
          password: sharePassword || undefined,
          maxViews: maxViewsInput ? Number.parseInt(maxViewsInput, 10) : undefined,
        }),
      });
      const result = await response.json();
      if (!result.success) {
        setError(result.error || "Failed to create share link");
        return;
      }
      const segment = result.data.slug
        ? `${result.data.slug}--${result.data.code}`
        : result.data.code;
      const url = `${window.location.origin}/share/${segment}`;
      setActiveShare({
        code: result.data.code,
        url,
        expiresAt: result.data.expiresAt,
        hasPassword: !!result.data.hasPassword,
        maxViews: result.data.maxViews ?? null,
        viewCount: result.data.viewCount ?? 0,
        lastViewedAt: result.data.lastViewedAt ?? null,
      });
      setSharePassword("");
      setMaxViewsInput("");
      try {
        await navigator.clipboard.writeText(url);
        setCopySuccess(true);
      } catch {
        // Clipboard blocked; user can copy manually.
      }
    } catch {
      setError("Failed to create share link");
    } finally {
      setIsCreating(false);
    }
  };

  const handleCopy = async () => {
    if (!activeShare) return;
    try {
      await navigator.clipboard.writeText(activeShare.url);
      setCopySuccess(true);
    } catch {
      linkRef.current?.select();
    }
  };

  const handleRevoke = async () => {
    if (!activeShare) return;
    setIsRevoking(true);
    setError(null);
    try {
      const response = await fetch(`/api/share/${activeShare.code}`, {
        method: "DELETE",
      });
      const result = await response.json();
      if (!result.success) {
        setError(result.error || "Failed to revoke share link");
        return;
      }
      setActiveShare(null);
      setCopySuccess(false);
      setConfirmRevoke(false);
    } catch {
      setError("Failed to revoke share link");
    } finally {
      setIsRevoking(false);
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
    } else if (document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  };

  if (!isOpen) return null;

  const heading = type === "list" ? "Share this list" : "Share this project";

  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
      onClick={onClose}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={headingId}
        onKeyDown={handleFocusTrap}
        className="bg-wiki-white border border-wiki-border-light max-w-xl w-full mx-4 shadow-lg"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-4 border-b border-wiki-border-light flex justify-between items-start">
          <div>
            <h3 id={headingId} className="font-bold text-base">{heading}</h3>
            {targetName && (
              <p className="text-wiki-text-muted text-xs mt-0.5 break-all">
                {targetName}
              </p>
            )}
          </div>
          <button
            onClick={onClose}
            className="text-wiki-text-muted hover:text-wiki-text text-sm focus-visible:outline-dotted focus-visible:outline-1 focus-visible:outline-wiki-text"
            aria-label="Close"
          >
            [close]
          </button>
        </div>

        <div className="p-4 space-y-4 text-sm">
          <div className="p-3 bg-wiki-offwhite border border-wiki-border-light">
            <div className="font-medium mb-1">
              Anyone with the link can view
            </div>
            <p className="text-wiki-text-muted text-xs leading-relaxed">
              No account needed. Share the link with anyone — classmates,
              co-authors, reviewers — and they&apos;ll see the{" "}
              {type === "list" ? "list" : "project"} in read-only mode. Revoke
              the link below at any time to cut off access.
            </p>
          </div>

          {error && (
            <WikiNotice variant="warn" onDismiss={() => setError(null)}>{error}</WikiNotice>
          )}

          {isLoading && <WikiSpinner />}

          {!isLoading && activeShare && (
            <div className="space-y-3">
              <div>
                <label htmlFor={`share-link-${targetId}`} className="block text-xs font-medium mb-1">
                  Public link
                </label>
                <div className="flex gap-2">
                  <input
                    ref={linkRef}
                    id={`share-link-${targetId}`}
                    type="text"
                    readOnly
                    value={activeShare.url}
                    onFocus={(e) => e.currentTarget.select()}
                    className="flex-1 text-xs"
                  />
                  <WikiButton onClick={handleCopy}>
                    {copySuccess ? "Copied" : "Copy"}
                  </WikiButton>
                  <a
                    href={`mailto:?subject=${encodeURIComponent(`${targetName || (type === "list" ? "Citation list" : "Citation project")} — OpenCitation`)}&body=${encodeURIComponent(`I wanted to share this ${type === "list" ? "citation list" : "citation project"} with you:\n\n${activeShare.url}`)}`}
                    className="inline-flex items-center px-4 py-2 text-sm border border-wiki-border-light bg-wiki-white text-wiki-text hover:bg-wiki-tab-bg transition-colors focus-visible:outline-dotted focus-visible:outline-1 focus-visible:outline-wiki-text"
                  >
                    Email
                  </a>
                </div>
                {(activeShare.expiresAt || activeShare.hasPassword || activeShare.maxViews) && (
                  <p className="text-wiki-text-muted text-xs mt-1">
                    {activeShare.hasPassword && <>[locked] Password-protected</>}
                    {activeShare.hasPassword && (activeShare.expiresAt || activeShare.maxViews) && " · "}
                    {activeShare.expiresAt && (
                      <>Expires {new Date(activeShare.expiresAt).toLocaleDateString()}</>
                    )}
                    {activeShare.expiresAt && activeShare.maxViews && " · "}
                    {activeShare.maxViews && (
                      <>{activeShare.viewCount ?? 0} of {activeShare.maxViews} views used</>
                    )}
                  </p>
                )}
                {!activeShare.maxViews && (activeShare.viewCount ?? 0) > 0 && (
                  <p className="text-wiki-text-muted text-xs mt-0.5">
                    Viewed {activeShare.viewCount}{" "}
                    {activeShare.viewCount === 1 ? "time" : "times"}
                    {activeShare.lastViewedAt && (
                      <>
                        {" "}
                        · last on{" "}
                        {new Date(activeShare.lastViewedAt).toLocaleDateString()}
                      </>
                    )}
                  </p>
                )}
              </div>

              {confirmRevoke ? (
                <div className="p-3 bg-wiki-offwhite border-l-4 border-l-wiki-border border border-wiki-border-light text-xs text-wiki-text">
                  <p className="mb-2">
                    Revoke this link? Anyone with the URL will lose access
                    immediately.
                  </p>
                  <div className="flex gap-2">
                    <WikiButton onClick={handleRevoke} disabled={isRevoking}>
                      {isRevoking ? "Revoking…" : "Yes, revoke"}
                    </WikiButton>
                    <WikiButton
                      onClick={() => setConfirmRevoke(false)}
                      disabled={isRevoking}
                    >
                      Cancel
                    </WikiButton>
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => setConfirmRevoke(true)}
                  className="text-wiki-link hover:underline text-xs focus-visible:outline-dotted focus-visible:outline-1 focus-visible:outline-wiki-text"
                >
                  Revoke link
                </button>
              )}
            </div>
          )}

          {!isLoading && !activeShare && (
            <div className="space-y-3">
              <p className="text-wiki-text-muted">
                No share link yet. Create one to let anyone view this{" "}
                {type === "list" ? "list" : "project"} via a public URL.
              </p>

              <fieldset className="border border-wiki-border-light p-3">
                <legend className="px-1 text-xs font-medium">URL style</legend>
                <div className="space-y-1.5">
                  <label className="flex items-start gap-2 text-xs cursor-pointer">
                    <input
                      type="radio"
                      name={slugModeId}
                      value="auto"
                      checked={slugMode === "auto"}
                      onChange={() => setSlugMode("auto")}
                      className="mt-0.5"
                    />
                    <span>
                      <span className="font-medium">From {type} name</span>
                      <span className="block text-wiki-text-muted">
                        slug derived from &ldquo;{targetName || "untitled"}&rdquo;
                      </span>
                    </span>
                  </label>
                  <label className="flex items-start gap-2 text-xs cursor-pointer">
                    <input
                      type="radio"
                      name={slugModeId}
                      value="custom"
                      checked={slugMode === "custom"}
                      onChange={() => setSlugMode("custom")}
                      className="mt-0.5"
                    />
                    <span>
                      <span className="font-medium">Custom slug</span>
                      <span className="block text-wiki-text-muted">
                        type your own (letters, numbers, and dashes)
                      </span>
                    </span>
                  </label>
                  {slugMode === "custom" && (
                    <input
                      type="text"
                      value={customSlug}
                      onChange={(e) => setCustomSlug(e.target.value)}
                      placeholder="my-thesis-bibliography"
                      aria-label="Custom slug"
                      className="w-full text-xs ml-6"
                      style={{ width: "calc(100% - 1.5rem)" }}
                    />
                  )}
                  <label className="flex items-start gap-2 text-xs cursor-pointer">
                    <input
                      type="radio"
                      name={slugModeId}
                      value="random"
                      checked={slugMode === "random"}
                      onChange={() => setSlugMode("random")}
                      className="mt-0.5"
                    />
                    <span>
                      <span className="font-medium">Random only</span>
                      <span className="block text-wiki-text-muted">
                        unguessable code, no friendly slug
                      </span>
                    </span>
                  </label>
                </div>
                <p
                  className="mt-3 pt-2 border-t border-wiki-border-light text-xs text-wiki-text-muted break-all font-mono"
                  aria-live="polite"
                >
                  {urlPreview}
                </p>
              </fieldset>

              <div>
                <label htmlFor={`share-password-${targetId}`} className="block text-xs font-medium mb-1">
                  Password <span className="text-wiki-text-muted">(optional)</span>
                </label>
                <input
                  id={`share-password-${targetId}`}
                  type="password"
                  value={sharePassword}
                  onChange={(e) => setSharePassword(e.target.value)}
                  placeholder="Leave blank for no password"
                  className="w-full text-xs"
                  autoComplete="new-password"
                />
                <p className="text-xs text-wiki-text-muted mt-1">
                  Recipients will need this password to view the link.
                </p>
              </div>

              <div>
                <label htmlFor={`share-max-views-${targetId}`} className="block text-xs font-medium mb-1">
                  View limit <span className="text-wiki-text-muted">(optional)</span>
                </label>
                <input
                  id={`share-max-views-${targetId}`}
                  type="number"
                  min={1}
                  step={1}
                  value={maxViewsInput}
                  onChange={(e) => setMaxViewsInput(e.target.value)}
                  placeholder="Unlimited"
                  className="w-full text-xs"
                />
                <p className="text-xs text-wiki-text-muted mt-1">
                  Link auto-revokes once this many views have happened.
                </p>
              </div>

              <WikiButton
                variant="primary"
                onClick={handleCreate}
                disabled={isCreating}
              >
                {isCreating ? "Creating…" : "Create share link"}
              </WikiButton>
            </div>
          )}
        </div>

        <div className="p-3 border-t border-wiki-border-light flex justify-end">
          <WikiButton onClick={onClose}>Done</WikiButton>
        </div>
      </div>
    </div>
  );
}
