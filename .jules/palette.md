## 2024-05-19 - Accessible Collapsible Buttons
**Learning:** Generic interactive controls like "[hide]/[show]" buttons on collapsible widgets are ambiguous to screen readers since they provide no context on *what* is being hidden or shown.
**Action:** Use contextual `aria-label`s (e.g., "Hide [Title]") alongside proper `aria-expanded` and `aria-controls` mappings via `useId()` to ensure robust keyboard accessibility without ID collisions.
