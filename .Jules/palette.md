## 2024-05-18 - [Improved click target for WikiCollapsible]
**Learning:** Expanding the clickable area of an accordion/collapsible header to the entire row, rather than just a small toggle button, significantly improves usability on both mouse and touch devices. Using `<button>` on the whole row provides native keyboard accessibility and makes semantic sense.
**Action:** Always wrap the entire header row of a collapsible in a `<button>` element with appropriate `aria-expanded` and `aria-controls` attributes, rather than nesting a small toggle link inside a generic `<div>`.
