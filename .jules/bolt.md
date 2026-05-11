## 2025-02-27 - Concurrent fetching in `/api/share`
**Learning:** Fetching independent datasets such as shares, lists, and projects sequentially causes waterfall latency, impacting API response time.
**Action:** Use `Promise.all()` to fetch independent data sources concurrently, specifically in GET routes like `/api/share`, effectively lowering the Time to First Byte (TTFB).
