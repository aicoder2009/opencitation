/**
 * Keyboard Shortcuts
 *
 * Power-user keyboard shortcuts for navigating and managing citations.
 */

export interface Shortcut {
  key: string;
  description: string;
  modifiers?: ("ctrl" | "shift" | "alt" | "meta")[];
  scope: "global" | "list" | "cite";
}

export const SHORTCUTS: Shortcut[] = [
  // Global shortcuts
  { key: "?", description: "Show keyboard shortcuts", scope: "global" },
  { key: "/", description: "Focus search", scope: "global" },
  { key: "Escape", description: "Close modal / Cancel editing", scope: "global" },

  // List view shortcuts
  { key: "j", description: "Move selection down", scope: "list" },
  { key: "k", description: "Move selection up", scope: "list" },
  { key: "e", description: "Edit selected citation", scope: "list" },
  { key: "d", description: "Delete selected citation", scope: "list" },
  { key: "c", description: "Copy selected citation", scope: "list" },
  { key: "Enter", description: "Open selected citation details", scope: "list" },

  // Cite page shortcuts
  { key: "g", description: "Generate citation", scope: "cite" },
  { key: "s", description: "Save to list", modifiers: ["ctrl"], scope: "cite" },
];

/**
 * Get shortcuts filtered by scope
 */
export function getShortcutsByScope(scope: Shortcut["scope"]): Shortcut[] {
  return SHORTCUTS.filter((s) => s.scope === scope || s.scope === "global");
}

/**
 * Format shortcut key for display
 */
export function formatShortcutKey(shortcut: Shortcut): string {
  const parts: string[] = [];

  if (shortcut.modifiers?.includes("ctrl")) {
    parts.push("Ctrl");
  }
  if (shortcut.modifiers?.includes("shift")) {
    parts.push("Shift");
  }
  if (shortcut.modifiers?.includes("alt")) {
    parts.push("Alt");
  }
  if (shortcut.modifiers?.includes("meta")) {
    parts.push("Cmd");
  }

  // Format special keys
  const keyDisplay =
    shortcut.key === "Escape"
      ? "Esc"
      : shortcut.key === "Enter"
      ? "Enter"
      : shortcut.key === "/"
      ? "/"
      : shortcut.key === "?"
      ? "?"
      : shortcut.key.toUpperCase();

  parts.push(keyDisplay);

  return parts.join(" + ");
}

/**
 * Check if an event matches a shortcut
 */
export function matchesShortcut(event: KeyboardEvent, shortcut: Shortcut): boolean {
  // Don't trigger shortcuts when typing in input fields
  const target = event.target as HTMLElement;
  const isInputField =
    target.tagName === "INPUT" ||
    target.tagName === "TEXTAREA" ||
    target.isContentEditable;

  // Allow some shortcuts even in input fields
  const allowInInput = ["Escape"].includes(shortcut.key);

  if (isInputField && !allowInInput) {
    return false;
  }

  // Check key match
  if (event.key.toLowerCase() !== shortcut.key.toLowerCase()) {
    return false;
  }

  // Check modifiers
  const expectedCtrl = shortcut.modifiers?.includes("ctrl") || false;
  const expectedShift = shortcut.modifiers?.includes("shift") || false;
  const expectedAlt = shortcut.modifiers?.includes("alt") || false;
  const expectedMeta = shortcut.modifiers?.includes("meta") || false;

  if (
    event.ctrlKey !== expectedCtrl ||
    event.shiftKey !== expectedShift ||
    event.altKey !== expectedAlt ||
    event.metaKey !== expectedMeta
  ) {
    return false;
  }

  return true;
}
