The `?` sheet: every keyboard shortcut, grouped by section, as description-left and keys-right rows.

A `Modal` shell at `width-modal` with `shadow-lg`, except the dialog sits on `wiki-offwhite` in dark rather than `wiki-white`, so it separates from the page at that end. Header is `pad-card` with the title at `modal-heading`; the body is `pad-card` and scrolls past 384px. Each group gets a `body-tight` weight-500 heading in `wiki-text-muted`, then rows of a `body-tight` description on the left and `<kbd>` keys on the right, at `stack-tight` rhythm. A closing `caption` line in `wiki-text-muted` sits above a `wiki-border-light` rule at the bottom.

**You provide** nothing; the sheet reads the registry in `src/lib/keyboard-shortcuts.ts`, which is also what binds the keys.

### Rules

- **Do** register a shortcut in `keyboard-shortcuts.ts` so it appears here automatically. A shortcut that is not listed does not exist to the user.
- **Do** write the description as the action, sentence case: "Open the command palette".
- **Don't** group by key. Group by what the user is trying to do.
- **Don't** list a shortcut that only works on one platform without saying which.
