"use client";

import { useEffect, useState, useCallback } from "react";
import {
  SHORTCUTS,
  formatShortcutKey,
  type Shortcut,
} from "@/lib/keyboard-shortcuts";

interface ShortcutHelpProps {
  scope?: Shortcut["scope"];
}

export function ShortcutHelp({ scope = "global" }: ShortcutHelpProps) {
  const [isOpen, setIsOpen] = useState(false);

  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      // Don't trigger when typing in input fields
      const target = event.target as HTMLElement;
      const isInputField =
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.isContentEditable;

      if (event.key === "?" && !isInputField) {
        event.preventDefault();
        setIsOpen(true);
      }

      if (event.key === "Escape" && isOpen) {
        event.preventDefault();
        setIsOpen(false);
      }
    },
    [isOpen]
  );

  useEffect(() => {
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  // Filter shortcuts by current scope
  const relevantShortcuts = SHORTCUTS.filter(
    (s) => s.scope === scope || s.scope === "global"
  );

  // Group by scope for display
  const globalShortcuts = relevantShortcuts.filter((s) => s.scope === "global");
  const scopedShortcuts = relevantShortcuts.filter((s) => s.scope !== "global");

  if (!isOpen) {
    return null;
  }

  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
      onClick={() => setIsOpen(false)}
    >
      <div
        className="bg-wiki-white dark:bg-wiki-offwhite border border-wiki-border-light max-w-md w-full mx-4 shadow-lg"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-4 border-b border-wiki-border-light flex justify-between items-center">
          <h3 className="font-bold">Keyboard Shortcuts</h3>
          <button
            onClick={() => setIsOpen(false)}
            className="text-wiki-text-muted hover:text-wiki-text"
          >
            [close]
          </button>
        </div>
        <div className="p-4 max-h-96 overflow-y-auto">
          {globalShortcuts.length > 0 && (
            <div className="mb-4">
              <h4 className="text-sm font-medium text-wiki-text-muted mb-2">
                General
              </h4>
              <div className="space-y-1">
                {globalShortcuts.map((shortcut) => (
                  <ShortcutRow key={shortcut.key} shortcut={shortcut} />
                ))}
              </div>
            </div>
          )}

          {scopedShortcuts.length > 0 && (
            <div>
              <h4 className="text-sm font-medium text-wiki-text-muted mb-2 capitalize">
                {scope === "list" ? "List View" : scope === "cite" ? "Citation Page" : scope}
              </h4>
              <div className="space-y-1">
                {scopedShortcuts.map((shortcut) => (
                  <ShortcutRow
                    key={`${shortcut.key}-${shortcut.modifiers?.join("-") || ""}`}
                    shortcut={shortcut}
                  />
                ))}
              </div>
            </div>
          )}

          <div className="mt-4 pt-3 border-t border-wiki-border-light">
            <p className="text-xs text-wiki-text-muted text-center">
              Press <kbd className="px-1 py-0.5 bg-wiki-tab-bg border border-wiki-border-light text-xs">?</kbd> to toggle this help
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function ShortcutRow({ shortcut }: { shortcut: Shortcut }) {
  return (
    <div className="flex justify-between items-center py-1">
      <span className="text-sm">{shortcut.description}</span>
      <kbd className="px-2 py-0.5 bg-wiki-tab-bg border border-wiki-border-light text-xs font-mono">
        {formatShortcutKey(shortcut)}
      </kbd>
    </div>
  );
}

/**
 * Hook to handle keyboard shortcuts in a component
 */
export function useKeyboardShortcuts(
  handlers: Record<string, (event: KeyboardEvent) => void>,
  deps: unknown[] = []
) {
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Don't trigger when typing in input fields (except Escape)
      const target = event.target as HTMLElement;
      const isInputField =
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.isContentEditable;

      const key = event.key.toLowerCase();

      // Allow Escape in input fields
      if (key === "escape" && handlers["escape"]) {
        handlers["escape"](event);
        return;
      }

      if (isInputField) {
        return;
      }

      // Check for modifier combinations
      if (event.ctrlKey || event.metaKey) {
        const modKey = `ctrl+${key}`;
        if (handlers[modKey]) {
          event.preventDefault();
          handlers[modKey](event);
          return;
        }
      }

      // Simple key handlers
      if (handlers[key]) {
        event.preventDefault();
        handlers[key](event);
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
}
