The dialog pattern behind every focused task in the product: add a citation, share a list, scan a barcode.

An `overlay-scrim` covers the page at `z-overlay`; the dialog is `wiki-white` inside a `wiki-border-light` edge, `width-modal` (576px) with a 16px side margin, capped at `90vh` and column-flexed so only the body scrolls. `shadow-lg` is the one elevation here, and it is deliberate — a modal is the only thing allowed to float above the article.

Three regions, separated by `wiki-border-light` rules:

| Region | Padding | Holds |
|---|---|---|
| Header | 16px/20px | Title at `modal-heading`, and a `✕` close button in `wiki-text-muted` |
| Body | 20px, `overflow-y-auto` | Fields at `stack-field` rhythm |
| Footer | 12px/20px, `justify-between` | Secondary or destructive action left, primary right |

**You provide** the open state, the title, the body and the footer actions. Every modal must handle Escape, a visible close button with an `aria-label`, and `role="dialog"` with `aria-modal` and a labelled heading.

### Rules

- **Do** reserve modals for a task that needs the triggering page's context and the user's full attention.
- **Do** put the single primary action at the footer's right as a `primary` `WikiButton`, and cancel to its left.
- **Do** place a destructive action at the far left of the footer as a `default` button, never in the primary slot.
- **Don't** nest modals. Close one, open the next.
- **Don't** animate entry or exit.
- **Don't** let the whole dialog scroll; keep the header and footer pinned so the primary action stays reachable.
