# Sharing & Export

Share a read-only link, download in three formats, or embed a badge on any site.

## Public share links

Any List or Project can be shared via a public link. The recipient does not need an OpenCitation account to view it.

### Creating a share link

Open a List or Project and click **Share**. A unique link is generated at `/share/[code]`. Anyone with the link can view the citations but cannot edit them.

### Expiry

Share links do not expire by default. You can revoke a link at any time from the Share dialog — this immediately invalidates the URL.

## Export formats

Export a List or Project from the options menu. Three formats are available:

| Format | Extension | Use with |
|---|---|---|
| Plain text | `.txt` | Copy into any document or email |
| BibTeX | `.bib` | LaTeX, Overleaf, Zotero, JabRef |
| RIS | `.ris` | Zotero, Mendeley, EndNote, RefWorks |

> **Note:** BibTeX and RIS exports include the raw field data for all citations — the export is not style-specific. The citation style only affects the plain-text and display output.

## Embed badge

For public research pages, course sites, or portfolios, you can embed a small badge that links to a shared List. The badge is served as an SVG image from `/api/badge/[code]` and can be included in any HTML or Markdown:

```html
<img src="https://opencitation.app/api/badge/[code]" alt="Citations" />
```

The badge shows the citation count and links back to the public share page.

## Copying individual citations

On the citation page or inside a List, click `[copy]` next to any citation to copy it to your clipboard in the currently selected style. The keyboard shortcut `C` copies the selected citation in list view.
