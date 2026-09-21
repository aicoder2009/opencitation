A bordered trigger that opens a floating menu of actions, used for export and bulk operations.

The trigger is a `WikiButton` box with a `▾` glyph appended. The menu is `absolute`, `z-dropdown`, at least `width-menu-min` (200px) wide, on `wiki-white` inside a `wiki-border-light` edge with `shadow-md` — one of only four places in the system that carries a shadow.

**You provide** a `label`, an array of `{ label, onClick, hint? }` items, and optionally `align` and `disabled`. The component owns open state, outside-click and Escape dismissal, and full arrow-key navigation (Up/Down wrap, Home, End, Tab closes).

### Anatomy

- Trigger: `pad-button-y` / `pad-button-x`, `wiki-border-light`, hover `wiki-tab-bg`, active `wiki-border-light`.
- Menu item: `pad-list-y` / `pad-list-x`, label in `wiki-text`, hover `wiki-tab-bg`.
- `hint` renders right of the label at `caption` in `wiki-text-muted` — use it for a keyboard shortcut or a file extension, never for a second action.
- A divider between item groups is a `wiki-border-light` top rule.

### Rules

- **Do** put a short verb in the trigger label: `Export`, `Bulk actions`.
- **Do** set `align="right"` when the trigger sits at the right edge of a bar, so the menu does not overflow.
- **Don't** use this for choosing a value — that is `WikiSelect`. A dropdown's items run functions.
- **Don't** nest a submenu. Flatten, or open a modal.
