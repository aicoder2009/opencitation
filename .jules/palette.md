
## 2025-04-29 - Accessible Collapsibles with Unique IDs
**Learning:** For accessible React interactive widgets (like tabs or collapsibles), it's important to use React's `useId` hook to generate unique IDs for `aria-controls` mappings. This ensures correct screen reader context and prevents ID collisions when multiple instances of the widget are rendered on the same page.
**Action:** Always use `useId` for mapping `aria-controls` to the corresponding `id` of the controlled element in custom interactive components.
