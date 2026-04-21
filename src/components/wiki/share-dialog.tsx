"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { WikiButton } from "./wiki-button";

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
}

interface ShareListEntry {
  code: string;
  type: string;
  targetId: string;
  url?: string;
  expiresAt?: string;
}

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
  const linkRef = useRef<HTMLInputElement>(null);

  const fetchActiveShare = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/share");
      const result = await response.json();
      if (!result.success) {
        setActiveShare(null);
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
        body: JSON.stringify({ type, targetId }),
      });
      const result = await response.json();
      if (!result.success) {
        setError(result.error || "Failed to create share link");
        return;
      }
      const url = `${window.location.origin}/share/${result.data.code}`;
      setActiveShare({
        code: result.data.code,
        url,
        expiresAt: result.data.expiresAt,
      });
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

  if (!isOpen) return null;

  const heading = type === "list" ? "Share this list" : "Share this project";

  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label={heading}
    >
      <div
        className="bg-wiki-white dark:bg-wiki-offwhite border border-wiki-border-light max-w-lg w-full mx-4 shadow-lg"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-4 border-b border-wiki-border-light flex justify-between items-start">
          <div>
            <h3 className="font-bold text-base">{heading}</h3>
            {targetName && (
              <p className="text-wiki-text-muted text-xs mt-0.5 break-all">
                {targetName}
              </p>
            )}
          </div>
          <button
            onClick={onClose}
            className="text-wiki-text-muted hover:text-wiki-text text-sm"
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
            <div className="p-2 bg-red-50 border border-red-200 text-red-700 text-xs">
              {error}
            </div>
          )}

          {isLoading && (
            <p className="text-wiki-text-muted">Loading…</p>
          )}

          {!isLoading && activeShare && (
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium mb-1">
                  Public link
                </label>
                <div className="flex gap-2">
                  <input
                    ref={linkRef}
                    type="text"
                    readOnly
                    value={activeShare.url}
                    onFocus={(e) => e.currentTarget.select()}
                    className="flex-1 text-xs"
                  />
                  <WikiButton onClick={handleCopy}>
                    {copySuccess ? "Copied" : "Copy"}
                  </WikiButton>
                </div>
                {activeShare.expiresAt && (
                  <p className="text-wiki-text-muted text-xs mt-1">
                    Expires{" "}
                    {new Date(activeShare.expiresAt).toLocaleDateString()}
                  </p>
                )}
              </div>

              {confirmRevoke ? (
                <div className="p-3 border border-red-200 bg-red-50 text-xs text-red-700">
                  <p className="mb-2">
                    Revoke this link? Anyone with the URL will lose access
                    immediately.
                  </p>
                  <div className="flex gap-2">
                    <WikiButton
                      onClick={handleRevoke}
                      disabled={isRevoking}
                      className="text-red-700"
                    >
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
                  className="text-red-600 hover:underline text-xs"
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
