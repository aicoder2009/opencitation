## 2024-05-17 - [Resolve Data-Fetching Waterfalls]
**Learning:** Sequential `fetch` calls in React components like detail pages (e.g., project details, associated lists) cause unnecessary waterfalls, artificially delaying Time to First Byte (TTFB). This architecture pattern of fetching independent entities synchronously represents a significant front-end bottleneck.
**Action:** Always utilize `Promise.all` to fetch and parse independent data queries concurrently (such as project details alongside lists) instead of waiting for each one sequentially, drastically reducing latency and load times.

## 2024-05-18 - Concurrent Fetching with Owner IDs in Share Links
**Learning:** In the share system, endpoints processing a share code typically suffer from waterfall latency by first loading target entity details (like a project) and then querying its associated elements (like project lists) using the entity's owner ID (`userId`). However, the `shareLink` object already contains the `userId` field (representing the owner's ID).
**Action:** Always leverage the existing owner's ID within `shareLink` to bypass sequential dependencies and fetch parent entities (like projects) concurrently with their child elements (like user lists) using `Promise.all`.

## 2024-05-19 - Filter Subsets In-Memory
**Learning:** When a page needs both a global collection of elements (e.g., all lists) and a subset of that collection (e.g., lists associated with a specific project) at the same time, executing separate API requests to fetch both is a redundant operation that increases backend load and slightly delays TTFB. This redundant request pattern happens because React pages often treat endpoint APIs as fully isolated units of work.
**Action:** When a global collection and a subset are both required on the same page, request only the global collection and derive the subset locally in-memory using array filtering. Always verify if an API call for a subset is redundant before implementing it.
