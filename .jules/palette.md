## 2024-05-17 - React Conditional Unmounting and aria-controls
**Learning:** When React conditionally unmounts an element controlled by an ARIA button (like a collapsible panel), leaving `aria-controls` pointing to the now-missing DOM ID causes screen readers to announce broken references.
**Action:** Always set `aria-controls={isOpen ? panelId : undefined}` when the target element is completely removed from the DOM, rather than just visually hidden.

## 2024-05-17 - Generic Visual Text Buttons and ARIA Context
**Learning:** Components frequently use generic visual text buttons like `[hide]`, `[show]`, `[edit]`, or `[delete]` within lists or loops. Screen readers read these buttons without surrounding visual context, confusing users.
**Action:** Always provide a contextual `aria-label` (e.g., `aria-label="Hide ${title}"`) for generic visual text buttons so screen reader users have proper context.

## 2024-06-16 - Add dynamic and clear ARIA labels to bracket-styled buttons
**Learning:** Text-only buttons using bracket syntax (like `[copy]` or `[edit]`) are confusing to screen readers because of the punctuation, and their meaning is often coupled with changing visual states (like `[copied!]`). We must provide explicit context overriding the visual text. Additionally, when a button's visual text changes state (e.g. from `[copy]` to `[copied!]`), the `aria-label` must also conditionally change (e.g., `aria-label={isCopied ? "Copied citation!" : "Copy citation"}`) to ensure screen readers announce the updated accurate state, rather than just the generic base action.
**Action:** When adding or auditing action buttons that use bracket styling or have dynamic state updates upon interaction, apply a conditionally dynamic `aria-label` that completely removes punctuation and reflects the current state to guarantee screen reader accuracy.
