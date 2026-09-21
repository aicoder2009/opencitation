A styled listbox for choosing one value, for the places a native `<select>` cannot be themed.

The trigger is a full-width bordered row at `pad-list-y` / `pad-list-x` with the label on the left and a `▾` caret in `wiki-text-muted` on the right; the placeholder sits in `wiki-text-muted` until a value is chosen. The listbox drops directly under it, full trigger width, on `wiki-white` with `shadow-md` at `z-dropdown`, scrolling past `height-menu-max` (240px). The selected option is `wiki-tab-bg` with a `wiki-link` label at weight 500 and a trailing `✓`.

**You provide** `value`, `onChange`, `options`, and an `aria-label` or `aria-labelledby` whenever no visible label is tied to the trigger. The component owns open state, outside-click dismissal, and Up/Down/Home/End/Enter/Escape handling with `role="listbox"` and `aria-selected`.

### Rules

- **Do** reach for the native `<select>` first. Use this when the list needs the system's own styling inside a dense row, or when the trigger must show more than the raw value.
- **Do** keep option labels short enough not to wrap; the listbox matches the trigger's width.
- **Don't** use it to run an action — that is `WikiDropdown`.
- **Don't** leave it unlabelled. A trigger with no associated label needs `aria-label`.
