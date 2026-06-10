"use client";

import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import { fuzzyMatch } from "@/lib/fuzzy-match";

interface PaletteCommand {
  id: string;
  label: string;
  /** Section heading shown when the query is empty. */
  section: string;
  /** Extra text matched against the query but not displayed. */
  keywords?: string;
  /** Right-aligned hint, e.g. the destination path. */
  hint?: string;
  perform: () => void;
}

interface WikiCommandPaletteProps {
  onToggleTheme: () => void;
}

const MAX_RESULTS = 12;

export function WikiCommandPalette({ onToggleTheme }: WikiCommandPaletteProps) {
  const router = useRouter();
  const { isSignedIn } = useUser();
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [dynamicCommands, setDynamicCommands] = useState<PaletteCommand[]>([]);
  const fetchedRef = useRef(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);

  const close = useCallback(() => {
    setIsOpen(false);
    setQuery("");
    setSelectedIndex(0);
    previousFocusRef.current?.focus();
  }, []);

  const go = useCallback(
    (href: string) => () => router.push(href),
    [router]
  );

  const staticCommands = useMemo<PaletteCommand[]>(() => {
    const nav: PaletteCommand[] = [];
    if (isSignedIn) {
      nav.push(
        { id: "nav-dashboard", label: "Dashboard", section: "Navigate", hint: "/home", keywords: "home overview", perform: go("/home") },
        { id: "nav-cite", label: "Cite", section: "Navigate", hint: "/cite", keywords: "new citation generate url doi isbn", perform: go("/cite") },
        { id: "nav-lists", label: "My Lists", section: "Navigate", hint: "/lists", keywords: "citations bibliography", perform: go("/lists") },
        { id: "nav-projects", label: "My Projects", section: "Navigate", hint: "/projects", perform: go("/projects") },
        { id: "nav-search", label: "Search everything", section: "Navigate", hint: "/search", keywords: "find global citations lists projects", perform: go("/search") },
      );
    } else {
      nav.push(
        { id: "nav-cite", label: "Cite", section: "Navigate", hint: "/cite", keywords: "new citation generate url doi isbn", perform: go("/cite") },
        { id: "nav-sign-in", label: "Sign In", section: "Navigate", hint: "/sign-in", keywords: "login account", perform: go("/sign-in") },
        { id: "nav-sign-up", label: "Create Account", section: "Navigate", hint: "/sign-up", keywords: "register signup", perform: go("/sign-up") },
      );
    }
    nav.push(
      { id: "nav-settings", label: "Settings", section: "Navigate", hint: "/settings", keywords: "preferences defaults style theme", perform: go("/settings") },
      { id: "nav-docs", label: "Documentation", section: "Navigate", hint: "/docs", keywords: "help guide docs", perform: go("/docs") },
      { id: "nav-shortcuts", label: "Keyboard Shortcuts", section: "Navigate", hint: "/docs/keyboard-shortcuts", keywords: "keys hotkeys", perform: go("/docs/keyboard-shortcuts") },
      { id: "nav-changelog", label: "Changelog", section: "Navigate", hint: "/docs/changelog", keywords: "news updates releases", perform: go("/docs/changelog") },
    );
    nav.push({
      id: "action-theme",
      label: "Toggle Dark Mode",
      section: "Actions",
      keywords: "theme light dark appearance",
      perform: onToggleTheme,
    });
    return nav;
  }, [isSignedIn, go, onToggleTheme]);

  // Fetch lists and projects once per session, the first time the palette opens.
  useEffect(() => {
    if (!isOpen || !isSignedIn || fetchedRef.current) return;
    fetchedRef.current = true;
    (async () => {
      try {
        const [listsRes, projectsRes] = await Promise.all([
          fetch("/api/lists"),
          fetch("/api/projects"),
        ]);
        const [lists, projects] = await Promise.all([listsRes.json(), projectsRes.json()]);
        const commands: PaletteCommand[] = [];
        if (lists.success) {
          for (const list of lists.data as Array<{ id: string; name: string }>) {
            commands.push({
              id: `list-${list.id}`,
              label: list.name,
              section: "Lists",
              keywords: "list open go",
              perform: go(`/lists/${list.id}`),
            });
          }
        }
        if (projects.success) {
          for (const project of projects.data as Array<{ id: string; name: string }>) {
            commands.push({
              id: `project-${project.id}`,
              label: project.name,
              section: "Projects",
              keywords: "project open go",
              perform: go(`/projects/${project.id}`),
            });
          }
        }
        setDynamicCommands(commands);
      } catch {
        // Offline or unauthenticated — static commands still work.
      }
    })();
  }, [isOpen, isSignedIn, go]);

  const results = useMemo(() => {
    const all = [...staticCommands, ...dynamicCommands];
    if (!query.trim()) return all.slice(0, MAX_RESULTS);
    return all
      .map((command) => {
        const match = fuzzyMatch(query, `${command.label} ${command.keywords ?? ""}`);
        return match ? { command, score: match.score } : null;
      })
      .filter((r): r is { command: PaletteCommand; score: number } => r !== null)
      .sort((a, b) => b.score - a.score)
      .slice(0, MAX_RESULTS)
      .map((r) => r.command);
  }, [query, staticCommands, dynamicCommands]);

  // Global ⌘K / Ctrl+K listener (also works while typing in inputs).
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (
        event.key.toLowerCase() === "k" &&
        (event.metaKey || event.ctrlKey) &&
        !event.altKey &&
        !event.shiftKey
      ) {
        event.preventDefault();
        setIsOpen((open) => {
          if (!open) previousFocusRef.current = document.activeElement as HTMLElement;
          return !open;
        });
        setQuery("");
        setSelectedIndex(0);
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

  useEffect(() => {
    if (isOpen) inputRef.current?.focus();
  }, [isOpen]);

  // Keep the selected option scrolled into view.
  useEffect(() => {
    listRef.current
      ?.querySelector(`[data-index="${selectedIndex}"]`)
      ?.scrollIntoView({ block: "nearest" });
  }, [selectedIndex]);

  const run = (command: PaletteCommand) => {
    close();
    command.perform();
  };

  const handleInputKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === "Escape") {
      event.preventDefault();
      close();
    } else if (event.key === "ArrowDown") {
      event.preventDefault();
      setSelectedIndex((i) => (results.length ? (i + 1) % results.length : 0));
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setSelectedIndex((i) => (results.length ? (i - 1 + results.length) % results.length : 0));
    } else if (event.key === "Enter") {
      event.preventDefault();
      if (results[selectedIndex]) run(results[selectedIndex]);
    }
  };

  if (!isOpen) return null;

  // Section heading appears above the first command of each section, browse mode only.
  const showSections = !query.trim();

  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-start justify-center pt-[15vh] z-50"
      onClick={close}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Command palette"
        className="bg-wiki-white border border-wiki-border-light max-w-xl w-full mx-4 shadow-lg"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="border-b border-wiki-border-light">
          <input
            ref={inputRef}
            type="text"
            role="combobox"
            aria-expanded="true"
            aria-controls="command-palette-results"
            aria-activedescendant={
              results[selectedIndex] ? `command-${results[selectedIndex].id}` : undefined
            }
            aria-label="Type a command or search"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelectedIndex(0);
            }}
            onKeyDown={handleInputKeyDown}
            placeholder="Type a command or search..."
            className="w-full px-4 py-3 text-sm bg-wiki-white border-0 focus:outline-none"
            autoComplete="off"
            spellCheck={false}
          />
        </div>
        <div
          ref={listRef}
          id="command-palette-results"
          role="listbox"
          aria-label="Commands"
          className="max-h-80 overflow-y-auto"
        >
          {results.length === 0 ? (
            <p className="px-4 py-6 text-sm text-wiki-text-muted text-center">
              No matching commands.
            </p>
          ) : (
            results.map((command, index) => (
              <div key={command.id}>
                {showSections &&
                  (index === 0 || results[index - 1].section !== command.section) && (
                    <div className="px-4 pt-2 pb-1 text-xs font-medium text-wiki-text-muted uppercase tracking-wide">
                      {command.section}
                    </div>
                  )}
                <button
                  type="button"
                  id={`command-${command.id}`}
                  data-index={index}
                  role="option"
                  aria-selected={index === selectedIndex}
                  className={`w-full flex items-center justify-between gap-3 px-4 py-2 text-sm text-left focus-visible:outline-dotted focus-visible:outline-1 focus-visible:outline-wiki-text ${
                    index === selectedIndex ? "bg-wiki-tab-bg" : "hover:bg-wiki-offwhite"
                  }`}
                  onClick={() => run(command)}
                  onMouseMove={() => setSelectedIndex(index)}
                >
                  <span className="text-wiki-link truncate">{command.label}</span>
                  <span className="text-xs text-wiki-text-muted shrink-0">
                    {command.hint ?? (!showSections ? command.section : "")}
                  </span>
                </button>
              </div>
            ))
          )}
        </div>
        <div className="px-4 py-2 border-t border-wiki-border-light text-xs text-wiki-text-muted flex gap-4">
          <span><kbd>↑↓</kbd> navigate</span>
          <span><kbd>Enter</kbd> select</span>
          <span><kbd>Esc</kbd> close</span>
        </div>
      </div>
    </div>
  );
}
