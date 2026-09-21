# Icons

There is **no icon library in this product**. The app's handful of glyphs are hand-written inline SVGs at 16–20 px that stroke or fill `currentColor`, so they take `wiki-text-muted` or `wiki-link` from whatever contains them. They live in the components that use them, not in a shared set: the 3 × 3 dot-grid drag handle in `SortableCitation`, the ring in `WikiSpinner`, a chevron in `OfflineIndicator`, the Safari share glyph in the install banner.

**Prefer text to an icon.** A row action is `[edit]`, a collapse toggle is `[hide]`, a breadcrumb separator is `>`. Where a character does the job, use the character: `▾` on a menu trigger, `✓` on a selected option, `↗` after an external link, `[×]` to dismiss. An icon-only control is allowed only for a close button, and it needs an `aria-label`.

The files in this group are the PWA launcher icons, not UI icons:

| File | Size | Where it is used |
|---|---|---|
| `icon-192.png` | 192 px | `public/manifest.json` — home-screen and launcher icon |
| `icon-512.png` | 512 px | `public/manifest.json` — splash screen and high-density launcher icon |

Both are the full-colour mark on its own ground and are rendered by the OS, so they do not follow the app's theme. Add a new size by exporting from `logo-1024.png` and registering it in the manifest.
