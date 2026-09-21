The page frame every authenticated screen sits in: header, one centred column, footer.

Three bands, each inset to `width-container` (960px) with a `pad-header-x` gutter. The header is the only place `wiki-border` appears as a horizontal rule — that strong bottom edge is what separates chrome from content. Main is `py-6`. The footer sits `footer-offset` (48px) below content behind a `wiki-border-light` rule, at `body-tight` in `wiki-text-muted`.

**You provide** the page content as children. The layout supplies the header bar, the wordmark and logo, nav links, the dark-mode toggle, `WikiUserMenu`, the mobile menu panel, the skip link target (`#main-content`), and mounts `WikiCommandPalette`.

### Anatomy

```
header   border-b wiki-border · wiki-white
  bar    max-w 960 · pad-header-x/pad-header-y · logo + wordmark | nav | theme | avatar
main     #main-content · max-w 960 · pad-header-x · py-6
footer   border-t wiki-border-light · footer-offset above · body-tight wiki-text-muted
```

### Rules

- **Do** put every page inside this component, so the column width and gutters stay identical across the app.
- **Do** keep nav links as plain `wiki-link` text at `body-tight` with `gap-nav` between them.
- **Don't** widen the column past 960px or add a second sidebar. The documentation rail (`WikiDocsSidebar`) is the one exception, and it lives inside main.
- **Don't** make the header sticky. It scrolls away like an article's title.
