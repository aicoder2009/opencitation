## 2024-05-17 - React Conditional Unmounting and aria-controls
**Learning:** When React conditionally unmounts an element controlled by an ARIA button (like a collapsible panel), leaving `aria-controls` pointing to the now-missing DOM ID causes screen readers to announce broken references.
**Action:** Always set `aria-controls={isOpen ? panelId : undefined}` when the target element is completely removed from the DOM, rather than just visually hidden.

## 2024-05-17 - Generic Visual Text Buttons and ARIA Context
**Learning:** Components frequently use generic visual text buttons like `[hide]`, `[show]`, `[edit]`, or `[delete]` within lists or loops. Screen readers read these buttons without surrounding visual context, confusing users.
**Action:** Always provide a contextual `aria-label` (e.g., `aria-label="Hide ${title}"`) for generic visual text buttons so screen reader users have proper context.

## 2024-06-26 - Generic Action Buttons Require Specific Context
**Learning:** Adding aria-labels to generic interactive text links like `[edit]`, `[delete]`, `[share]`, and `[clear]` is particularly critical in dynamic repeated UI elements (like a list of citations). Screen readers announce the label without visual context, so the action must include what is being interacted with.
**Action:** Ensure that buttons performing operations on list items generate their aria-label from item context rather than using static strings (e.g., `aria-label={\`Edit \${citation.fields?.title}\`}`).
