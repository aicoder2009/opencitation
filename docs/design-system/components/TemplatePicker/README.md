A `[+] Templates` disclosure over the user's saved field presets.

Closed, it is a single bracketed link with the saved count in `wiki-text-muted` beside it. Open, it reveals a `wiki-border-light` box whose rows are separated by `wiki-border-light` dividers and scroll past 192px. Each row is a `wiki-link` name at `body-tight` weight 500 with the source type in `caption` parentheses, and a `[delete]` link at the right. With nothing saved, the box holds one centred `wiki-text-muted` line.

**You provide** `onSelectTemplate` and, when you have just saved one, a changed `refreshKey` to re-read storage. The component reads and deletes templates itself through `src/lib/templates.ts`.

### Rules

- **Do** keep the toggle's label swapping between `[+] Templates` and `[-] Hide Templates`, so the bracket state reads as the control.
- **Do** confirm before deleting a template; the component does this already.
- **Don't** open it by default. It is a shortcut, not part of the form.
- **Don't** turn the row into a card. The divided list is the pattern for a saved-item list.
