## 2024-05-08 - Added Contextual ARIA labels to Generic Buttons
**Learning:** Found that generic visual button text like "[hide]" or "[show]" lacks context for screen reader users when navigating interactively (e.g., using a wiki-collapsible).
**Action:** When creating toggle buttons or collapsible content with generic visual text, always add a contextual `aria-label` (e.g. `Show [Title]`) and map state with `aria-expanded` and `aria-controls` using `useId`.
