## 2024-05-17 - [Resolve Data-Fetching Waterfalls]
**Learning:** Sequential `fetch` calls in React components like detail pages (e.g., project details, associated lists) cause unnecessary waterfalls, artificially delaying Time to First Byte (TTFB). This architecture pattern of fetching independent entities synchronously represents a significant front-end bottleneck.
**Action:** Always utilize `Promise.all` to fetch and parse independent data queries concurrently (such as project details alongside lists) instead of waiting for each one sequentially, drastically reducing latency and load times.

## 2024-05-18 - Concurrent Fetching with Owner IDs in Share Links
**Learning:** In the share system, endpoints processing a share code typically suffer from waterfall latency by first loading target entity details (like a project) and then querying its associated elements (like project lists) using the entity's owner ID (`userId`). However, the `shareLink` object already contains the `userId` field (representing the owner's ID).
**Action:** Always leverage the existing owner's ID within `shareLink` to bypass sequential dependencies and fetch parent entities (like projects) concurrently with their child elements (like user lists) using `Promise.all`.

## 2024-05-18 - Avoiding Duplicate Queries via In-Memory Derivation
**Learning:** React components sometimes fetch a global collection (like all user lists) and a specific subset (like lists for a single project) simultaneously. Making redundant backend requests for the subset causes unnecessary network overhead.
**Action:** When a global collection and its subset are needed on the frontend concurrently, always fetch the global collection once and derive the subset in-memory using `Array.prototype.filter`, avoiding the redundant backend query.

## 2024-05-18 - Rejected Workaround for React Hooks Warnings
**Learning:** Wrapping `setState` in `setTimeout`, `Promise.resolve().then()`, or prepending `await Promise.resolve()` to silence ESLint warnings about synchronous `setState` in `useEffect` are critical anti-patterns that delay state updates artificially and create potential memory leaks.
**Action:** Never use `setTimeout` or extraneous promise resolutions to circumvent `react-hooks/set-state-in-effect`. Standard state updates within `useEffect` are safe when properly managed.
