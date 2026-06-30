## 2024-05-17 - React Conditional Unmounting and aria-controls
**Learning:** When React conditionally unmounts an element controlled by an ARIA button (like a collapsible panel), leaving `aria-controls` pointing to the now-missing DOM ID causes screen readers to announce broken references.
**Action:** Always set `aria-controls={isOpen ? panelId : undefined}` when the target element is completely removed from the DOM, rather than just visually hidden.

## 2024-05-17 - Generic Visual Text Buttons and ARIA Context
**Learning:** Components frequently use generic visual text buttons like `[hide]`, `[show]`, `[edit]`, or `[delete]` within lists or loops. Screen readers read these buttons without surrounding visual context, confusing users.
**Action:** Always provide a contextual `aria-label` (e.g., `aria-label="Hide ${title}"`) for generic visual text buttons so screen reader users have proper context.

## 2024-06-30 - Contextual ARIA labels for generic list buttons
**Learning:** Generic text buttons in repeated lists (like `[edit]`, `[delete]`, `[copy]`) can be confusing for screen reader users when their context isn't explicit, even if they aren't icon-only buttons. Furthermore, dynamically updating buttons (like a `[copy]` button that briefly changes to `[copied!]`) can cause screen readers to announce incorrect information if the `aria-label` doesn't match the new dynamic state.
**Action:** Always provide specific context in `aria-label`s for generic action buttons inside repeated items, and conditionally update the `aria-label` to match the visual dynamic state of the button (e.g., `aria-label={isCopied ? "Copied" : "Copy"}`).
