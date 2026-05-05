## 2025-02-12 - Added ARIA attributes to WikiCollapsible
**Learning:** Found an accessibility pattern for collapsible sections where the toggle button lacked explicit ARIA associations (`aria-expanded`, `aria-controls`) and contextually meaningful labels (relied on generic `[show]`/`[hide]` text).
**Action:** Used `useId()` to generate a unique control ID linking the button to the content `div`, and composed an `aria-label` combining the toggle state with the section `title` to provide full context to screen readers.
