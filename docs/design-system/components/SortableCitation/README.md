The product's core data unit: one citation as a reorderable card with a header strip, a monospace output well and bracketed actions.

A `wiki-white` card inside a `wiki-border-light` edge. The header is `pad-card-head` on `wiki-tab-bg` over a rule and holds, left to right: an optional multi-select checkbox, the drag handle, and the citation's index with its style in caps at `label` weight. The body is `pad-card` and holds the formatted output in a `wiki-offwhite` well, then a `gap-loose` row of bracketed links, then optional notes and quote sections behind `wiki-border-light` top rules.

**You provide** the citation record, its index, the drag context from `@dnd-kit`, and the action handlers. The component owns its edit mode, its notes and quotes editors, and the drag transform.

### States

| State | Border | Shadow |
|---|---|---|
| Rest | `wiki-border-light` 1px | none |
| Selected | `wiki-link` at `border-selected` (2px) | none |
| Dragging | `wiki-border-light` 1px | `shadow-lg` at `z-drag` |
| Drag source | unchanged | none, at `opacity-drag-source` |

The 2px selected border replaces the 1px rest border rather than adding to it, so the card does not shift by a pixel when it is picked.

### Anatomy

- **Drag handle** — a 16px 3×3 dot-grid SVG in `wiki-text-muted`, `cursor-grab` becoming `cursor-grabbing`, hover fill `wiki-border-light`. It carries `aria-label="Drag to reorder"`.
- **Output well** — `wiki-offwhite` inside `wiki-border-light`, holding the `citation` type style. Use `.hanging-indent` for works-cited output.
- **Inline actions** — `[copy]`, `[edit]`, `[delete]` and friends as `wiki-link` links at `body-tight`, separated by `gap-loose`. Never icon buttons.
- **Tags** — `Tag` pills in the header, after the metadata.
- **Notes and quotes** — collapsed sections above `wiki-border-light` rules, with a `caption-strong` label in `wiki-text-muted` and `[add]` / `[edit]` links. A quoted line takes a `border-quote` left rule in `wiki-border-light`.

### Rules

- **Do** keep every row action a bracketed lowercase link. This is the pattern's home, and it sets the convention for the rest of the app.
- **Do** write the output through the citation engine, never by hand, and keep it in the `citation` monospace style so hanging indents and terminal punctuation stay countable.
- **Do** let the drag source keep `opacity-drag-source` from dnd-kit; don't override it.
- **Don't** add a hover shadow or lift. Dragging is the only state that earns elevation.
- **Don't** replace the drag handle with a whole-card drag; the card's links have to stay clickable.
