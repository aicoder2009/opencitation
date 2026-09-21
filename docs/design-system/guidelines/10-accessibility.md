# Accessibility

The product is audited against WCAG 2.1 Level AA, with axe-core running over the components in the test suite. These are the rules that keep it there.

## The focus ring is not negotiable

Every interactive element takes `outline: 1px dotted var(--wiki-text)` at `focus-offset` (2px) on `:focus-visible`, set globally in `globals.css` and repeated as a utility on each component. It is Wikipedia's own focus style, and it is the single most load-bearing accessibility decision in the system: there is no other visual signal that a keyboard user is somewhere.

- **Never** remove it, and never replace it with a solid ring, a shadow or a border change.
- Form fields suppress the dotted outline for **pointer** focus only (`:focus:not(:focus-visible)`), keeping it for keyboard focus. Their border still moves to `wiki-link` either way.
- Wrap a composite control in `.focus-within-ring` when the ring should surround the group rather than the inner field.

## Contrast

Every text token pair clears 4.5:1 on the surfaces its usage note names, in both the light and dark themes. The strong pairs: `wiki-text` on `wiki-white` is 16.1:1 in light and 13.9:1 in dark; `wiki-text-muted` on `wiki-white` is 7.4:1 and 7.3:1; `wiki-link` on `wiki-white` is 8.6:1 and 7.9:1.

Two things are **not** contrast-carrying and must never be asked to carry meaning alone:

- `wiki-border` is 2.3:1 on `wiki-white`. It divides; it does not signal. The warn notice pairs it with `role="alert"` and a 4px weight, not with colour.
- Tag palette slots are decorative. Their text-on-fill pairs clear 4.5:1 at `caption`, but the slot is assigned by hashing the tag's name, so **no slot means anything**. A tag must always be readable as its label.

## No colour-only state

The system has no success green, error red or warning amber, which removes a whole class of colour-blindness failure by construction. State is carried three ways, and a new state must use at least two of them:

1. **Words** — "Offline", "3 changes pending", "No matches."
2. **Weight or width** — a 4px left rule for warn against 2px for info; a 2px selected card border against 1px.
3. **Role** — `role="alert"` for something to act on, `role="status"` with `aria-live="polite"` for something to notice.

## Keyboard contracts

| Component | Contract |
|---|---|
| `WikiTabs` | `role="tablist"`, roving tabindex, Left/Right wrap through tabs |
| `WikiDropdown` | `aria-haspopup="menu"`, `aria-expanded`; Up/Down wrap, Home, End, Escape and Tab close and restore focus to the trigger |
| `WikiSelect` | `role="listbox"` with `aria-selected`; Up/Down/Home/End move, Enter and Space select, Escape closes |
| `WikiDatePicker` | future days are `disabled`, and each day's `aria-label` spells the full date plus "(selected)" or "(today)" |
| `Modal`, `ShortcutHelp`, `WikiCommandPalette` | `role="dialog"` with `aria-modal`, a labelled heading, a focus trap, Escape to dismiss, and focus restored to the trigger |
| `WikiUserMenu` | `aria-expanded`, outside click and Escape dismiss |
| `SortableCitation` | drag handle carries `aria-label="Drag to reorder"`; dnd-kit supplies keyboard reordering |

Tab order always follows DOM order. `WikiLayout` provides a skip link to `#main-content`.

## Labelling

- Every icon-only control needs an `aria-label`. This is allowed for a close button, a dismiss `[×]`, a drag handle and a chevron toggle, and nowhere else.
- A `WikiSelect` with no visible label needs `aria-label` or `aria-labelledby`; the prop types mark it required in that case.
- Decorative SVGs get `aria-hidden="true"`. The spinner's wrapper carries `role="status"` and `aria-label="Loading"` instead.
- Use a real `<abbr title>` for an abbreviation; `globals.css` gives it a dotted underline and a help cursor.

## Motion

`globals.css` collapses every animation and transition to 0.01ms under `prefers-reduced-motion: reduce`, and sets `scroll-behavior: auto`. Because of that, **no state may be communicated by motion alone** — the spinner is an indicator beside a sentence, never the sentence itself.
