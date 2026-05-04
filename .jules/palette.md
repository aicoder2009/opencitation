## 2024-05-04 - Tab Accessibility improvements
**Learning:** Adding standard `role="tablist"` and `role="tab"` properties combined with `aria-selected` improves the keyboard navigation flow immensely, but requires that the keyboard events properly handle arrow keys. In this project, focus states were applied purely through `focus-visible:outline-dotted`.
**Action:** Always place component imports like `useId` at the top of the file to adhere to structural linters (e.g., `import/first`), even if React/ES Modules allow inline imports.
