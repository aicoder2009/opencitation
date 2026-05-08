## 2025-05-08 - [Parallelize Independent Network Requests and Database Queries]
**Learning:** Sequential network requests or database queries for independent data models result in unnecessary waterfall latency, specifically observed during list/project hydration and API data enrichment in this codebase.
**Action:** When fetching independent models (e.g., project details, its lists, and all user lists, or shares alongside lists/projects), wrap them in `Promise.all()` to fetch concurrently, significantly reducing TTFB and layout render delays.
