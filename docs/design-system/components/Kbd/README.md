A key name that looks like a physical key: `wiki-tab-bg` fill, a 1px edge with a doubled bottom border, and an inset shadow.

Styled on the `<kbd>` element itself in `globals.css`, so a bare `<kbd>Esc</kbd>` is already right. The `kbd` type style (12px mono), 1px/6px padding, a `wiki-border-light` edge whose bottom is `border-kbd-bottom` (2px), and `shadow-kbd` inside the bottom — the one place in the system where a shadow does representational work rather than lifting a surface. `white-space: nowrap` keeps a two-part key together.

**You provide** the key's text. Use the real glyphs people see on their keyboard: `⌘`, `⇧`, `↑↓`, `Esc`, `Enter`.

### Rules

- **Do** use one `<kbd>` per key and put the word between them in plain text: `<kbd>G</kbd> then <kbd>L</kbd>`.
- **Do** pair a shortcut with its action in a two-column row, description left and keys right, as the shortcut sheet does.
- **Don't** set a `<kbd>` inside a button label. Put the shortcut in a `WikiDropdown` item's `hint` instead.
- **Don't** invent a radius for it. The doubled bottom border is what makes it read as a key.
