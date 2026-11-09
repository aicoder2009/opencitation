## 2024-05-17 - React Conditional Unmounting and aria-controls
**Learning:** When React conditionally unmounts an element controlled by an ARIA button (like a collapsible panel), leaving `aria-controls` pointing to the now-missing DOM ID causes screen readers to announce broken references.
**Action:** Always set `aria-controls={isOpen ? panelId : undefined}` when the target element is completely removed from the DOM, rather than just visually hidden.

## 2024-05-17 - Generic Visual Text Buttons and ARIA Context
**Learning:** Components frequently use generic visual text buttons like `[hide]`, `[show]`, `[edit]`, or `[delete]` within lists or loops. Screen readers read these buttons without surrounding visual context, confusing users.
**Action:** Always provide a contextual `aria-label` (e.g., `aria-label="Hide ${title}"`) for generic visual text buttons so screen reader users have proper context.

## 2024-07-04 - Dynamic ARIA labels for stateful action buttons
**Learning:** When using repeated generic text buttons (like `[copy]`, `[edit]`, `[delete]`) in lists (e.g., citation lists), screen readers lack context. Further, if a button has a temporary visual state change (like `[copy]` becoming `[copied!]`), the `aria-label` must dynamically reflect this state. Otherwise, screen reader users will have inaccurate context and not perceive the visual state change.
**Action:** Always provide specific `aria-label`s (e.g., 'Edit citation', 'Delete citation') for repeated generic actions, and ensure buttons with temporary visual feedback dynamically update their `aria-label` (e.g., `aria-label={isCopied ? 'Copied!' : 'Copy'}`).
