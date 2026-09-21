The trail from the root to the current page, with a literal `>` between items.

The whole nav is `caption`-adjacent `body-tight` in `wiki-text-muted`; links are `wiki-link` with `hover:underline`, and the last item is plain `wiki-text` and never a link. The separator is the text `>`, marked `aria-hidden`, not a chevron icon — an icon here would be the first of many.

**You provide** `items` as `{ label, href? }` in root-to-leaf order. The component marks up an ordered list inside `<nav aria-label="Breadcrumb">`, wraps on narrow screens, and renders the final item as text whether or not you pass an `href`.

### Rules

- **Do** show breadcrumbs on every nested page: Project → List → Citation.
- **Do** use the container's real name as the label, not its type.
- **Don't** show them on a top-level page such as Home or the Projects root.
- **Don't** put the current page's own `href` to work as a link; it is the destination.
