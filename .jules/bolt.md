## 2025-02-23 - Concurrent Database Queries in Share Listing API
**Learning:** The API endpoint for listing user shares (`GET /api/share`) fetches the user's active shares, lists, and projects sequentially. Fetching them concurrently using `Promise.all` can reduce the latency of the endpoint.
**Action:** When performing multiple independent asynchronous data fetching operations, group them in a `Promise.all` call to avoid waterfall execution.
