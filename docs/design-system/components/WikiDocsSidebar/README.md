The documentation rail: two stacked bordered boxes of links, sticky beside the docs column.

`width-docs-sidebar` (176px), `sticky top-6`, `shrink-0`. Each box has a `wiki-tab-bg` header strip holding a `body-tight` bold title over a `wiki-border-light` rule, then `pad-list-x` / 4px link rows. The second box shares the first's bottom edge by setting `border-t-0`, so the two read as one ruled table rather than two cards.

**You provide** nothing; the component reads the active route and exports `DOCS_NAV` if you need the same list elsewhere.

### States

| State | Appearance |
|---|---|
| Link | `wiki-link`, underline on hover |
| Current page | `wiki-text` at weight 500 on `wiki-tab-bg`, not a link |
| External link | `wiki-link` with a trailing `↗` |

### Rules

- **Do** keep labels to two or three words, in sentence case.
- **Do** add a new page to `DOCS_NAV` rather than hand-writing a link.
- **Don't** nest a second level. If the list outgrows one screen, split it into another bordered box with its own header, the way Reference does.
- **Don't** use this rail outside `/docs`; the rest of the app is a single column.
