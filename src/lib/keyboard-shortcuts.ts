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
  { key: "k", description: "Open command palette", modifiers: ["meta"], scope: "global" },
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

