## 2025-02-28 - [Concurrent Data Fetching]
**Learning:** Sequential data fetching can significantly increase page load latency. Combining independent fetch requests using `Promise.all` allows them to process concurrently, preventing network waterfalls.
**Action:** When implementing page components that require multiple independent data streams, analyze if they can be fetched in parallel using `Promise.all` rather than using sequential `await fetch()` calls.
