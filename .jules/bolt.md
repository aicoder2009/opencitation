## 2026-05-05 - Optimize Research Type Label Lookup
**Learning:** Found an O(N) array `.find()` in `researchTypeLabel` in `src/app/cite/page.tsx` acting on constant data.
**Action:** Transformed `RESEARCH_TYPES` into a `RESEARCH_TYPE_MAP` (`Map` object) on initialization and utilized `RESEARCH_TYPE_MAP.get(rt) ?? rt` for an O(1) lookup. As indicated in `scripts/benchmark-getlabel.js`, `Map.get` lookups offer significant performance improvements (~92% faster in benchmarks) over `.find()` when repeatedly invoked on static maps.
