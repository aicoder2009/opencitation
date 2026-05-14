## 2024-05-14 - Optimize frontend data fetching for independent models
**Learning:** In the codebase, sequential `fetch` calls for independent models (e.g., fetching project details, then project lists, then all user lists sequentially) creates a noticeable network waterfall effect and increases Time to First Byte (TTFB).
**Action:** Always use `Promise.all()` to execute independent network requests concurrently. Furthermore, `Promise.all()` should also be used to parse the resulting JSON concurrently to maximize parallelization and reduce overall latency.
