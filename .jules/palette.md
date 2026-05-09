## 2024-05-09 - Generic Visual Labels Need Contextual ARIA

**Learning:** When using generic visual text for buttons (like "[hide]" or "[show]" in custom collapsible widgets), screen reader users lack context on *what* is being hidden or shown, especially when navigating by controls. Also, for interactive toggle widgets, `aria-controls` mapped to a unique ID (via `useId`) and `aria-expanded` reflecting the current state are necessary so screen readers announce the element as a proper toggle.

**Action:** Always provide a contextual `aria-label` (e.g., `Hide ${title}`) on buttons with generic visual text, and ensure proper widget state attributes (`aria-expanded`, `aria-controls`) are mapped to a unique ID.
