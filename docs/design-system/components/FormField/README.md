Label above input, 1px border, no radius: the base form pattern, styled on the elements themselves in `globals.css`.

`input`, `textarea` and `select` all get `pad-input` (12px), a `wiki-border-light` edge, a `wiki-white` fill, `body` at 14px, and `wiki-link` as the caret colour. Focus swaps the border to `wiki-link` and suppresses the dotted outline for pointer focus only — keyboard focus still shows the ring through `:focus-visible`. In dark, the fill moves to `wiki-offwhite` so a field separates from the page.

**You provide** the label element, the `id`/`htmlFor` pair and the value binding. The stylesheet provides everything visual, so a bare `<input>` is already correct.

### Anatomy

| Part | Style |
|---|---|
| Label | `label` style in `wiki-text`, always above the field |
| Input | `pad-input`, `wiki-border-light`, `wiki-white` |
| Inline edit input | `pad-input-tight` (4px/8px) at `body-tight`, used inside a citation card |
| Between fields | `stack-field` (16px) |
| Label to input | `stack-tight` (4px) |

### States

| State | Border |
|---|---|
| Rest | `wiki-border-light` |
| Focus | `wiki-link` |
| Disabled | `wiki-border-light` at `opacity-disabled` |

There is no red error border and no error fill. An invalid field keeps its border and the message goes in a `WikiNotice` with `variant="warn"` near the control.

### Rules

- **Do** keep the label visible and above the field. Never float it, never let a placeholder stand in for it.
- **Do** use a native `<select>` for a plain value list, so the OS picker and its accessibility come free. Reach for `WikiSelect` only when you need a styled, searchable listbox.
- **Do** write placeholders as examples, not instructions: `10.1038/nature12373`.
- **Don't** add a radius, an inner shadow or a focus glow.
