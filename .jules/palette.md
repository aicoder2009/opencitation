
## 2026-04-30 - Accessible Interactive Collapsible using React useId
**Learning:** For accessible interactive components like collapsibles, custom DOM ID generation can be problematic due to component re-use and SSR mismatches. React's `useId` provides collision-free unique IDs crucial for properly linking interactive elements like buttons via `aria-controls` to the content they control.
**Action:** When creating accessible widgets (tabs, dialogs, collapsibles), standardize on React's `useId` hook to generate unique IDs and pair them with `aria-controls` mapping to ensure screen readers provide correct structural context, maintaining accessibility without risking DOM ID collisions across instances.
