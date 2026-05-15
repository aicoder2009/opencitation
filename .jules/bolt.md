## 2024-05-15 - Concurrent Data Fetching on Detail Pages
**Learning:** Sequential `fetch` calls to independent endpoints (e.g., project details, project lists, all user lists) cause unnecessary waterfall latency in detail page components. This anti-pattern delays Time to First Byte (TTFB) and increases Time to Interactive (TTI) for end users.
**Action:** Always group independent network requests (and their corresponding JSON parsings) into `Promise.all()` to execute them concurrently, significantly reducing data fetch overhead on render.
