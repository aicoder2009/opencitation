OpenCitation is a citation manager dressed as a 2005 Wikipedia article. The whole system follows from that: content is the interface, chrome is subtracted until only borders remain, and anything you can click looks like a link. Build in this idiom and a new screen looks like it was always there. Reach for a modern default — a rounded card, a filled button, a shadow — and it reads as a foreign object.

## Content fundamentals

Write like a reference work, not a product tour. Plain declaratives, present tense, no exclamation marks, no emoji anywhere in the interface.

- **Sentence case everything.** Page titles, buttons, labels, menu items, tab names. "Add citation", not "Add Citation". The only uppercase is the `eyebrow` style on group headings inside menus.
- **Name the user's things, not the machinery.** People keep *lists* inside *projects*; they *cite* a source. They do not manage records or invoke providers.
- **A control says what happens.** `Export`, `Copy`, `Save template`, `Sign out`. Footer copy states a fact: "OpenCitation is a free citation manager."
- **Inline actions are bracketed lowercase verbs**, exactly as a wiki renders them: `[copy]`, `[edit]`, `[delete]`, `[hide]`, `[show]`, `[dismiss]`, `[+] Templates`. Keep them lowercase inside the brackets and set them in `wiki-link` at `caption` or `body-tight`.
- **Empty states are one muted sentence**, centred, in `wiki-text-muted` at `caption` or `body-tight`: "No saved templates yet. Create one to quickly reuse source configurations." No illustration, no headline.
- **Errors explain and instruct** in the same voice: what failed, what to do. They never get a red fill; put them in a `WikiNotice` with `variant="warn"`.
- **Abbreviations get a real `<abbr title>`.** It renders with a dotted underline and a help cursor, which is the wiki convention and costs nothing.

## Visual foundations

### Colour

Nine tokens carry the entire interface. Use them and nothing else.

- Surfaces stack `wiki-white` → `wiki-offwhite` → `wiki-tab-bg`, lightest to most recessed. A page and a card are both `wiki-white`; a card *header* or an inactive tab is `wiki-tab-bg`; a fill that holds output or a notice is `wiki-offwhite`.
- Dividers are `wiki-border-light` by default. Spend `wiki-border` on the three strong edges only: under the app header, around a toast, and as the warn notice's left rule.
- Text is `wiki-text`; anything secondary is `wiki-text-muted`. There is no third text colour.
- **`wiki-link` is the only interactive colour.** Links, primary button text, tab labels, bracketed actions, a selected card's border, the caret, the text selection highlight. If something responds to a click and is not a button, set it in `wiki-link` with `hover:underline`.
- **Never introduce a state hue.** There is no green success, no red error, no amber warning anywhere in the product. Status is carried by words, weight and border width. `wiki-link-active` (`#ba0000`) is a press state on a prose link, not an error colour.
- `brand-blue` (`#3366cc`) is identity only: the PWA theme colour and the embeddable badge. Never paint in-app UI with it.
- The ten tag slots are the one saturated palette. Never hardcode one — read it from `src/lib/tag-colors.ts`, which hashes the tag name to a slot, or from a user override set in `TagColorPicker`.

### Themes

Three: `light`, `dark`, `print`. Dark is a semantic inversion, not a hue shift — `wiki-white` becomes `#101418`, borders lighten, link blue moves to `#88a4d8`. Print is a real third theme, declared in the `@media print` block: every surface flattens to white, every ink to black, links lose their colour and their underline, and app chrome is hidden so a page prints as a works-cited sheet. Author a new component so all three work; the one thing that changes in print is that interactive affordances disappear.

### Typography

Two families, no web fonts, nothing to download.

- `sans` (`Arial, Helvetica, sans-serif`) for every piece of interface text.
- `mono` (`"Courier New", Courier, monospace`) for formatted citation output only, via the `.citation-text` class, plus `<kbd>` keys and code in documentation. Monospace is what makes a hanging indent and a trailing period countable, which is the product's job.

Set running copy in `body` (14px/1.6, on `body` in `globals.css`). **Never raise the base size** — the compact density is the design. The scale tops out at `page-title` (24px); there is no display tier. Note that Tailwind's steps are rem-based off a 16px root while body copy is 14px, so `text-sm` is 14px and `text-base` is 16px: use `body-tight` for control text and `modal-heading` for dialog titles rather than assuming the class names track the 14px base.

### Space, borders and elevation

- Layout is one centred 960px column with a 16px gutter: `max-w-[960px] mx-auto px-4`. No sidebar, except the 176px documentation rail.
- Space on the 4px step scale: `gap-default` (8px) between sibling controls, `stack-field` (16px) between form fields, `pad-card` (16px) in a card body, `pad-header-x`/`pad-header-y` (16/12px) on a bar.
- **No `border-radius`, anywhere.** `radius-none` is the only radius token. Buttons, inputs, cards, modals, avatars, tags, menus: all square. Clerk's injected UI is overridden to 0 in `globals.css` to keep the rule intact.
- **No shadows by default.** Depth is 1px borders plus surface contrast. Spend `shadow-md` on a floating menu, `shadow-lg` on a modal or a dragging card, and nothing else.
- Mobile-first: base styles are the narrow layout, `sm:` and `md:` add the desktop one. The desktop nav hides below `sm`; a hamburger panel takes over.

### States

- **Hover** on a filled control: move to `wiki-tab-bg`. On a link: underline. Never both, never a transform.
- **Active/pressed** on a button: `wiki-border-light` fill.
- **Focus** is a 1px dotted `wiki-text` outline at 2px offset, on `:focus-visible`. It is Wikipedia's own focus style and it is on every interactive element. **Never remove it** and never replace it with a solid ring.
- **Selected** is a `wiki-link` border, widened to `border-selected` (2px) on a citation card. Not a fill.
- **Disabled** is `opacity-disabled` (0.5) plus `cursor-not-allowed`, with hover locked to the resting fill.
- **Current page** in a nav or sidebar is `wiki-text` at `label` weight on `wiki-tab-bg`, and is not a link.

### Motion

`transition-colors` and nothing else. No transforms, no opacity transitions on hover, no entrance or exit animation — modals and menus appear and vanish. Loading is `animate-spin` on the inline `WikiSpinner` SVG; there are no skeletons or shimmer, which would contradict a flat surface. `globals.css` honours `prefers-reduced-motion` by collapsing every duration to 0.01ms, so do not add motion that carries meaning.

### Imagery

There is almost none, and that is deliberate. The product ships one mark (see Iconography) and no photography, no illustration, no stock art. The barnstar award medal is the single decorative graphic and the single gradient in the system; treat it as a one-off, not a licence to add more.

## Iconography

There is no icon library and no icon font. Icons are hand-written inline SVGs at 16–20px that inherit `currentColor`, so they take `wiki-text-muted` or `wiki-link` from their context. There are only a handful: the 3×3 dot grid drag handle, the spinner, a chevron, the Safari share glyph.

**Prefer text to an icon.** A row action is `[edit]`, not a pencil; a collapse toggle is `[hide]`, not a caret; a breadcrumb separator is a literal `>`, not a chevron. An icon-only control is allowed only for a close button, and it must carry an `aria-label`. Where a glyph does the job, use the character — `▾` on a menu trigger, `✓` on a selected option, `↗` after an external link, `⠿`-style dots on a drag handle, `[×]` to dismiss.

## Building on this system

Components in this system ship as static renditions: each preview is plain markup styled by `components/bundle.css`, which restates in CSS the utility combinations the React components produce. There is no runnable bundle — the product's components are Next.js client components compiled by Tailwind, so the React source in the repository is the only executable form. Use a card's preview to see the visual contract and its README for the props and rules, then build with the tokens.
