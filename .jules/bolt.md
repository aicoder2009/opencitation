## 2024-05-17 - [Resolve Data-Fetching Waterfalls]
**Learning:** Sequential `fetch` calls in React components like detail pages (e.g., project details, associated lists) cause unnecessary waterfalls, artificially delaying Time to First Byte (TTFB). This architecture pattern of fetching independent entities synchronously represents a significant front-end bottleneck.
**Action:** Always utilize `Promise.all` to fetch and parse independent data queries concurrently (such as project details alongside lists) instead of waiting for each one sequentially, drastically reducing latency and load times.

## 2024-05-18 - Concurrent Fetching with Owner IDs in Share Links
**Learning:** In the share system, endpoints processing a share code typically suffer from waterfall latency by first loading target entity details (like a project) and then querying its associated elements (like project lists) using the entity's owner ID (`userId`). However, the `shareLink` object already contains the `userId` field (representing the owner's ID).
**Action:** Always leverage the existing owner's ID within `shareLink` to bypass sequential dependencies and fetch parent entities (like projects) concurrently with their child elements (like user lists) using `Promise.all`.

## 2024-05-23 - Concurrent Parent/Child Data Fetching in API Routes
**Learning:** In backend API routes (e.g. GET requests for entities), sequentially awaiting a parent validation query (like `getProject(userId, projectId)`) and then its child data query (`getProjectLists(userId, projectId)`) creates a database query waterfall that adds unnecessary latency.
**Action:** When the child query does not strictly depend on the result of the parent query (for example, when both rely on existing parameters like `userId` and `projectId`/`listId`), execute both queries concurrently using `Promise.all` and then perform the necessary validation checks (e.g. `if (!project) return 404`).
