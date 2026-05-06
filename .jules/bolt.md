## 2025-05-06 - Concurrent Data Fetching for Dashboard Enrichment
**Learning:** In the GET `/api/share` endpoint, gathering enrichment data (lists and projects) was performed sequentially after fetching the base share links, leading to an N+1 style sequential execution bottleneck. Because the fetches for `listUserShares`, `getUserLists`, and `getUserProjects` do not depend on each other, they can be fired concurrently.
**Action:** Use `Promise.all` to fetch independent data sets concurrently to minimize database latency and reduce the overall response time of the endpoint.
