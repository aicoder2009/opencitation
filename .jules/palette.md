## 2024-05-24 - Accessible Collapsibles
**Learning:** React interactive widgets like collapsibles need unique identifiers to properly map `aria-controls` from the trigger to the content.
**Action:** Use React's `useId` hook to generate these unique IDs reliably, ensuring correct screen reader context without ID collisions when multiple components are rendered on the same page.
