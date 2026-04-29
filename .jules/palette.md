## 2025-04-29 - Missing ID Mapping in Interactive Widgets
**Learning:** Custom interactive widgets (like collapsibles and tabs) across the codebase often miss `aria-controls` mapping because generating unique IDs manually is cumbersome.
**Action:** Use React's `useId` hook consistently in these components to generate unique IDs and map `aria-controls` to the content containers and `aria-expanded` attributes on toggle buttons, improving screen reader context.
