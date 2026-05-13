## 2024-06-19 - Contextual ARIA Labels for Repeated Generic Actions
**Learning:** Generic visual action texts like `[edit]`, `[view]`, `[delete]`, `[remove]`, and `[save]` used repeatedly inside tables or mapped lists lack context for screen reader users when navigated out-of-context (e.g., via a screen reader's elements list).
**Action:** Always provide a contextual `aria-label` (e.g., `aria-label={\`Edit project \${project.name}\`}`) for buttons with generic visual text to ensure screen reader users have proper context.
