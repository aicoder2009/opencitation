# Logos

The OpenCitation mark, copied from `public/` at `aicoder2009/opencitation@b69285b`. There is no SVG master and no wordmark lockup in the repository — the mark ships as PNG only, so scale from `logo-1024.png` rather than up from `logo.png`.

| File | Size | Where it is used |
|---|---|---|
| `logo.png` | 256 px square | The header wordmark in `WikiLayout`, rendered at 24 px, and the Safari install banner at 57 px |
| `logo-1024.png` | 1024 px square | The master raster: app packaging, store listings, anything above 256 px |
| `og-image.png` | 1200 × 630 | Open Graph and Twitter card image for shared pages |
| `badge.svg` | 150 × 26 | The embeddable "Cite with OpenCitation" badge served by `/api/badge` |

The stored `badge.svg` is **not byte-identical to the repository's**. In `public/badge.svg` the mark is inlined as a 22 px base64 PNG on an `<image xlink:href="data:image/png;base64,…">` element; this system's asset store strips data URIs out of SVG on upload, so the stored copy keeps the frame, the inner white square and the label but renders the mark as an empty `<image>` box. Take `logo.png` for the mark at higher fidelity, and treat `public/badge.svg` in the repository as the badge's source of truth.

## Rules

- The mark is a full-colour raster and carries its own ink. It is placed with `<img>`, so it does **not** inherit `currentColor` and does not change between themes.
- Pair it with the wordmark "OpenCitation" set in `sans` at weight 700 in `wiki-text`, at 8 px to its right. Never set the wordmark in another face.
- `badge.svg` is fixed to `badge-ground` with a `badge-border` frame and a `brand-blue` count chip, because it renders on other people's sites where no theme token exists. Do not make it theme-aware.
- Do not recolour, outline, rotate or add effects to the mark, and do not reconstruct it as vector art by hand — there is no vector source to match against.
