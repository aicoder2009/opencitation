Wikipedia's article tabs: the active tab merges into the panel below it by painting over the strip's border.

The strip is a `wiki-border-light` bottom rule. Each tab is bordered on three sides with `margin-bottom: -1px` and `z-tab-active`, so the active tab's `wiki-white` bottom border covers the strip rule and the tab and panel read as one surface. That `-1px` trick is the whole component; do not replace it with a coloured underline.

**You provide** `tabs` as `{ id, label, active?, href? }` and an `onTabChange` handler. The component owns the roving tabindex and Left/Right arrow navigation, and sets `role="tablist"` / `role="tab"` with `aria-selected` and `aria-controls`.

### States

| State | Fill | Border | Label |
|---|---|---|---|
| Inactive | `wiki-tab-bg` | transparent | `wiki-link` |
| Inactive, hover | `wiki-offwhite` | transparent | `wiki-link` |
| Active | `wiki-white` | `wiki-border-light`, bottom `wiki-white` | `wiki-text` at weight 500 |

### Rules

- **Do** use tabs to switch between views of the same data: the cite page's Manual / Lookup / Import panels.
- **Do** render the panel directly under the strip with no gap, or the merge illusion breaks.
- **Don't** exceed five tabs — the strip has no overflow handling.
- **Don't** use tabs to navigate between pages. Use breadcrumbs and links.
