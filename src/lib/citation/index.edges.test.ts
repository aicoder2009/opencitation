import { describe, it, expect } from 'vitest';
import { generateInTextCitation } from './index';
import type { CitationFields } from '@/types/citation';

function makeFields(overrides: Partial<CitationFields> = {}): CitationFields {
  return {
    sourceType: 'book',
    accessType: 'print',
    title: 'Long Title: Subtitle Here',
    publicationDate: { year: 2023 },
    ...overrides,
  } as CitationFields;
}

function authors(...lastNames: string[]) {
  return lastNames.map((lastName) => ({ lastName }));
}

describe('generateInTextCitation – MLA', () => {
  it('1 author omits year', () => {
    const result = generateInTextCitation(makeFields({ authors: authors('Smith') }), 'mla');
    expect(result).toBe('(Smith)');
  });

  it('2 authors uses "and"', () => {
    const result = generateInTextCitation(
      makeFields({ authors: authors('Smith', 'Jones') }),
      'mla'
    );
    expect(result).toBe('(Smith and Jones)');
  });

  it('3+ authors uses et al. without year', () => {
    const result = generateInTextCitation(
      makeFields({ authors: authors('Smith', 'Jones', 'Williams') }),
      'mla'
    );
    expect(result).toBe('(Smith et al.)');
  });

  it('no authors uses title without year', () => {
    const result = generateInTextCitation(makeFields({ authors: [] }), 'mla');
    expect(result).toMatch(/^\("Long Title/);
    expect(result).not.toContain('2023');
  });
});

describe('generateInTextCitation – Chicago', () => {
  it('1 author uses Last Year format', () => {
    const result = generateInTextCitation(makeFields({ authors: authors('Smith') }), 'chicago');
    expect(result).toBe('(Smith 2023)');
  });

  it('2 authors lists both last names', () => {
    const result = generateInTextCitation(
      makeFields({ authors: authors('Smith', 'Jones') }),
      'chicago'
    );
    expect(result).toBe('(Smith, Jones 2023)');
  });

  it('3 authors lists all three last names', () => {
    const result = generateInTextCitation(
      makeFields({ authors: authors('Smith', 'Jones', 'Williams') }),
      'chicago'
    );
    expect(result).toBe('(Smith, Jones, Williams 2023)');
  });

  it('4 authors uses et al.', () => {
    const result = generateInTextCitation(
      makeFields({ authors: authors('Smith', 'Jones', 'Williams', 'Brown') }),
      'chicago'
    );
    expect(result).toBe('(Smith et al. 2023)');
  });

  it('no authors uses title with year', () => {
    const result = generateInTextCitation(makeFields({ authors: [] }), 'chicago');
    expect(result).toContain('2023');
  });
});

describe('generateInTextCitation – Harvard', () => {
  it('1 author uses (Last, year)', () => {
    const result = generateInTextCitation(makeFields({ authors: authors('Smith') }), 'harvard');
    expect(result).toBe('(Smith, 2023)');
  });

  it('2 authors uses "and"', () => {
    const result = generateInTextCitation(
      makeFields({ authors: authors('Smith', 'Jones') }),
      'harvard'
    );
    expect(result).toBe('(Smith and Jones, 2023)');
  });

  it('3+ authors uses et al.', () => {
    const result = generateInTextCitation(
      makeFields({ authors: authors('Smith', 'Jones', 'Williams') }),
      'harvard'
    );
    expect(result).toBe('(Smith et al., 2023)');
  });

  it('no authors uses title with year', () => {
    const result = generateInTextCitation(makeFields({ authors: [] }), 'harvard');
    expect(result).toContain('2023');
  });
});

describe('generateInTextCitation – APA', () => {
  it('3+ authors uses et al.', () => {
    const result = generateInTextCitation(
      makeFields({ authors: authors('Smith', 'Jones', 'Williams') }),
      'apa'
    );
    expect(result).toBe('(Smith et al., 2023)');
  });

  it('uses n.d. when no year', () => {
    const result = generateInTextCitation(
      makeFields({ authors: authors('Smith'), publicationDate: undefined }),
      'apa'
    );
    expect(result).toBe('(Smith, n.d.)');
  });

  it('no authors uses title truncated to 30 chars with year', () => {
    const result = generateInTextCitation(
      makeFields({ authors: [], title: 'A Very Long Title That Goes Beyond Thirty Characters' }),
      'apa'
    );
    expect(result).toContain('2023');
    const inner = result.slice(2, -1);
    expect(inner.split(',')[0].replace(/"/g, '').length).toBeLessThanOrEqual(30);
  });
});

describe('generateInTextCitation – unknown style', () => {
  it('falls back to APA format', () => {
    const result = generateInTextCitation(
      makeFields({ authors: authors('Smith') }),
      'unknown' as never
    );
    expect(result).toBe('(Smith, 2023)');
  });
});
