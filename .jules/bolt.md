## 2024-05-15 - Concurrent Data Fetching
**Learning:** Sequential network requests and sequential database queries can create a "waterfall" performance bottleneck, significantly increasing latency.
**Action:** Always look for independent data fetching operations that can be parallelized using `Promise.all` on both the frontend (e.g., `fetch` calls) and the backend (e.g., DB queries) to improve load times and decrease database latency.
