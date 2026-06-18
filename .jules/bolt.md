## 2024-05-17 - [Resolve Data-Fetching Waterfalls]
**Learning:** Sequential `fetch` calls in React components like detail pages (e.g., project details, associated lists) cause unnecessary waterfalls, artificially delaying Time to First Byte (TTFB). This architecture pattern of fetching independent entities synchronously represents a significant front-end bottleneck.
**Action:** Always utilize `Promise.all` to fetch and parse independent data queries concurrently (such as project details alongside lists) instead of waiting for each one sequentially, drastically reducing latency and load times.

## 2024-05-18 - Concurrent Fetching with Owner IDs in Share Links
**Learning:** In the share system, endpoints processing a share code typically suffer from waterfall latency by first loading target entity details (like a project) and then querying its associated elements (like project lists) using the entity's owner ID (`userId`). However, the `shareLink` object already contains the `userId` field (representing the owner's ID).
**Action:** Always leverage the existing owner's ID within `shareLink` to bypass sequential dependencies and fetch parent entities (like projects) concurrently with their child elements (like user lists) using `Promise.all`.

## 2025-02-23 - In-memory Filtering to Prevent Redundant Queries
**Learning:** In certain views like project detail pages, we need to fetch a specific subset of entities (e.g., project lists). However, the system's DynamoDB backend lacks a Global Secondary Index (GSI) for `projectId`, meaning fetching a project's lists requires retrieving all of the user's lists and filtering them. In scenarios where both all user lists and project-specific lists are needed simultaneously, fetching them via separate API calls results in duplicate and expensive database lookups.
**Action:** When a global collection (like all lists) and a subset of that collection (like project lists) are required simultaneously, always fetch the global collection once and derive the subset in-memory using array filtering. Do not make a redundant API request for the subset.
