A bordered section with a `wiki-tab-bg` header and a `[hide]` / `[show]` toggle, for detail that clutters a page when it is always open.

The whole block sits on `wiki-offwhite` inside a `wiki-border-light` edge. The header is `pad-list-x` / `pad-list-y` on `wiki-tab-bg` over a rule, with the title at `body-tight` weight 500 on the left and the toggle link on the right. The body is `px-4 py-3`.

The toggle is a bracketed `wiki-link` link whose label *is* its state: `[hide]` when open, `[show]` when closed. It carries `aria-expanded` and an `aria-label` that names the section.

**You provide** a `title`, the content as children, and optionally `defaultOpen` — which defaults to **true**, because the wiki habit is to show content and let the reader fold it away.

### Rules

- **Do** use it for supplementary detail: citation metadata, advanced filters, raw lookup output.
- **Do** keep the title a noun phrase in sentence case.
- **Don't** hide a primary action inside a collapsed section.
- **Don't** animate the open and close. Instant is the idiom, and `globals.css` collapses durations under `prefers-reduced-motion` anyway.
- For a self-contained disclosure in prose, the styled `<details>` / `<summary>` in `globals.css` does the same job with a `▸` / `▾` marker.
