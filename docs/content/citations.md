# Generating Citations

Two paths: auto-fill from an identifier, or enter fields manually.

## Quick Add

Quick Add fetches metadata automatically. Paste any of the supported identifiers into the input and click **Generate**.

### Supported identifiers

| Type | Format | Data source |
|---|---|---|
| URL | Any `https://` address | OpenGraph / page metadata |
| DOI | `10.xxxx/xxxxx` | CrossRef |
| ISBN-10 / ISBN-13 | `0385533349` or `9780385533348` | Open Library, Google Books |
| PubMed ID | `PMID:12345678` or just the number | PubMed API |
| arXiv ID | `arXiv:2301.00001` or `2301.00001` | arXiv API |
| Wikipedia title | Paste the article title | Wikipedia API |

> **Tip:** OpenCitation auto-detects the identifier type — you don't need to select it manually. Just paste and generate.

### When auto-fill is incomplete

Metadata APIs sometimes return incomplete data — a missing publisher, wrong year, or no page numbers. Always review the filled fields before saving. You can edit any field directly in the form after lookup.

## Manual Entry

Switch to the **Manual** tab on the citation page. Select your source type first — the form shows only the fields relevant to that type. Required fields are marked.

### Common fields

| Field | Notes |
|---|---|
| Authors | Enter each author as `Last, First`. Separate multiple authors with a new line. |
| Title | Use the exact title. For articles, do not add quotes — the formatter does that. |
| Year | 4-digit publication year. |
| URL / DOI | Include for online sources so readers can verify access. |
| Access date | Required by some styles for web sources. Defaults to today. |
| Pages | Use `pp. 12–34` format or just `12–34`; the formatter normalizes it. |

## Citation Templates

The **Templates** button (top-right of the form) shows pre-filled examples for common sources — a journal article, a book, a news article, etc. Selecting a template populates the form so you can edit rather than type from scratch.

## Copying & Saving

Once generated, the formatted citation appears at the bottom. Click **Copy** to copy it to your clipboard. Click **Save to List** to persist it — you'll be prompted to choose or create a List.
