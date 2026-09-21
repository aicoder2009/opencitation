## 2024-05-17 - [Resolve Data-Fetching Waterfalls]
**Learning:** Sequential `fetch` calls in React components like detail pages (e.g., project details, associated lists) cause unnecessary waterfalls, artificially delaying Time to First Byte (TTFB). This architecture pattern of fetching independent entities synchronously represents a significant front-end bottleneck.
**Action:** Always utilize `Promise.all` to fetch and parse independent data queries concurrently (such as project details alongside lists) instead of waiting for each one sequentially, drastically reducing latency and load times.

## 2024-05-18 - Concurrent Fetching with Owner IDs in Share Links
**Learning:** In the share system, endpoints processing a share code typically suffer from waterfall latency by first loading target entity details (like a project) and then querying its associated elements (like project lists) using the entity's owner ID (`userId`). However, the `shareLink` object already contains the `userId` field (representing the owner's ID).
**Action:** Always leverage the existing owner's ID within `shareLink` to bypass sequential dependencies and fetch parent entities (like projects) concurrently with their child elements (like user lists) using `Promise.all`.

## 2024-05-19 - [Unauthorized Parallel Database Reads in API Routes]
**Learning:** While `Promise.all` is excellent for parallelizing data fetching on the frontend, using it to concurrently fetch authorization validation data (e.g. `getList(userId, listId)`) alongside un-scoped child data (e.g. `getListCitations(listId)`) in backend API routes is a severe anti-pattern. This approach executes potentially heavy queries for data *before* confirming the user actually has access to it, creating a vulnerability to Resource Exhaustion/DoS if a malicious actor supplies valid IDs belonging to other users.
**Action:** In API routes, authorization and parent validation queries must be executed sequentially *before* executing queries for child entities, even if it introduces a sequential "waterfall". Never parallelize access checks with data retrieval.
