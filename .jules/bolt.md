## 2025-02-20 - Concurrent API Fetching in Detail Pages
**Learning:** Sequential data fetching for independent resources (e.g., project details, project lists, and all lists) creates a waterfall latency effect on the client side, significantly increasing the Time to First Byte (TTFB) and page load time.
**Action:** When fetching multiple independent API endpoints or performing multiple asynchronous operations simultaneously, always execute them concurrently using `Promise.all()` to minimize total latency. Remember to also parse their JSON responses concurrently.
