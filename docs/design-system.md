# OpenCitation Design System

> **Status:** Stable · **Version:** 1.0 · **Last updated:** 2025-05

OpenCitation follows a deliberate early-2000s Wikipedia aesthetic — flat, information-dense, and utilitarian. Every decision in the design system serves that intent: no border-radius, no drop shadows by default, serif-adjacent sans-serif body text, and Wikipedia's signature blue as the sole interactive color.

---

## Contents

1. [Principles](#principles)
2. [Foundations](#foundations)
   - [Color](#color)
   - [Typography](#typography)
   - [Spacing](#spacing)
   - [Grid & Layout](#grid--layout)
   - [Elevation & Borders](#elevation--borders)
   - [Motion](#motion)
   - [Accessibility](#accessibility)
3. [Components](#components)
   - [Button](#button)
   - [Tabs](#tabs)
   - [Dropdown](#dropdown)
   - [Collapsible](#collapsible)
   - [Breadcrumbs](#breadcrumbs)
   - [User Menu](#user-menu)
   - [Modal / Dialog](#modal--dialog)
   - [Citation Card](#citation-card)
   - [Tag](#tag)
   - [Form Fields](#form-fields)
4. [Patterns](#patterns)
   - [Navigation Layout](#navigation-layout)
   - [Empty States](#empty-states)
   - [Loading States](#loading-states)
   - [Drag & Drop](#drag--drop)
5. [Platform Considerations](#platform-considerations)

---

## Principles

### 1. Information before chrome
Content is the UI. Decorative elements — shadows, gradients, rounded corners — are removed when they add visual weight without adding meaning.

### 2. Flat over layered
A single surface layer is used throughout. Elevation is expressed only through borders, not shadows. Modals use `shadow-lg` as a deliberate exception to lift them above the page.

### 3. Links do things
All interactive affordances use Wikipedia blue (`#0645ad`). If something is clickable but not a button, it should still look like a link. Buttons are for form-submission-level actions; text links handle everything else.

### 4. Dark mode as a first-class inversion
The dark theme is a direct semantic inversion — `wiki-white` becomes near-black, borders lighten, link blue shifts to `#88a4d8`. No hue shifts; only lightness adjusts.

### 5. No magic numbers
All color, spacing, and typography values are tokenized in CSS custom properties. Nothing is hard-coded in Tailwind's arbitrary value syntax except where the token system is intentionally bypassed for platform-specific values (safe-area insets, Apple blue).

---

## Foundations

### Color

The color system has two tiers: **semantic tokens** (used in components) and **raw palette values** (only appear inside `globals.css`). Components always reference tokens.

#### Semantic tokens

| Token | Light | Dark | Role |
|---|---|---|---|
| `--color-wiki-white` | `#ffffff` | `#101418` | Primary surface (page, card, input backgrounds) |
| `--color-wiki-offwhite` | `#f8f8f8` | `#202122` | Secondary surface (section backgrounds, code blocks) |
| `--color-wiki-tab-bg` | `#f0f0f0` | `#27292d` | Tab backgrounds, button hover states, drag handles |
| `--color-wiki-border` | `#aaaaaa` | `#72777d` | Strong borders (header divider, modal outer edge) |
| `--color-wiki-border-light` | `#cccccc` | `#54595d` | Subtle borders (cards, form fields, dropdown separators) |
| `--color-wiki-text` | `#202122` | `#eaecf0` | Primary text, headings, labels |
| `--color-wiki-text-muted` | `#54595d` | `#a2a9b1` | Secondary text, placeholders, captions, breadcrumb separators |
| `--color-wiki-link` | `#0645ad` | `#88a4d8` | All interactive elements, links, primary button text |
| `--color-wiki-link-hover` | `#0b3d91` | `#a3b8e5` | Hovered links |
| `--color-wiki-link-visited` | `#0b0080` | `#b18fcf` | Visited hyperlinks |
| `--color-wiki-link-active` | `#ba0000` | `#f87171` | Active/pressed links |

#### Tailwind utility mapping

Tokens are consumed in Tailwind via named utilities:

```
bg-wiki-white          → var(--color-wiki-white)
bg-wiki-offwhite       → var(--color-wiki-offwhite)
bg-wiki-tab-bg         → var(--color-wiki-tab-bg)
border-wiki-border     → var(--color-wiki-border)
border-wiki-border-light → var(--color-wiki-border-light)
text-wiki-text         → var(--color-wiki-text)
text-wiki-text-muted   → var(--color-wiki-text-muted)
text-wiki-link         → var(--color-wiki-link)
```

#### Tag color palette

Tags use a 10-step palette with automatic color assignment (hash of tag name → index). Each step defines background, text, and border for both light and dark modes.

| Index | Name | Light bg | Light text | Dark bg | Dark text |
|---|---|---|---|---|---|
| 0 | gray | `gray-100` | `gray-700` | `gray-800` | `gray-200` |
| 1 | red | `red-100` | `red-700` | `red-950` | `red-300` |
| 2 | orange | `orange-100` | `orange-700` | `orange-950` | `orange-300` |
| 3 | yellow | `yellow-100` | `yellow-700` | `yellow-950` | `yellow-300` |
| 4 | green | `green-100` | `green-700` | `green-950` | `green-300` |
| 5 | teal | `teal-100` | `teal-700` | `teal-950` | `teal-300` |
| 6 | blue | `blue-100` | `blue-700` | `blue-950` | `blue-300` |
| 7 | indigo | `indigo-100` | `indigo-700` | `indigo-950` | `indigo-300` |
| 8 | purple | `purple-100` | `purple-700` | `purple-950` | `purple-300` |
| 9 | pink | `pink-100` | `pink-700` | `pink-950` | `pink-300` |

Manual override is available via `TagColorPicker`.

#### Status-specific colors (PWA/system)

These are outside the semantic token system and used only for system-level feedback:

| Use | Color |
|---|---|
| Offline indicator | `bg-amber-500` |
| Syncing indicator | `bg-blue-500` |
| Update available | `bg-green-600` |
| Apple install CTA | `#007AFF` |
| Wikipedia-blue CTA | `#3366cc` / hover `#2a4b8d` |

---

### Typography

The font stack intentionally references 2005-era system fonts. No web font is loaded; the system sans-serif resolves to Arial on most platforms.

#### Font families

| Token | Stack | Use |
|---|---|---|
| `--font-sans` | `Arial, Helvetica, sans-serif` | All body text, UI labels, headings |
| `--font-mono` | `"Courier New", Courier, monospace` | Formatted citation output (`.citation-text`) |

#### Base settings

```css
body {
  font-family: var(--font-sans);
  font-size: 14px;
  line-height: 1.6;
  color: var(--color-wiki-text);
}
```

#### Scale

| Role | Tailwind classes | Computed size |
|---|---|---|
| Page title | `text-2xl font-bold` | 24px / 700 |
| Section heading | `text-lg font-semibold` | 18px / 600 |
| Modal heading | `font-bold text-base` | 14px / 700 |
| Body | *(base)* | 14px / 400 |
| Label / caption | `text-sm` | 12px / 400 |
| Citation output | `.citation-text` (13px mono) | 13px / 400 |
| Tag label | `text-xs` | 10–11px / 400 |

There is no display/hero type scale. The 14px base size is intentional — it matches Wikipedia's compact information density.

---

### Spacing

Spacing is defined as CSS custom properties but consumed primarily via Tailwind's default scale.

#### Spacing tokens

| Token | Value | Semantic use |
|---|---|---|
| `--spacing-section` | `32px` | Between page-level sections |
| `--spacing-card` | `24px` | Inside card/panel padding |
| `--spacing-paragraph` | `16px` | Vertical rhythm between paragraphs |
| `--spacing-field` | `20px` | Between form fields |
| `--spacing-button` | `12px` | Button vertical padding |

#### Common usage patterns

| Context | Classes |
|---|---|
| Button (small) | `px-2 py-1` |
| Button (default) | `px-4 py-2` |
| Card body | `p-4` or `p-5` |
| Header bar | `px-4 py-3` |
| List items | `px-3 py-2` |
| Inline gap (tight) | `gap-1` or `gap-1.5` |
| Inline gap (loose) | `gap-2` or `gap-3` |
| Section gap | `gap-4` or `space-y-4` |

---

### Grid & Layout

#### Container

```
max-width: 960px   (--width-container)
content-width: 800px  (--width-content)
margin: 0 auto
padding: 0 16px (px-4)
```

The single-column, centered layout mirrors Wikipedia's default reading column. No sidebar in the current implementation.

#### Page structure

```
<header>   border-b border-wiki-border · bg-wiki-white
  <nav>    max-w-[960px] mx-auto px-4 py-3
<main>     max-w-[960px] mx-auto px-4 py-6
<footer>   border-t border-wiki-border-light · mt-12
           max-w-[960px] mx-auto px-4 py-6
           text-sm text-wiki-text-muted
```

#### Responsive behavior

| Breakpoint | Behavior |
|---|---|
| `< 640px` (mobile) | Single-column stacks; desktop nav hidden; mobile menu shown |
| `≥ 640px` (sm) | Side-by-side flex layouts enabled; desktop nav visible |
| `≥ 768px` (md) | Grid layouts for citation/form columns |

Mobile-first: all base styles are mobile; `sm:` and `md:` prefixes add desktop behavior.

---

### Elevation & Borders

OpenCitation is a **flat-first** system. Depth hierarchy is communicated entirely through borders, background contrast, and one deliberate shadow tier.

| Tier | Usage | Implementation |
|---|---|---|
| **Surface** | Pages, cards, inputs | `border border-wiki-border-light` + `bg-wiki-white` |
| **Recessed** | Tab backgrounds, section fills | `bg-wiki-tab-bg` or `bg-wiki-offwhite` |
| **Lifted** | Dropdowns, tooltips | `border border-wiki-border-light shadow-md` |
| **Modal** | Overlay dialogs | `border border-wiki-border-light shadow-lg` |
| **Drag ghost** | Active drag item | `shadow-lg` + `z-10` |

**Border radius is always 0.** The retro aesthetic prohibits rounding at every level.

---

### Motion

Motion is minimal by design — the 2005 Wikipedia aesthetic has no animations except for functional feedback.

| Pattern | Implementation | Use |
|---|---|---|
| Color transition | `transition-colors` (200ms ease) | Button/link hover, tab switching |
| Theme transition | `transition: background-color 0.2s ease, color 0.2s ease` | Dark mode toggle on `body` |
| Spinner | `animate-spin` | Loading states on icons |
| Drag opacity | `opacity: 0.5` (via dnd-kit) | Source item while dragging |

No entrance/exit animations exist for modals or dropdowns — they appear and disappear instantly.

---

### Accessibility

| Concern | Implementation |
|---|---|
| Focus indicator | `outline: 1px dotted var(--color-wiki-text)` via `:focus-visible` |
| Focus in Tailwind | `focus-visible:outline-dotted focus-visible:outline-1 focus-visible:outline-wiki-text` |
| Disabled state | `opacity-50 cursor-not-allowed` + pointer-events disabled |
| Keyboard navigation | Tab order follows DOM order; dropdowns close on `Escape` |
| Screen readers | `aria-label`, `aria-expanded`, `aria-haspopup` on interactive controls |
| Color contrast | Text `#202122` on `#ffffff` → 16.1:1 (AAA) · Muted `#54595d` on `#ffffff` → 7.1:1 (AA) |

The dotted outline is a deliberate nod to Wikipedia's own focus style and should never be removed.

---

## Components

---

### Button

**Status:** Stable · **File:** `src/components/wiki/WikiButton.tsx`

#### Anatomy

```
┌───────────────────────────────┐
│  [icon?]  Label               │  ← border-wiki-border-light
└───────────────────────────────┘
   ↑ px-4 py-2 text-sm
```

#### Variants

| Variant | Appearance | Use |
|---|---|---|
| `default` | White bg · wiki-text · border | Secondary actions, cancel |
| `primary` | White bg · **wiki-link text** · border | Primary actions, submit |

Both variants share the same border and shape — the only difference is text color. This is intentional: there is no filled/solid button style.

#### States

| State | Style |
|---|---|
| Default | `bg-wiki-white text-wiki-text border-wiki-border-light` |
| Hover | `bg-wiki-tab-bg` |
| Active/pressed | `bg-wiki-border-light` |
| Focus | `outline-dotted outline-1 outline-wiki-text` |
| Disabled | `opacity-50 cursor-not-allowed` · hover locked to default bg |

#### Usage

**Do:** Use `primary` for the single most important action per surface.  
**Do:** Use `default` for all supporting actions (cancel, back, secondary exports).  
**Don't:** Stack two `primary` buttons side by side.  
**Don't:** Add icons without an accompanying label (except icon-only close buttons, which must have `aria-label`).

---

### Tabs

**Status:** Stable · **File:** `src/components/wiki/WikiTabs.tsx`

#### Anatomy

```
┌──────────┬──────────┬──────────┐
│  Tab 1   │  Tab 2   │  Tab 3   │   ← border-b border-wiki-border-light
└──────────┴──────────┴──────────┴───────────────────────────────────────
  Active tab: bg-wiki-white, text-wiki-text, font-medium
  Inactive:   bg-wiki-tab-bg, text-wiki-link
```

The active tab sits on the border by using `-mb-px` to collapse the bottom border, creating the classic Wikipedia tab connection illusion.

#### States

| State | Classes |
|---|---|
| Inactive | `bg-wiki-tab-bg border-transparent text-wiki-link hover:bg-wiki-offwhite` |
| Active | `bg-wiki-white border-wiki-border-light text-wiki-text font-medium border-b-wiki-white` |

#### Usage

**Do:** Use tabs to switch between views of the same underlying data.  
**Don't:** Use tabs for navigation between distinct pages (use breadcrumbs + links instead).  
**Don't:** Exceed 5 tabs — the tab bar has no overflow handling.

---

### Dropdown

**Status:** Stable · **File:** `src/components/wiki/WikiDropdown.tsx`

#### Anatomy

```
┌────────────────────────┐
│  Label          ▾      │  ← trigger button
└────────────────────────┘
┌────────────────────────┐
│  Option A              │  ← menu (absolute, z-20)
│  Option B              │
│  ─────────────────     │  ← optional divider (border-t border-wiki-border-light)
│  Option C              │
└────────────────────────┘
```

Menu: `absolute z-20 mt-1 min-w-[200px] bg-wiki-white border border-wiki-border-light shadow-md`

#### States

| State | Style |
|---|---|
| Trigger default | `bg-wiki-white border-wiki-border-light` |
| Trigger hover | `bg-wiki-tab-bg` |
| Trigger disabled | `opacity-50 cursor-not-allowed` |
| Menu item hover | `bg-wiki-tab-bg` |

Dropdown closes on outside click and `Escape`.

---

### Collapsible

**Status:** Stable · **File:** `src/components/wiki/WikiCollapsible.tsx`

#### Anatomy

```
┌─────────────────────────────────────┐
│  Section Title              [hide]  │  ← header · bg-wiki-tab-bg
├─────────────────────────────────────┤
│                                     │
│  Content                            │  ← px-4 py-3
│                                     │
└─────────────────────────────────────┘
```

Toggle label: `[hide]` when expanded, `[show]` when collapsed. Toggle is `text-wiki-link text-sm hover:underline`.

#### Usage

**Do:** Use for supplementary information that clutters a page when always visible (e.g., citation metadata, advanced filters).  
**Don't:** Put primary user actions inside a collapsed section.

---

### Breadcrumbs

**Status:** Stable · **File:** `src/components/wiki/WikiBreadcrumbs.tsx`

#### Anatomy

```
Home > Projects > My Research > List Name
```

- Container: `text-sm text-wiki-text-muted`
- Separator: `" > "` (plain text, not an icon)
- Links: `text-wiki-link hover:underline`
- Current page: `text-wiki-text` (non-link)

#### Usage

**Do:** Show breadcrumbs on all nested pages (Project → List → Citation).  
**Don't:** Show breadcrumbs on top-level pages (Home, Projects root).

---

### User Menu

**Status:** Stable · **File:** `src/components/wiki/WikiUserMenu.tsx`

#### Anatomy

```
  ┌────┐
  │ KA │  ← Avatar: 32px circle · bg-wiki-tab-bg · text-xs font-bold
  └────┘
       ↓ (click)
  ┌──────────────────┐
  │ Karthick Arun    │  ← px-3 py-2 · border-b
  │ karthick@...     │  ← text-xs text-wiki-text-muted
  ├──────────────────┤
  │ [Profile]        │  ← text-wiki-link · hover:bg-wiki-offwhite hover:underline
  │ [Settings]       │
  │ [Sign out]       │
  └──────────────────┘
```

Menu: `absolute right-0 top-full mt-1 w-48 bg-wiki-white border border-wiki-border z-50`

When a Clerk avatar image is available, it replaces the initials fallback at the same 32px size.

---

### Modal / Dialog

**Status:** Stable · **Examples:** `CitationAddModal`, `ShareDialog`, `BarcodeScanner`

#### Anatomy

```
┌─ Overlay: fixed inset-0 bg-black/50 ──────────────┐
│                                                     │
│  ┌─ Dialog ─────────────────────────────────────┐  │
│  │ Title                                    ✕   │  │  ← px-5 py-4 border-b
│  ├──────────────────────────────────────────────┤  │
│  │                                              │  │
│  │  Content (scrollable)                        │  │  ← p-5 overflow-y-auto
│  │                                              │  │
│  ├──────────────────────────────────────────────┤  │
│  │  [Secondary action]          [Primary action]│  │  ← px-5 py-3 border-t
│  └──────────────────────────────────────────────┘  │
│                                                     │
└─────────────────────────────────────────────────────┘
```

Dialog: `bg-wiki-white border border-wiki-border-light w-full max-w-xl mx-4 shadow-lg max-h-[90vh] flex flex-col`

Close button: `text-wiki-text-muted hover:text-wiki-text text-lg leading-none` (aria-label required).

#### Usage

**Do:** Limit modals to actions that need focused attention with context from the triggering page.  
**Do:** Always provide a close button and allow `Escape` to dismiss.  
**Don't:** Nest modals.  
**Don't:** Put destructive actions (delete) as the primary button — place them left-aligned in the footer.

---

### Citation Card

**Status:** Stable · **File:** `src/components/wiki/SortableCitation.tsx`

The core data unit of the application. Every citation renders as a card.

#### Anatomy

```
┌──────────────────────────────────────────────────────┐
│  ⠿  ☐  [Website]  [APA]  [Print]  ·  tag1  tag2   ✎ │  ← header · bg-wiki-tab-bg · p-3
├──────────────────────────────────────────────────────┤
│                                                      │
│  Formatted citation text in monospace...             │  ← .citation-text · p-4
│                                                      │
│  [copy]  [edit]  [delete]                            │  ← text-wiki-link text-sm hover:underline
└──────────────────────────────────────────────────────┘
```

#### States

| State | Border | Ring |
|---|---|---|
| Default | `border-wiki-border-light` | none |
| Selected | `border-wiki-link` | `ring-2 ring-wiki-link/20` |
| Dragging | `border-wiki-border-light shadow-lg` | none · `z-10` |

#### Header elements (left to right)

1. **Drag handle** — `cursor-grab active:cursor-grabbing` · `hover:bg-wiki-border-light rounded`
2. **Checkbox** — for multi-select operations
3. **Source type badge** — `border` + source-type-specific color
4. **Style badge** — `text-xs border border-wiki-border-light`
5. **Access type badge** — same style as style badge
6. **Tags** — `inline-flex items-center gap-1 px-2 py-0.5 text-xs border` + tag color classes
7. **Edit icon** — right-aligned

#### Inline actions

All inline actions use the link pattern: `text-wiki-link text-sm hover:underline`, separated by spaces. Labels are bracketed: `[copy]`, `[edit]`, `[delete]`.

---

### Tag

**Status:** Stable · **File:** `src/lib/tag-colors.ts` + `SortableCitation.tsx`

#### Anatomy

```
┌─────────────────┐
│  ○  tag name  ✕ │   ← px-2 py-0.5 text-xs border + color classes
└─────────────────┘
```

Color is automatically assigned by hashing the tag name. Manual reassignment is available via `TagColorPicker`.

#### TagColorPicker

```
┌─ Picker: absolute z-20 p-3 bg-wiki-white border shadow-md w-64 ─┐
│  ● ● ● ● ●                                                       │  ← grid grid-cols-5 gap-1.5
│  ● ● ● ● ●                                                       │
│  Color name                                                       │
└───────────────────────────────────────────────────────────────────┘
```

Active color: `border-wiki-link`. Inactive: `border-transparent`.

---

### Form Fields

**Status:** Stable · **Context:** `src/app/cite/page.tsx`, modals

#### Input

```
┌──────────────────────────────────┐
│  Placeholder / value             │  ← border-wiki-border-light · p-3 (12px)
└──────────────────────────────────┘
```

| State | Border | Outline |
|---|---|---|
| Default | `border-wiki-border-light` | none |
| Focus | `border-wiki-link` | `outline: none` |
| Error | `border-red-500` | none |

Dark mode: `bg-wiki-offwhite border-wiki-border-light text-wiki-text`

#### Select

Inherits input styles. Uses native `<select>` — no custom dropdown to maintain OS-level accessibility.

#### Label

`text-sm font-medium text-wiki-text` — always above the field, never floating/placeholder-replacing.

#### Field spacing

`--spacing-field: 20px` between consecutive fields. Applied as `space-y-4` in form containers.

---

## Patterns

---

### Navigation Layout

The `WikiLayout` component wraps every authenticated page.

```
┌──────────────────────────────────────────────────────┐
│  HEADER  border-b border-wiki-border                 │
│  ┌──────────────────────────────────────────────┐    │
│  │  Logo · Nav links · Dark mode toggle · User  │    │
│  └──────────────────────────────────────────────┘    │
├──────────────────────────────────────────────────────┤
│  MAIN  py-6                                          │
│  ┌──────────────────────────────────────────────┐    │
│  │  Page content                                │    │
│  └──────────────────────────────────────────────┘    │
├──────────────────────────────────────────────────────┤
│  FOOTER  border-t border-wiki-border-light mt-12     │
│  text-sm text-wiki-text-muted                        │
└──────────────────────────────────────────────────────┘
```

Nav links: `text-wiki-link text-sm hover:underline`. Hidden below `sm:` breakpoint (mobile hamburger not yet implemented — consider `WikiDropdown` as menu trigger).

---

### Empty States

No dedicated component exists yet. Current convention is inline text:

```
text-wiki-text-muted text-sm text-center py-8
"No citations yet. Add one to get started."
```

**Recommended pattern for future empty states:**

```
┌──────────────────────────────────────┐
│                                      │
│  [Icon placeholder or ASCII art]     │
│  Primary message (text-wiki-text)    │
│  Secondary hint (text-wiki-text-muted text-sm) │
│  [Primary action button]             │
│                                      │
└──────────────────────────────────────┘
```

---

### Loading States

Inline spinners only. No skeleton screens.

```jsx
<svg className="animate-spin h-4 w-4 text-wiki-text-muted" ... />
```

For page-level loading (server fetches), Next.js `loading.tsx` with a centered spinner is used. No shimmer/skeleton effects — they conflict with the flat aesthetic.

---

### Drag & Drop

Powered by `@dnd-kit`. The visual contract:

| Phase | Source card | Drag ghost |
|---|---|---|
| Idle | Normal | — |
| Dragging | `opacity-50` | Full opacity + `shadow-lg z-10` |
| Over valid drop | Reorder preview renders | Ghost tracks cursor |
| Drop | Optimistic reorder (IndexedDB first, DynamoDB after) | — |

Drag handles use `⠿` (braille pattern) as a visual affordance, consistent with Wikipedia's historically text-only approach to UI icons.

---

## Platform Considerations

### PWA

Safe-area utilities handle notched devices:

```css
.safe-area-bottom { padding-bottom: env(safe-area-inset-bottom, 0px); }
.safe-area-top    { padding-top:    env(safe-area-inset-top,    0px); }
```

**Offline indicator** (bottom-fixed pill):

| State | Color |
|---|---|
| Offline | `bg-amber-500` |
| Syncing | `bg-blue-500` |
| Update available | `bg-green-600` |

**Safari install banner:** Uses Apple-native blue (`#007AFF`), not `wiki-link`. This is the only deliberate brand-color exception — Apple users expect iOS blue for install prompts.

### Electron (Desktop)

The Electron shell wraps the same Next.js app unchanged. No design overrides are applied for the desktop window chrome.

### Clerk (Auth)

Clerk's default UI components are overridden in `globals.css` to match the Wikipedia aesthetic:

```css
.cl-card               { border-radius: 0; box-shadow: none; border: 1px solid var(--color-wiki-border); font-family: Arial; }
.cl-formButtonPrimary  { border-radius: 0; background: var(--color-wiki-tab-bg); border: 1px solid var(--color-wiki-border); color: var(--color-wiki-text); }
```

Dark mode overrides exist for headings, labels, and footer text within Clerk components.

---

## Component status key

| Badge | Meaning |
|---|---|
| **Stable** | Production-ready, API frozen |
| **Beta** | Functional but API may change |
| **Experimental** | Not for production use |
| **Deprecated** | Scheduled for removal |

All current components listed in this document are **Stable**.
