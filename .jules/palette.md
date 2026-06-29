## 2024-05-17 - React Conditional Unmounting and aria-controls
**Learning:** When React conditionally unmounts an element controlled by an ARIA button (like a collapsible panel), leaving `aria-controls` pointing to the now-missing DOM ID causes screen readers to announce broken references.
**Action:** Always set `aria-controls={isOpen ? panelId : undefined}` when the target element is completely removed from the DOM, rather than just visually hidden.

## 2024-05-17 - Generic Visual Text Buttons and ARIA Context
**Learning:** Components frequently use generic visual text buttons like `[hide]`, `[show]`, `[edit]`, or `[delete]` within lists or loops. Screen readers read these buttons without surrounding visual context, confusing users.
**Action:** Always provide a contextual `aria-label` (e.g., `aria-label="Hide ${title}"`) for generic visual text buttons so screen reader users have proper context.
## 2025-06-29 - Contextual ARIA Labels for Generic Text Buttons
**Learning:** Generic visual text buttons (e.g., `[copy]`, `[edit]`, `[delete]`, `[clear]`) repeated inside lists without contextual `aria-label`s provide inadequate context to screen reader users. Additionally, buttons with temporary visual state changes (like `[copy]` changing to `[copied!]`) need conditionally dynamic `aria-label`s reflecting the updated state to avoid screen readers announcing inaccurate context.
**Action:** Always add contextual `aria-label` attributes to generic icon-only and textual buttons (like `[edit citation]`), especially when repeated in list items. When a button visually indicates a temporary state change upon interaction, conditionally update its `aria-label` to accurately reflect that state.
