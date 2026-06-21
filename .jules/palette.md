## 2024-05-17 - React Conditional Unmounting and aria-controls
**Learning:** When React conditionally unmounts an element controlled by an ARIA button (like a collapsible panel), leaving `aria-controls` pointing to the now-missing DOM ID causes screen readers to announce broken references.
**Action:** Always set `aria-controls={isOpen ? panelId : undefined}` when the target element is completely removed from the DOM, rather than just visually hidden.

## 2024-05-17 - Generic Visual Text Buttons and ARIA Context
**Learning:** Components frequently use generic visual text buttons like `[hide]`, `[show]`, `[edit]`, or `[delete]` within lists or loops. Screen readers read these buttons without surrounding visual context, confusing users.
**Action:** Always provide a contextual `aria-label` (e.g., `aria-label="Hide ${title}"`) for generic visual text buttons so screen reader users have proper context.
## 2025-06-21 - [Added aria-controls to Dropdown Menu]
**Learning:** Found a missing link for screen readers where the trigger button in `WikiDropdown` didn't explicitly point to its menu via `aria-controls`.
**Action:** When creating conditionally mounted dynamic menus, always generate an ID (e.g., `useId()`) and assign it to the menu container, then set `aria-controls={isOpen ? menuId : undefined}` on the trigger.
