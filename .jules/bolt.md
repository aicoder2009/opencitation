## 2026-05-04 - [Concurrent Database Fetching in Share API]
**Learning:** Sequential database operations can significantly increase latency when the operations are independent, such as fetching shares, user lists, and user projects.
**Action:** Use `Promise.all` to execute independent database calls concurrently whenever possible to minimize latency, particularly in API endpoints designed for fetching data to enrich responses.
