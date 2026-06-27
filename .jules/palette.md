## 2024-05-17 - React Conditional Unmounting and aria-controls
**Learning:** When React conditionally unmounts an element controlled by an ARIA button (like a collapsible panel), leaving `aria-controls` pointing to the now-missing DOM ID causes screen readers to announce broken references.
**Action:** Always set `aria-controls={isOpen ? panelId : undefined}` when the target element is completely removed from the DOM, rather than just visually hidden.

## 2024-05-17 - Generic Visual Text Buttons and ARIA Context
**Learning:** Components frequently use generic visual text buttons like `[hide]`, `[show]`, `[edit]`, or `[delete]` within lists or loops. Screen readers read these buttons without surrounding visual context, confusing users.
**Action:** Always provide a contextual `aria-label` (e.g., `aria-label="Hide ${title}"`) for generic visual text buttons so screen reader users have proper context.
## 2025-02-13 - Add Contextual ARIA Labels to Generic Action Buttons in Lists
**Learning:** When building list interfaces (like a list of citations) where generic action buttons (`[edit]`, `[delete]`, `[copy]`, `[share]`, `[+ add notes]`, etc.) are repeated for each item, screen reader users face ambiguity if these buttons lack distinct accessible names. Without contextual labels, a screen reader simply announces "edit, button" repeatedly.
**Action:** Always add conditionally dynamic or contextual `aria-label` attributes to generic visual text buttons within lists to reflect the current state and specific item (e.g., `aria-label={\`Edit citation \${citationTitle}\`}`). This ensures screen readers announce accurate and unambiguous context for each action.
