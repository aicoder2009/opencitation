## 2024-05-18 - Added ARIA attributes to WikiCollapsible
**Learning:** Found that custom toggle elements in this project (like WikiCollapsible) might lack basic ARIA attributes (aria-expanded, aria-controls, aria-label) preventing screen readers from understanding their state or purpose.
**Action:** Always check custom collapsible/accordion components for `aria-expanded` tied to their open state, an `id` on the content container, `aria-controls` pointing to that id on the trigger, and a descriptive `aria-label` if the text isn't explicit enough (e.g. `[show]` instead of `Show Title`).
