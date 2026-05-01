import { describe, it, expect } from 'vitest';
import {
  formatAuthorAPA,
  formatAuthorMLA,
  formatAuthorHarvard,
  formatAuthorsAPA,
  formatAuthorsMLA,
  formatAuthorsChicago,
  formatAuthorsHarvard,
  formatDateAPA,
  formatDateMLA,
  formatDOI,
  toSentenceCase,
} from './utils';
import type { Author } from '@/types/citation';

function author(lastName: string, firstName?: string): Author {
  return { lastName, firstName };
}

describe('formatAuthorsAPA – boundary conditions', () => {
  it('formats exactly 20 authors with & before last', () => {
    const authors = Array.from({ length: 20 }, (_, i) => author(`Author${i + 1}`, 'A'));
    const result = formatAuthorsAPA(authors);
    expect(result).toContain(', & Author20, A.');
    expect(result).not.toContain('...');
  });

  it('truncates 21 authors to first 19 + ellipsis + last', () => {
    const authors = Array.from({ length: 21 }, (_, i) => author(`Author${i + 1}`, 'A'));
    const result = formatAuthorsAPA(authors);
    expect(result).toContain('Author1, A.');
    expect(result).toContain('Author19, A.');
    expect(result).toContain('...');
    expect(result).toContain('Author21, A.');
    expect(result).not.toContain('Author20');
  });

  it('returns empty string for empty array', () => {
    expect(formatAuthorsAPA([])).toBe('');
  });
});

describe('formatAuthorsChicago – boundary conditions', () => {
  it('formats 3 authors with commas and "and"', () => {
    const result = formatAuthorsChicago([
      author('Smith', 'John'),
      author('Jones', 'Mary'),
      author('Williams', 'Kate'),
    ]);
    expect(result).toContain('Smith, John');
    expect(result).toContain('Mary Jones');
    expect(result).toContain('and Kate Williams');
  });

  it('formats 4 authors as first author et al.', () => {
    const authors = [
      author('Smith', 'John'),
      author('Jones', 'Mary'),
      author('Williams', 'Kate'),
      author('Brown', 'Tom'),
    ];
    const result = formatAuthorsChicago(authors);
    expect(result).toBe('Smith, John, et al.');
  });

  it('formats 2 authors with "and"', () => {
    const result = formatAuthorsChicago([author('Smith', 'John'), author('Jones', 'Mary')]);
    expect(result).toContain('and Mary Jones');
  });
});

describe('formatAuthorsHarvard – boundary conditions', () => {
  it('formats 3 authors with commas and "and"', () => {
    const result = formatAuthorsHarvard([
      author('Smith', 'John'),
      author('Jones', 'Mary'),
      author('Williams', 'Kate'),
    ]);
    expect(result).toContain('Smith, J.');
    expect(result).toContain('Jones, M.');
    expect(result).toContain('and Williams, K.');
  });

  it('formats 4+ authors as first et al.', () => {
    const authors = [
      author('Smith', 'John'),
      author('Jones', 'Mary'),
      author('Williams', 'Kate'),
      author('Brown', 'Tom'),
    ];
    const result = formatAuthorsHarvard(authors);
    expect(result).toBe('Smith, J. et al.');
  });
});

describe('formatAuthorsMLA – 3+ authors', () => {
  it('formats 3 authors as first et al.', () => {
    const result = formatAuthorsMLA([
      author('Smith', 'John'),
      author('Jones', 'Mary'),
      author('Williams', 'Kate'),
    ]);
    expect(result).toBe('Smith, John, et al.');
  });

  it('formats 2 authors with "and" in direct order', () => {
    const result = formatAuthorsMLA([author('Smith', 'John'), author('Jones', 'Mary')]);
    expect(result).toContain('Smith, John, and Mary Jones');
  });
});

describe('formatAuthorAPA – edge cases', () => {
  it('handles author with only lastName', () => {
    const result = formatAuthorAPA({ lastName: 'Plato' });
    expect(result).toBe('Plato');
  });

  it('handles organization author', () => {
    const result = formatAuthorAPA({ lastName: 'World Health Organization', isOrganization: true });
    expect(result).toBe('World Health Organization');
  });

  it('includes suffix after last name', () => {
    const result = formatAuthorAPA({ lastName: 'Smith', firstName: 'John', suffix: 'Jr.' });
    expect(result).toBe('Smith, J., Jr.');
  });
});

describe('formatAuthorMLA – edge cases', () => {
  it('handles author with only lastName (first position)', () => {
    const result = formatAuthorMLA({ lastName: 'Plato' }, true);
    expect(result).toBe('Plato');
  });

  it('handles subsequent author with only lastName', () => {
    const result = formatAuthorMLA({ lastName: 'Plato' }, false);
    expect(result).toBe('Plato');
  });
});

describe('formatAuthorHarvard – edge cases', () => {
  it('handles author with only lastName', () => {
    const result = formatAuthorHarvard({ lastName: 'Aristotle' });
    expect(result).toBe('Aristotle');
  });
});

describe('formatDateAPA – season', () => {
  it('formats spring season', () => {
    expect(formatDateAPA({ year: 2023, season: 'spring' })).toBe('(2023, Spring)');
  });

  it('formats summer season', () => {
    expect(formatDateAPA({ year: 2023, season: 'summer' })).toBe('(2023, Summer)');
  });

  it('formats fall season', () => {
    expect(formatDateAPA({ year: 2023, season: 'fall' })).toBe('(2023, Fall)');
  });

  it('formats winter season', () => {
    expect(formatDateAPA({ year: 2023, season: 'winter' })).toBe('(2023, Winter)');
  });

  it('month takes precedence over season', () => {
    const result = formatDateAPA({ year: 2023, month: 6, season: 'summer' });
    expect(result).toContain('June');
    expect(result).not.toContain('Summer');
  });
});

describe('formatDateMLA – year-only', () => {
  it('returns just the year when no month', () => {
    expect(formatDateMLA({ year: 2023 })).toBe('2023');
  });

  it('returns empty string when no date', () => {
    expect(formatDateMLA(undefined)).toBe('');
  });

  it('returns empty string when year is missing', () => {
    expect(formatDateMLA({ month: 5 })).toBe('');
  });
});

describe('formatDOI – prefix handling', () => {
  it('handles uppercase DOI: prefix', () => {
    const result = formatDOI('DOI:10.1000/xyz123');
    expect(result).toBe('https://doi.org/10.1000/xyz123');
  });

  it('handles lowercase doi: prefix', () => {
    const result = formatDOI('doi:10.1000/xyz123');
    expect(result).toBe('https://doi.org/10.1000/xyz123');
  });

  it('handles doi: with space after colon', () => {
    const result = formatDOI('doi: 10.1000/xyz123');
    expect(result).toBe('https://doi.org/10.1000/xyz123');
  });

  it('returns http URL unchanged', () => {
    const result = formatDOI('https://doi.org/10.1000/xyz123');
    expect(result).toBe('https://doi.org/10.1000/xyz123');
  });

  it('returns empty string for missing doi', () => {
    expect(formatDOI(undefined)).toBe('');
  });
});

describe('toSentenceCase – multiple colons', () => {
  it('capitalizes first word of each subtitle segment', () => {
    const result = toSentenceCase('Main Title: First Subtitle: Second Subtitle');
    expect(result).toContain('Main title');
    expect(result).toContain('First subtitle');
    expect(result).toContain('Second subtitle');
  });

  it('handles empty string', () => {
    expect(toSentenceCase('')).toBe('');
  });

  it('lowercases words after the first in each segment', () => {
    const result = toSentenceCase('THE GREAT GATSBY');
    expect(result).toBe('The great gatsby');
  });
});
