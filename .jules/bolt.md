## 2024-05-17 - [Resolve Data-Fetching Waterfalls]
**Learning:** Sequential `fetch` calls in React components like detail pages (e.g., project details, associated lists) cause unnecessary waterfalls, artificially delaying Time to First Byte (TTFB). This architecture pattern of fetching independent entities synchronously represents a significant front-end bottleneck.
**Action:** Always utilize `Promise.all` to fetch and parse independent data queries concurrently (such as project details alongside lists) instead of waiting for each one sequentially, drastically reducing latency and load times.

## 2024-05-18 - Concurrent Fetching with Owner IDs in Share Links
**Learning:** In the share system, endpoints processing a share code typically suffer from waterfall latency by first loading target entity details (like a project) and then querying its associated elements (like project lists) using the entity's owner ID (`userId`). However, the `shareLink` object already contains the `userId` field (representing the owner's ID).
**Action:** Always leverage the existing owner's ID within `shareLink` to bypass sequential dependencies and fetch parent entities (like projects) concurrently with their child elements (like user lists) using `Promise.all`.

## 2025-02-28 - In-memory Collection Subsets
**Learning:** Fetching a global collection (e.g., all lists) and a subset of that collection (e.g., project lists) simultaneously on the frontend leads to duplicate backend database queries and redundant HTTP requests.
**Action:** When fetching a global collection alongside a subset of that collection, derive the subset in-memory using array filtering (e.g., `allLists.filter(list => list.projectId === projectId)`) instead of making a redundant API request. This prevents duplicate backend database queries and reduces Time to First Byte (TTFB).
