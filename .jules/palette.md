
## 2025-02-18 - Improve WikiCollapsible Accessibility
**Learning:** Collapsible components without explicit `aria-expanded` and `aria-controls` attributes lack context for screen readers. Using `useId()` ensures unique IDs for `aria-controls` mapping. Providing contextual `aria-label`s like "Hide [Title]" or "Show [Title]" instead of generic visual text ensures screen reader users have proper context.
**Action:** Always provide `aria-expanded`, `aria-controls`, and descriptive `aria-label`s for custom interactive widgets like collapsibles and accordions.
