A month calendar for publication and access dates, which are never in the future.

The trigger is a compact bordered row (`px-2 py-1.5`) showing the formatted date or a `wiki-text-muted` placeholder. The calendar is `absolute z-datepicker` — above a dropdown, because both can open in the same form row — on `wiki-white` with `shadow-md`. Its header strip is `wiki-offwhite` with `wiki-link` arrows either side of the month at `body-tight` weight 600. Weekday initials are two letters at `caption` in `wiki-text-muted`; days are `size-day-cell` (32px) squares.

**You provide** `value` as an ISO date string (or `""`), an `onChange`, and optionally a `placeholder`. The component owns the view month, disables future days, and renders a `[clear]` link when a value is set.

### States

| Day state | Appearance |
|---|---|
| Rest | `wiki-text`, hover `wiki-tab-bg` |
| Today | `wiki-link` at weight 700 |
| Selected | `wiki-tab-bg` fill, `wiki-link` border, `wiki-link` label at weight 600 |
| Future | `wiki-text-muted` at `opacity-disabled`, `cursor-not-allowed` |

### Rules

- **Do** rely on the future-date block: an access date after today is always a mistake.
- **Do** give the trigger a visible label above it, like any other field.
- **Don't** widen a day cell past 32px; the grid is sized so a month fits the menu width.
- **Don't** add a year dropdown or a range mode. Citations need one date.
