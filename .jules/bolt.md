
## 2024-04-26 - [Bulk Lookup Concurrency]
**Learning:** Sequential processing in the bulk lookup API (using `for...of` loops) causes high latency when processing many requests. The optimization was to replace the `for...of` loop with `Promise.all` and `Array.prototype.map()`. A simulation showed a 20x latency improvement.
**Action:** When working on APIs doing multiple database/network operations over a loop, refactor them using `Promise.all` with `map` for concurrent execution, making sure to handle early returns correctly and carefully enclosing try-catches.
