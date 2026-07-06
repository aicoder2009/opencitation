## 2024-05-17 - React Conditional Unmounting and aria-controls
**Learning:** When React conditionally unmounts an element controlled by an ARIA button (like a collapsible panel), leaving `aria-controls` pointing to the now-missing DOM ID causes screen readers to announce broken references.
**Action:** Always set `aria-controls={isOpen ? panelId : undefined}` when the target element is completely removed from the DOM, rather than just visually hidden.

## 2024-05-17 - Generic Visual Text Buttons and ARIA Context
**Learning:** Components frequently use generic visual text buttons like `[hide]`, `[show]`, `[edit]`, or `[delete]` within lists or loops. Screen readers read these buttons without surrounding visual context, confusing users.
**Action:** Always provide a contextual `aria-label` (e.g., `aria-label="Hide ${title}"`) for generic visual text buttons so screen reader users have proper context.

## 2024-07-06 - Accessibility for Generic Text Buttons in Lists
**Learning:** Text buttons with simple labels like `[edit]`, `[delete]`, `[share]`, or `[copy]` might look visually acceptable in isolation, but when they appear multiple times within lists or components like `SortableCitation`, screen reader users lose context (e.g., they just hear "edit, button, edit, button"). Even buttons that dynamically update (like `[copied!]`) can be confusing if the ARIA label isn't dynamically updated to reflect the new state.
**Action:** Always provide robust, specific `aria-label` attributes to generic text and icon-only buttons (e.g., `aria-label="Edit citation"` instead of just letting the screen reader read "[edit]"). If the button's visual state changes (e.g., to indicate success), ensure the `aria-label` conditionally updates to match (e.g., `aria-label={isCopied ? "Copied citation!" : "Copy citation"}`).
