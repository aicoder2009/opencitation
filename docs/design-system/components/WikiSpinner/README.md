The only loading indicator in the system: a 20px SVG ring that spins in `wiki-text-muted`.

Two shapes at fixed opacities — a full circle stroked at `opacity-spinner-track` (0.25) and a quarter-arc filled at `opacity-spinner-head` (0.75) — rotated by `animate-spin` inside a centred `py-8` block with `role="status"` and `aria-label="Loading"`. It inherits `currentColor`, so it takes its ink from whatever contains it.

**You provide** nothing. For page-level loading, render it from a Next.js `loading.tsx`.

### Rules

- **Do** use it for any wait: lookups, saves, exports, route transitions.
- **Do** drop it to 16px (`h-4 w-4`) inline beside a label when it sits inside a button or a row.
- **Don't** build a skeleton screen or a shimmer. A flat surface has nothing to shimmer, and the product would read as a different app.
- **Don't** add a progress bar or a percentage unless the operation genuinely reports progress.
