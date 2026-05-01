## 2024-05-18 - Concurrent Fetching in API Routes
**Learning:** In Next.js App Router API routes, multiple independent database fetches (like getting user shares, lists, and projects) often happen sequentially when using simple `await` statements one after the other. This creates unnecessary latency. Grouping them into `await Promise.all([])` executes them concurrently.
**Action:** Always scan API routes and server components for sequential `await` calls that do not depend on each other's results, and refactor them to use `Promise.all` to reduce overall execution time.
