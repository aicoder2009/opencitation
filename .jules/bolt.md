## 2024-06-11 - Parallelize Independent Data Fetching in Detail Pages
**Learning:** Sequential data fetching on detail pages (like the project detail page loading its core details, its specific lists, and all generic lists one after another) unnecessarily blocks rendering when these requests are independent.
**Action:** Always utilize `Promise.all` to fetch and parse (`.json()`) independent initial data endpoints concurrently within frontend React components to minimize round-trip latency and improve page load performance.
