# Platforms

The same Next.js app renders in a browser tab, an installed PWA, an Electron window and on paper. Only one of those changes the design, and it is the paper.

## Print is a real theme

The `@media print` block in `globals.css` redefines the `wiki-*` tokens rather than patching individual rules, which is why `print` is a first-class theme in this system. Every surface flattens to white, every ink to black, `wiki-border-light` drops to `#888888` and links lose both their colour and their underline.

It also restructures the page:

- `header`, `footer`, `nav` and anything with `role="dialog"` or `aria-modal` are hidden.
- Bracketed inline actions inside `main` are hidden, since `[copy]` means nothing on paper.
- `main` expands to full width with no padding, so the 960px column does not waste a margin.
- `.citation-text`, `li` and `tr` get `break-inside: avoid`, so a citation never splits across pages.
- A link inside `.citation-text` prints its `href` after it in parentheses at 0.85em in `#444444`.

**When you add a component, check it prints.** If it is chrome, make sure one of the hidden selectors catches it. If it holds citation output, make sure it does not break across a page.

## PWA

Two utilities handle notched devices: `.safe-area-top` and `.safe-area-bottom`, which add `env(safe-area-inset-*)` padding. A bar fixed to an edge takes the matching class rather than a hard padding value.

`OfflineIndicator` is the sync surface, and it uses the same `wiki-offwhite` bar for every state — see its card for why there are no status hues. The Safari install banner sits at `z-install-banner` (9999), above everything including an open modal, on `wiki-tab-bg` with the app icon at 57px; its call to action is `wiki-link`, **not** iOS system blue.

`brand-blue` (`#3366cc`) appears only in the manifest's `theme_color` and the browser `theme-color` meta, with `badge-ground` (`#f9f9f9`) as `background_color`. Those two values paint the OS chrome around the app, never anything inside it.

## Electron

The desktop shell wraps the same app with no design overrides. There is no custom window chrome, no title-bar styling and no platform-conditional layout. Anything you build for the web is what desktop users get.

## Clerk

Clerk's injected sign-in and profile UI is overridden in `globals.css` to hold the system's rules: `.cl-card` loses its radius and shadow and takes a `wiki-border` edge on `wiki-white` in Arial, and `.cl-formButtonPrimary` becomes a `wiki-tab-bg` fill with a `wiki-border` edge and `wiki-text` label — the closest a third-party primary button gets to a `WikiButton`. Dark-mode overrides restate the heading, label, footer and social-button inks from the tokens.

If you add a Clerk component, add its override in the same block. An un-overridden Clerk element announces itself immediately: it will be the only rounded thing on the screen.

## Embeds

`/api/badge` renders a 150 × 26 SVG for embedding on other people's sites, and it is the one surface that cannot follow a viewer's theme. It is fixed to `badge-ground` with a `badge-border` frame, the logo at 22px, `#202122` label text in Arial at 11px, and a `brand-blue` count chip. Because it renders outside the app, its values are authored directly in `public/badge.svg` rather than read from tokens; change one and change the other.
