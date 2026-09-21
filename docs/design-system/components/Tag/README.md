A square pill whose colour is derived from its own name, and the one saturated palette in the system.

Shape is fixed: `inline-flex`, 2px/8px padding, `caption` text, a 1px border, no radius. Colour comes from `src/lib/tag-colors.ts`, which sums the tag name's character codes and takes the remainder over ten palette slots, so the same tag is the same colour everywhere without any stored state. A user override is kept in `localStorage` and set through `TagColorPicker`.

**You provide** the tag name and, for a filter chip, an active flag and a remove handler. The palette provides `bg` / `text` / `border` for the resting pill and `active-bg` / `active-text` / `active-border` for the selected one, each already paired for light and dark.

### Rules

- **Do** read the slot through `useTagColors()` or `resolveTagColor()`. **Never hardcode a tag colour** and never pick one by meaning — the hash is what keeps a tag stable across lists, projects and share pages.
- **Do** use `active-*` only for a tag acting as an applied filter, and keep the swatch/label divider in `tag-active-inner-border`.
- **Do** keep the label at `caption`; tags sit inside a card header and must not push it taller.
- **Don't** round the pill, and don't add a shadow or a hover lift.
- **Don't** treat the palette as semantic. Green is slot 4, not "success" — the system has no state hues.
