## 2024-05-24 - Optimize share links endpoint
**Learning:** Sequential database queries for independent data models (shares, user lists, user projects) inside API routes cause unnecessary waterfall execution latency, leading to increased Time to First Byte (TTFB). Next.js API routes with multiple asynchronous requests to DB can significantly benefit from parallel execution.
**Action:** Use `Promise.all()` to execute network and database requests concurrently when fetching independent data models to optimize response times.
