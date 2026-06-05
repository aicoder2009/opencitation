## 2024-05-17 - [Resolve Data-Fetching Waterfalls]
**Learning:** Sequential `fetch` calls in React components like detail pages (e.g., project details, associated lists) cause unnecessary waterfalls, artificially delaying Time to First Byte (TTFB). This architecture pattern of fetching independent entities synchronously represents a significant front-end bottleneck.
**Action:** Always utilize `Promise.all` to fetch and parse independent data queries concurrently (such as project details alongside lists) instead of waiting for each one sequentially, drastically reducing latency and load times.

## 2024-05-18 - Concurrent Fetching with Owner IDs in Share Links
**Learning:** In the share system, endpoints processing a share code typically suffer from waterfall latency by first loading target entity details (like a project) and then querying its associated elements (like project lists) using the entity's owner ID (`userId`). However, the `shareLink` object already contains the `userId` field (representing the owner's ID).
**Action:** Always leverage the existing owner's ID within `shareLink` to bypass sequential dependencies and fetch parent entities (like projects) concurrently with their child elements (like user lists) using `Promise.all`.
## 2024-05-19 - Duplicate Backend Queries
**Learning:** Redundant backend API requests can happen when fetching a global list and a subset simultaneously. The `src/app/projects/[id]/page.tsx` was doing exactly this, resulting in an unneeded backend request to `/api/projects/${projectId}/lists`.
**Action:** When a global collection is fetched (e.g., all lists via `/api/lists`), derive subsets (like project lists) directly in-memory using array filtering (e.g., `listsData.filter((list) => list.projectId === projectId)`). This saves one full HTTP round-trip and a backend query per load.
