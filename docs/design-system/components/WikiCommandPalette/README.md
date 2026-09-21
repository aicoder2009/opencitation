The ⌘K palette: a scrim, a bare search field, and a fuzzy-matched list of commands grouped by section.

The dialog is `width-modal` wide with `shadow-lg`, pinned 15vh from the top of an `overlay-scrim`. The input carries no border of its own — the `wiki-border-light` rule beneath it is the separator. Results are `body-tight` rows whose label is `wiki-link` and whose right-aligned hint is `caption` in `wiki-text-muted`. The footer strip lists `<kbd>` hints.

**You provide** nothing; `WikiLayout` mounts it once and it owns its own shortcut, its command registry and the fuzzy matcher in `src/lib/fuzzy-match.ts`.

### States

| State | Appearance |
|---|---|
| Keyboard-selected row | `wiki-tab-bg` fill |
| Hover row | `wiki-offwhite` fill |
| Section heading | `eyebrow` in `wiki-text-muted` |
| No match | one centred `body-tight` line in `wiki-text-muted`: "No matching commands." |

Pointer selection and keyboard selection are the same state, so moving the mouse updates the selected index rather than showing two highlights at once.

### Rules

- **Do** register a command with a short imperative label and a section: `Add citation` under `Actions`.
- **Do** give a command a `hint` when it also has a direct shortcut.
- **Don't** put a destructive command in the palette without a confirmation step behind it.
- **Don't** add a second overlay on top; the palette closes before anything else opens.
