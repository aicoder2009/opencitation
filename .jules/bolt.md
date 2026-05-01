## 2026-05-01 - Concurrent Fetching in Share API
**Learning:** Sequential database queries (like `listUserShares` followed by `getUserLists` and `getUserProjects`) create unnecessary waterfall latency, especially for independent datasets.
**Action:** Always group independent async database calls using `Promise.all` to reduce total latency, as done in `GET /api/share`.
