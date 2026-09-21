The only way to override a tag's hashed colour: a ten-swatch grid in a floating panel.

An `absolute z-dropdown` panel, `p-3` on `wiki-white` inside `wiki-border-light` with `shadow-md`, 256px wide. The swatches are a 5 × 2 grid with a 6px gap; each is a 20px square filled with its slot's `active-bg`. The chosen swatch is marked by a `wiki-link` border, the others by a transparent one of the same width so nothing shifts on selection. The slot's name sits below the grid at `caption` in `wiki-text-muted`.

**You provide** the tag name and a change handler. The component writes the override to `localStorage` under `opencitation:tag-colors` and broadcasts a change event so every mounted tag updates at once.

### Rules

- **Do** offer this only from a tag itself, so the override is clearly about that one tag.
- **Do** let the swatch order match `TAG_COLORS`, which is the slot index order — people learn the grid by position.
- **Don't** offer a free colour input. Ten slots is the palette, and staying inside it is what keeps a list legible.
- **Don't** ship a light-mode-only override. Each slot already carries both themes.
