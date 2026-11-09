## 2024-05-17 - [Resolve Data-Fetching Waterfalls]
**Learning:** Sequential `fetch` calls in React components like detail pages (e.g., project details, associated lists) cause unnecessary waterfalls, artificially delaying Time to First Byte (TTFB). This architecture pattern of fetching independent entities synchronously represents a significant front-end bottleneck.
**Action:** Always utilize `Promise.all` to fetch and parse independent data queries concurrently (such as project details alongside lists) instead of waiting for each one sequentially, drastically reducing latency and load times.

## 2024-05-18 - Concurrent Fetching with Owner IDs in Share Links
**Learning:** In the share system, endpoints processing a share code typically suffer from waterfall latency by first loading target entity details (like a project) and then querying its associated elements (like project lists) using the entity's owner ID (`userId`). However, the `shareLink` object already contains the `userId` field (representing the owner's ID).
**Action:** Always leverage the existing owner's ID within `shareLink` to bypass sequential dependencies and fetch parent entities (like projects) concurrently with their child elements (like user lists) using `Promise.all`.

## 2024-05-19 - [In-memory filtering for global subsets]
**Learning:** When a UI component requires both a global collection (e.g., all lists for the user) and a subset of that collection (e.g., lists associated with a specific project), making two separate API requests causes redundant database queries and increases network payload size.
**Action:** When a subset can be perfectly derived from a global collection that is already being fetched, derive the subset in-memory using array filtering (`Array.prototype.filter()`) instead of executing an additional backend request. This eliminates a duplicate network call and database query.
