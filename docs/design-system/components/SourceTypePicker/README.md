A row of the common source types as buttons, plus a searchable menu for the rest of the eleven.

Each type is a `WikiButton`; the chosen one is marked by a `wiki-link` border and nothing else — no fill, no checkmark. The `More` trigger takes the same treatment when the active type lives inside its menu. That menu is `absolute right-0 z-dropdown` with `shadow-md`: a `wiki-offwhite` search strip over a rule, then group headings in `eyebrow` on `wiki-offwhite`, then options at `body-tight` with a trailing `✓` on the active one. An empty search shows one italic `wiki-text-muted` line, "No matches."

**You provide** the current `value` and an `onChange`. The component owns the search text, the grouping and dismissal.

### Rules

- **Do** keep the most-used types in the visible row so the common path needs no menu.
- **Do** mark selection with a border. A fill here would look like a pressed button.
- **Don't** flatten the menu's groups — the headings are how someone finds Film versus TV Episode.
- **Don't** add a twelfth type without also handling it in all four built-in formatters, the CSL mapping, both exporters and both importers.
