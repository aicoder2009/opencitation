/**
 * Lightweight fuzzy matcher for the command palette.
 *
 * Case-insensitive. An exact substring match always beats a scattered
 * subsequence match; word-start and consecutive-character matches score
 * higher so "ml" prefers "My Lists" over "Bulk Import".
 */

export interface FuzzyResult {
  score: number;
  /** Indices into `target` of the matched characters (for highlighting). */
  indices: number[];
}

const WORD_BOUNDARY = /[\s\-_/.:]/;

export function fuzzyMatch(query: string, target: string): FuzzyResult | null {
  const q = query.toLowerCase().trim();
  const t = target.toLowerCase();

  if (!q) return { score: 0, indices: [] };
  if (q.length > t.length) return null;

  // Exact substring: strong score, earlier and word-aligned is better.
  const sub = t.indexOf(q);
  if (sub !== -1) {
    const wordAligned = sub === 0 || WORD_BOUNDARY.test(t[sub - 1]);
    const score =
      q.length === t.length ? 200 : (wordAligned ? 120 : 60) - sub;
    return {
      score,
      indices: Array.from({ length: q.length }, (_, i) => sub + i),
    };
  }

  // Subsequence: every query char must appear in order.
  const indices: number[] = [];
  let score = 0;
  let ti = 0;
  let prev = -2;
  let allWordStarts = true;
  for (const c of q) {
    while (ti < t.length && t[ti] !== c) ti++;
    if (ti >= t.length) return null;
    score += 1;
    if (ti === prev + 1) score += 5;
    if (ti === 0 || WORD_BOUNDARY.test(t[ti - 1])) score += 10;
    else allWordStarts = false;
    indices.push(ti);
    prev = ti;
    ti++;
  }
  // Acronym match ("ml" → "My Lists") outranks a mid-word substring.
  if (allWordStarts) score += 50;
  // Penalize widely scattered matches.
  score -= Math.floor((indices[indices.length - 1] - indices[0] - indices.length + 1) / 3);
  return { score, indices };
}
