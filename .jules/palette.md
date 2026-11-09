## 2024-05-17 - React Conditional Unmounting and aria-controls
**Learning:** When React conditionally unmounts an element controlled by an ARIA button (like a collapsible panel), leaving `aria-controls` pointing to the now-missing DOM ID causes screen readers to announce broken references.
**Action:** Always set `aria-controls={isOpen ? panelId : undefined}` when the target element is completely removed from the DOM, rather than just visually hidden.

## 2024-05-17 - Generic Visual Text Buttons and ARIA Context
**Learning:** Components frequently use generic visual text buttons like `[hide]`, `[show]`, `[edit]`, or `[delete]` within lists or loops. Screen readers read these buttons without surrounding visual context, confusing users.
**Action:** Always provide a contextual `aria-label` (e.g., `aria-label="Hide ${title}"`) for generic visual text buttons so screen reader users have proper context.

## 2024-06-25 - Contextual ARIA labels for repeated bracket-style inline action buttons
**Learning:** Bracket-style inline action buttons (e.g., `[edit]`, `[delete]`, `[remove]`, `[cancel]`, `[+ add tag]`) are frequently repeated in lists (like `SortableCitation`). When screen readers navigate through these buttons, they announce the visible text. If the visible text is generic, screen reader users lack context on *what* is being edited, deleted, or canceled.
**Action:** Always provide dynamically contextual `aria-label` attributes to these repeated generic buttons, incorporating the relevant entity's name or title (e.g., `aria-label={\`Edit citation \${citation.title}\`}`). Provide descriptive static labels for general actions (e.g., `aria-label="Cancel adding tag"` instead of just `aria-label="Cancel"` or missing label).
