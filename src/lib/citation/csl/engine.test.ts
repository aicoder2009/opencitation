// @vitest-environment jsdom
import { describe, it, expect } from 'vitest';
import { formatCsl, inTextCsl } from './engine';
import type { CitationFields } from '@/types/citation';

const article: CitationFields = {
  sourceType: 'journal',
  accessType: 'web',
  title: 'Attention is all you need',
  journalTitle: 'Advances in Neural Information Processing Systems',
  authors: [
    { firstName: 'Ashish', lastName: 'Vaswani' },
    { firstName: 'Noam', lastName: 'Shazeer' },
  ],
  volume: '30',
  pageRange: '5998-6008',
  publicationDate: { year: 2017 },
};

describe('formatCsl', () => {
  it('formats a numbered IEEE reference with inline (not block) HTML', async () => {
    const { text, html } = await formatCsl(article, 'ieee');
    expect(text).toContain('Vaswani');
    expect(text).toContain('2017');
    // numbered style emits a leading [1]
    expect(text).toContain('[1]');
    // HTML must be inline — no leftover block divs from the bibliography layout
    expect(html).not.toContain('<div');
    expect(html.length).toBeGreaterThan(0);
  });

  it('formats an author-date Chicago reference', async () => {
    const { text } = await formatCsl(article, 'chicago-author-date');
    expect(text).toContain('Vaswani');
    expect(text).toContain('2017');
    expect(text).toContain('Attention');
  });

  it('throws on an unknown style id', async () => {
    await expect(formatCsl(article, 'not-a-style')).rejects.toThrow();
  });
});

describe('inTextCsl', () => {
  it('produces a numeric marker for IEEE', async () => {
    const inText = await inTextCsl(article, 'ieee');
    expect(inText).toContain('[1]');
  });

  it('produces an author-date marker for Chicago author-date', async () => {
    const inText = await inTextCsl(article, 'chicago-author-date');
    expect(inText).toContain('Vaswani');
    expect(inText).toContain('2017');
  });
});
