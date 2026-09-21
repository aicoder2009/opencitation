The account avatar in the header and the panel it opens.

The avatar is a square `size-avatar` (32px, or `size-avatar-sm` at 28px in the mobile header) with a `wiki-border-light` edge — square, like everything else, never a circle. With a Clerk image it shows the photo; without one it falls back to `wiki-tab-bg` holding the first initial at `caption` weight 700. Before Clerk loads, it is a bare `wiki-border-light` block of the same size, so the header does not reflow.

The panel is `absolute right-0`, `width-user-menu` (192px), on `wiki-white` inside a `wiki-border` edge at `z-overlay`: an identity block (name at `body-tight`, email at `caption` in `wiki-text-muted`) over a rule, then link rows.

**You provide** only `size`. The component reads the Clerk session and owns outside-click and Escape dismissal.

### Rules

- **Do** keep the panel to account actions: profile, settings, sign out.
- **Do** truncate a long email rather than wrapping it.
- **Don't** round the avatar, and don't add a status dot.
- **Don't** put product navigation in here; that belongs in the header nav or the command palette.
