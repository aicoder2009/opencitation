The award toast: a fixed bottom-right panel with the barnstar medal, shown when a citation count crosses a milestone.

`fixed bottom-4 right-4` at `z-overlay`, `width-toast` (320px) at `sm` and above and the viewport minus 32px below that. It is one of only three surfaces that take the strong `wiki-border` edge — a toast has to read as separate from the page without a shadow. Inside: `pad-card`, a `gap-loose` row holding the 48px medal, then the title at `body-tight` weight 700, the count at `caption` in `wiki-text-muted`, the blurb at `caption`, and a `[×]` dismiss at the top right.

**You provide** nothing; the component reads `useBarnstarAward()` and auto-dismisses after ten seconds.

### The medal

A single SVG polygon filled with a radial gradient through `barnstar-highlight` → `barnstar-gold` → `barnstar-shade`, outlined 2px in `barnstar-stroke`. This is the **only gradient and the only decorative graphic in the system**, and it earns the exception because the barnstar is a real Wikipedia artefact: awarding one is a community custom the product is quoting deliberately. Treat it as a quotation, not a precedent — nothing else gets a gradient.

### Rules

- **Do** keep the copy congratulatory but factual: a title, the count, one sentence.
- **Do** keep `role="status"` with `aria-live="polite"`, so it announces without interrupting.
- **Don't** use this shell for errors or confirmations. Those are `WikiNotice`, inline.
- **Don't** stack toasts. One award at a time.
