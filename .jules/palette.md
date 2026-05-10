## 2026-05-10 - Missing ARIA Labels on Icon and Generic Buttons
**Learning:** Found multiple instances where interactive buttons used either ambiguous icons (like `&times;`) or generic link-style bracketed text (like `[edit]`, `[copy]`) without any screen-reader accessible context. This is a common pattern in the wiki-style UI components.
**Action:** Always add descriptive `aria-label` attributes to buttons that lack clear, unambiguous text content, specifically targeting icon-only close buttons and generic action links in lists to provide necessary context for assistive technologies.
