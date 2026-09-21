A full-width bar that reports connection and sync state, expandable to a four-cell detail grid.

Fixed to the top or bottom at `z-overlay`, on `wiki-offwhite` between `wiki-border-light` rules, `pad-header-x` / `pad-list-y`. It holds a 20px inline SVG, a `body-tight` weight-500 status line with a `caption` sub-line, a `[sync now]` link and a chevron toggle. Expanded, a `wiki-border-light` top rule separates a two-column (four at `md`) grid of `caption` labels in `wiki-text-muted` over `body-tight` weight-500 values.

**You provide** `position` and `showSyncStatus`. The component subscribes to the sync manager and the PWA manager itself.

### No status colours

Offline, syncing and update-available all render on the same `wiki-offwhite` bar with the same ink. **State is carried by the icon, the words and the available action, never by hue** — there is no amber offline pill, no blue syncing pill, no green update pill. If you are adding a state here, add an icon and a sentence.

### Rules

- **Do** keep the bar quiet. It is a status line, not an alert.
- **Do** name the state in the user's terms: "Offline — changes are saved on this device."
- **Do** offer exactly one action per state: `[sync now]` when there is a queue, `[reload]` when an update is waiting.
- **Don't** show the bar when everything is online and settled.
- **Don't** let it cover a modal's footer buttons; it sits at `z-overlay` alongside them, so prefer `position="bottom"` on pages with dialogs.
