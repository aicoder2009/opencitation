The only button in the system: square, 1px bordered, and never filled.

Both variants share the same box — `pad-button-y` / `pad-button-x` (8/16px), a `wiki-border-light` edge, a `wiki-white` fill, `body-tight` text. `primary` differs from `default` in two properties and no others: its label is `wiki-link` and its weight is 500. There is no solid, tinted or destructive button style, and adding one breaks the flat idiom the product is built on.

**You provide** the label as children, an `onClick`, and optionally `variant`, `disabled` and extra classes. The component supplies padding, border, hover, active, focus and disabled styling.

### States

| State | Appearance |
|---|---|
| Rest | `wiki-white` fill, `wiki-border-light` edge |
| Hover | fill moves to `wiki-tab-bg` |
| Active | fill moves to `wiki-border-light` |
| Focus | 1px dotted `wiki-text` outline at 2px offset |
| Disabled | `opacity-disabled` and `cursor-not-allowed`, hover locked to the rest fill |

### Rules

- **Do** use exactly one `primary` per surface — the action the user came for.
- **Do** use `default` for everything supporting: cancel, back, a secondary export.
- **Do** reach for the link pattern (`wiki-link` + `hover:underline`) instead, for anything that is not a form-submission-level action. Row actions are bracketed text links, not buttons.
- **Don't** put two `primary` buttons side by side.
- **Don't** give a destructive action the `primary` slot. Place delete on the left of a footer as a `default` button.
- **Don't** ship an icon without a label, except a close button, which needs an `aria-label`.
