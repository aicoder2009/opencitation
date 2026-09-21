An inline status message that carries severity in border weight, not in colour.

`pad-list-y` / `pad-list-x` at `body-tight` on `wiki-offwhite` inside a `wiki-border-light` edge, with a heavier left rule. That left rule is the entire variant: `border-notice-info` (2px, `wiki-border-light`) for info, `border-notice-warn` (4px, `wiki-border`) for warn. **There is no red, amber or green notice in this system**, and adding one would be the first state hue in the product.

**You provide** the message as children, optionally `variant` and `onDismiss` — which renders a `[dismiss]` link. The component sets `role="status"` for info and `role="alert"` for warn, so assistive tech gets the urgency the colour does not carry.

### Rules

- **Do** use `warn` for anything the user must act on: a failed lookup, an unsaved change, a sync error.
- **Do** put a form validation message in a `warn` notice next to the control, and leave the field's border alone.
- **Do** say what went wrong and what to do about it, in one or two sentences.
- **Don't** tint the fill or the text to signal severity.
- **Don't** stack more than two notices. Merge them, or move the detail into the page.
