"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import QRCode from "qrcode";
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
  const [activeShares, setActiveShares] = useState<ActiveShare[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [revokingCode, setRevokingCode] = useState<string | null>(null);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [confirmRevokeCode, setConfirmRevokeCode] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showCreator, setShowCreator] = useState(false);
  const [qrSvgs, setQrSvgs] = useState<Record<string, string>>({});
  const [expandedQrCode, setExpandedQrCode] = useState<string | null>(null);
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

  const fetchActiveShares = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/share");
      const result = await response.json();
      if (!result.success) {
        setActiveShares([]);
        setError(result.error || "Could not load existing share links.");
        return;
      }
      const matches = (result.data as ShareListEntry[])
        .filter((s) => s.type === type && s.targetId === targetId)
        .map<ActiveShare>((s) => ({
          code: s.code,
          url: s.url || `${window.location.origin}/share/${s.code}`,
          expiresAt: s.expiresAt,
          hasPassword: s.hasPassword,
          maxViews: s.maxViews,
          viewCount: s.viewCount,
          lastViewedAt: s.lastViewedAt,
        }));
      setActiveShares(matches);
      // Auto-open creator if there's nothing yet.
      setShowCreator(matches.length === 0);
    } catch {
      setError("Could not load existing share links.");
    } finally {
      setIsLoading(false);
    }
  }, [type, targetId]);

  useEffect(() => {
    if (!isOpen) return;
    setCopiedCode(null);
    setConfirmRevokeCode(null);
    setError(null);
    fetchActiveShares();
  }, [isOpen, fetchActiveShares]);

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
      const created: ActiveShare = {
        code: result.data.code,
        url,
        expiresAt: result.data.expiresAt,
        hasPassword: !!result.data.hasPassword,
        maxViews: result.data.maxViews ?? null,
        viewCount: result.data.viewCount ?? 0,
        lastViewedAt: result.data.lastViewedAt ?? null,
      };
      setActiveShares((prev) => [created, ...prev]);
      setSharePassword("");
      setMaxViewsInput("");
      setShowCreator(false);
      try {
        await navigator.clipboard.writeText(url);
        setCopiedCode(created.code);
      } catch {
        // Clipboard blocked; user can copy manually.
      }
    } catch {
      setError("Failed to create share link");
    } finally {
      setIsCreating(false);
    }
  };

  const handleCopy = async (share: ActiveShare) => {
    try {
      await navigator.clipboard.writeText(share.url);
      setCopiedCode(share.code);
    } catch {
      linkRef.current?.select();
    }
  };

  const toggleQr = async (share: ActiveShare) => {
    if (expandedQrCode === share.code) {
      setExpandedQrCode(null);
      return;
    }
    setExpandedQrCode(share.code);
    if (!qrSvgs[share.code]) {
      try {
        const svg = await QRCode.toString(share.url, {
          type: "svg",
          margin: 0,
          color: { dark: "#202122", light: "#ffffff" },
          errorCorrectionLevel: "M",
        });
        setQrSvgs((prev) => ({ ...prev, [share.code]: svg }));
      } catch {
        // Generation failure: leave svgs entry absent; user can retry.
      }
    }
  };

  const handleRevoke = async (code: string) => {
    setRevokingCode(code);
    setError(null);
    try {
      const response = await fetch(`/api/share/${code}`, { method: "DELETE" });
      const result = await response.json();
      if (!result.success) {
        setError(result.error || "Failed to revoke share link");
        return;
      }
      setActiveShares((prev) => prev.filter((s) => s.code !== code));
      setConfirmRevokeCode(null);
      if (copiedCode === code) setCopiedCode(null);
    } catch {
      setError("Failed to revoke share link");
    } finally {
      setRevokingCode(null);
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

          {!isLoading && activeShares.length > 0 && (
            <ul className="space-y-3">
              {activeShares.map((share, idx) => (
                <li
                  key={share.code}
                  className="border border-wiki-border-light p-3 bg-wiki-white"
                >
                  <label
                    htmlFor={`share-link-${targetId}-${share.code}`}
                    className="block text-xs font-medium mb-1"
                  >
                    Public link {activeShares.length > 1 && <span className="text-wiki-text-muted">#{idx + 1}</span>}
                  </label>
                  <div className="flex gap-2">
                    <input
                      ref={idx === 0 ? linkRef : undefined}
                      id={`share-link-${targetId}-${share.code}`}
                      type="text"
                      readOnly
                      value={share.url}
                      onFocus={(e) => e.currentTarget.select()}
                      className="flex-1 text-xs"
                    />
                    <WikiButton onClick={() => handleCopy(share)}>
                      {copiedCode === share.code ? "Copied" : "Copy"}
                    </WikiButton>
                    <a
                      href={`mailto:?subject=${encodeURIComponent(`${targetName || (type === "list" ? "Citation list" : "Citation project")} — OpenCitation`)}&body=${encodeURIComponent(`I wanted to share this ${type === "list" ? "citation list" : "citation project"} with you:\n\n${share.url}`)}`}
                      className="inline-flex items-center px-4 py-2 text-sm border border-wiki-border-light bg-wiki-white text-wiki-text hover:bg-wiki-tab-bg transition-colors focus-visible:outline-dotted focus-visible:outline-1 focus-visible:outline-wiki-text"
                    >
                      Email
                    </a>
                  </div>
                  {(share.expiresAt || share.hasPassword || share.maxViews) && (
                    <p className="text-wiki-text-muted text-xs mt-1">
                      {share.hasPassword && <>[locked] Password-protected</>}
                      {share.hasPassword && (share.expiresAt || share.maxViews) && " · "}
                      {share.expiresAt && (
                        <>Expires {new Date(share.expiresAt).toLocaleDateString()}</>
                      )}
                      {share.expiresAt && share.maxViews && " · "}
                      {share.maxViews && (
                        <>{share.viewCount ?? 0} of {share.maxViews} views used</>
                      )}
                    </p>
                  )}
                  {!share.maxViews && (share.viewCount ?? 0) > 0 && (
                    <p className="text-wiki-text-muted text-xs mt-0.5">
                      Viewed {share.viewCount}{" "}
                      {share.viewCount === 1 ? "time" : "times"}
                      {share.lastViewedAt && (
                        <>
                          {" · last on "}
                          {new Date(share.lastViewedAt).toLocaleDateString()}
                        </>
                      )}
                    </p>
                  )}

                  <div className="mt-2 flex items-center gap-3">
                    {confirmRevokeCode === share.code ? null : (
                      <>
                        <button
                          onClick={() => toggleQr(share)}
                          aria-expanded={expandedQrCode === share.code}
                          className="text-wiki-link hover:underline text-xs focus-visible:outline-dotted focus-visible:outline-1 focus-visible:outline-wiki-text"
                        >
                          {expandedQrCode === share.code ? "Hide QR" : "Show QR"}
                        </button>
                        <button
                          onClick={() => setConfirmRevokeCode(share.code)}
                          className="text-wiki-link hover:underline text-xs focus-visible:outline-dotted focus-visible:outline-1 focus-visible:outline-wiki-text"
                        >
                          Revoke link
                        </button>
                      </>
                    )}
                    {confirmRevokeCode === share.code && (
                      <div className="w-full p-3 bg-wiki-offwhite border-l-4 border-l-wiki-border border border-wiki-border-light text-xs text-wiki-text">
                        <p className="mb-2">
                          Revoke this link? Anyone with the URL will lose access
                          immediately.
                        </p>
                        <div className="flex gap-2">
                          <WikiButton
                            onClick={() => handleRevoke(share.code)}
                            disabled={revokingCode === share.code}
                          >
                            {revokingCode === share.code ? "Revoking…" : "Yes, revoke"}
                          </WikiButton>
                          <WikiButton
                            onClick={() => setConfirmRevokeCode(null)}
                            disabled={revokingCode === share.code}
                          >
                            Cancel
                          </WikiButton>
                        </div>
                      </div>
                    )}
                  </div>

                  {expandedQrCode === share.code && qrSvgs[share.code] && (
                    <div className="mt-3 flex flex-col items-start gap-2">
                      <div
                        className="border border-wiki-border-light bg-wiki-white p-2"
                        style={{ width: 160, height: 160 }}
                        // qrcode lib returns a self-contained SVG that we
                        // inline. The string never contains user-controlled
                        // data — it's the URL we just composed.
                        dangerouslySetInnerHTML={{ __html: qrSvgs[share.code] }}
                      />
                      <a
                        href={`data:image/svg+xml;charset=utf-8,${encodeURIComponent(qrSvgs[share.code])}`}
                        download={`${share.code}.svg`}
                        className="text-wiki-link hover:underline text-xs focus-visible:outline-dotted focus-visible:outline-1 focus-visible:outline-wiki-text"
                      >
                        Download QR (SVG)
                      </a>
                    </div>
                  )}
                </li>
              ))}
            </ul>
          )}

          {!isLoading && !showCreator && (
            <button
              onClick={() => setShowCreator(true)}
              className="text-wiki-link hover:underline text-xs focus-visible:outline-dotted focus-visible:outline-1 focus-visible:outline-wiki-text"
            >
              + Create {activeShares.length > 0 ? "another" : "a"} share link
            </button>
          )}

          {!isLoading && showCreator && (
            <div className="space-y-3 border-t border-wiki-border-light pt-4">
              <div className="flex items-center justify-between">
                <p className="text-xs font-medium">
                  {activeShares.length > 0 ? "Create another share link" : "Create a share link"}
                </p>
                {activeShares.length > 0 && (
                  <button
                    onClick={() => setShowCreator(false)}
                    className="text-wiki-link hover:underline text-xs focus-visible:outline-dotted focus-visible:outline-1 focus-visible:outline-wiki-text"
                  >
                    [cancel]
                  </button>
                )}
              </div>

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
