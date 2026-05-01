## 2026-05-01 - Add context to interactive widgets lacking descriptive labels
**Learning:** Generic visual labels like `[hide]` or `[show]` on interactive widgets lack context for screen reader users when they navigate out of the visual flow. Relying purely on visual layout for context is a common accessibility trap.
**Action:** Always provide a contextual `aria-label` (e.g., `"Hide [Section Title]"`) when the visual text of a button is ambiguous or repetitive. Additionally, use `useId` to reliably map `aria-controls` to the content `id` avoiding collisions.
