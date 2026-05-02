## 2024-05-24 - [Concurrent Fetching in API Endpoints]
**Learning:** Sequential, independent database queries within API routes (like `/api/share`) cause a measurable N+1 latency pattern as each await blocks the next, despite not depending on its results.
**Action:** When enriching list items from external collections or making independent queries, group them into a single `Promise.all` block to resolve them concurrently and significantly reduce request overhead.
