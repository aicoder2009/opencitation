## 2024-04-29 - O(1) Map Lookups Over Array.find()
**Learning:** For frequent lookups in constant arrays (like tag colors, citation styles), using `Array.prototype.find()` incurs O(N) complexity which can be significant in tight loops or frequent renders. However, using a plain object map via `Object.fromEntries` creates vulnerabilities to prototype property accesses (e.g., if a tag is named "toString").
**Action:** Always pre-compute a `Map` instance (e.g., `new Map(ITEMS.map(i => [i.key, i]))`) for O(1) lookups instead of `.find()` or plain objects.
