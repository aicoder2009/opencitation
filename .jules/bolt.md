## 2025-05-05 - Avoid Micro-Optimizations and Preserve Causality

**Learning:** Micro-optimizations on small, static arrays (like replacing `.find()` with `Map` for <10 items) offer negligible performance benefits and should be avoided, as they add complexity without a measurable bottleneck.
Additionally, when optimizing offline sync queues, processing events strictly by entity type (to enable parallel execution) destroys the chronological sequence of operations, breaking causal consistency (e.g., trying to add a citation to a list that was later deleted offline).

**Action:** I will focus on optimizing obvious bottlenecks like N+1 queries or sequential API/database calls (e.g., converting sequential `await`s to `Promise.all`), while avoiding micro-optimizations. I will never reorder chronological event queues in a way that breaks causality.
