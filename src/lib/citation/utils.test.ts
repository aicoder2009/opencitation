import { describe, it, expect } from 'vitest';
import {
  formatAuthorAPA,
  formatAuthorMLA,
  formatAuthorChicago,
  formatAuthorHarvard,
  formatAuthorsAPA,
  formatAuthorsMLA,
  formatAuthorsChicago,
  formatAuthorsHarvard,
  formatDateAPA,
  formatDateMLA,
  formatDateChicago,
  formatDateHarvard,
  escapeHtml,
  italic,
  formatUrl,
  formatDOI,
  toSentenceCase,
} from './utils';
import type { Author, CitationDate } from '@/types/citation';

describe('Citation Utilities', () => {
  describe('Author formatting', () => {
    it('should format author for APA style', () => {
      const author: Author = {
        firstName: 'John',
        middleName: 'Michael',
        lastName: 'Smith',
      };
      expect(formatAuthorAPA(author)).toBe('Smith, J. M.');
    });

    it('should format author for MLA style', () => {
      const author: Author = {
        firstName: 'John',
        middleName: 'Michael',
        lastName: 'Smith',
      };
      expect(formatAuthorMLA(author, true)).toBe('Smith, John Michael');
    });

    it('should format author for Chicago style', () => {
      const author: Author = {
        firstName: 'John',
        middleName: 'Michael',
        lastName: 'Smith',
      };
      expect(formatAuthorChicago(author, true)).toBe('Smith, John Michael');
    });

    it('should format author for Harvard style', () => {
      const author: Author = {
        firstName: 'John',
        middleName: 'Michael',
        lastName: 'Smith',
      };
      expect(formatAuthorHarvard(author)).toBe('Smith, J.M.');
    });

    it('should handle organization authors', () => {
      const org: Author = {
        lastName: 'World Health Organization',
        isOrganization: true,
      };
      expect(formatAuthorAPA(org)).toBe('World Health Organization');
      expect(formatAuthorMLA(org)).toBe('World Health Organization');
    });

    it('should handle authors with suffixes', () => {
      const author: Author = {
        firstName: 'John',
        lastName: 'Smith',
        suffix: 'Jr.',
      };
      expect(formatAuthorAPA(author)).toBe('Smith, J., Jr.');
    });
  });

  describe('Multiple authors formatting', () => {
    const authors: Author[] = [
      { firstName: 'John', lastName: 'Smith' },
      { firstName: 'Jane', lastName: 'Doe' },
    ];

    it('should format two authors for APA', () => {
      const result = formatAuthorsAPA(authors);
      expect(result).toContain('Smith');
      expect(result).toContain('Doe');
      expect(result).toContain('&');
    });

    it('should format two authors for MLA', () => {
      const result = formatAuthorsMLA(authors);
      expect(result).toContain('Smith');
      expect(result).toContain('and');
      expect(result).toContain('Doe');
    });

    it('should format two authors for Chicago', () => {
      const result = formatAuthorsChicago(authors);
      expect(result).toContain('Smith');
      expect(result).toContain('and');
      expect(result).toContain('Doe');
    });

    it('should format two authors for Harvard', () => {
      const result = formatAuthorsHarvard(authors);
      expect(result).toContain('Smith');
      expect(result).toContain('and');
      expect(result).toContain('Doe');
    });

    it('should use et al. for 3+ authors in MLA', () => {
      const manyAuthors: Author[] = [
        { firstName: 'John', lastName: 'Smith' },
        { firstName: 'Jane', lastName: 'Doe' },
        { firstName: 'Bob', lastName: 'Johnson' },
      ];
      const result = formatAuthorsMLA(manyAuthors);
      expect(result).toContain('et al.');
    });
  });

  describe('Date formatting', () => {
    it('should format full date for APA', () => {
      const date: CitationDate = { year: 2020, month: 1, day: 15 };
      expect(formatDateAPA(date)).toBe('(2020, January 15)');
    });

    it('should format year only for APA', () => {
      const date: CitationDate = { year: 2020 };
      expect(formatDateAPA(date)).toBe('(2020)');
    });

    it('should return n.d. for missing date in APA', () => {
      expect(formatDateAPA()).toBe('(n.d.)');
    });

    it('should format date for MLA', () => {
      const date: CitationDate = { year: 2020, month: 1, day: 15 };
      expect(formatDateMLA(date)).toBe('15 Jan. 2020');
    });

    it('should format date for Chicago', () => {
      const date: CitationDate = { year: 2020, month: 1, day: 15 };
      expect(formatDateChicago(date)).toBe('January 15, 2020');
    });

    it('should format date for Harvard', () => {
      const date: CitationDate = { year: 2020, month: 1, day: 15 };
      expect(formatDateHarvard(date)).toBe('15 January 2020');
    });
  });

  describe('HTML utilities', () => {
    it('should escape HTML characters', () => {
      expect(escapeHtml('<script>alert("xss")</script>')).toBe(
        '&lt;script&gt;alert(&quot;xss&quot;)&lt;/script&gt;'
      );
    });

    it('should wrap text in italic tags', () => {
      expect(italic('Test Title')).toBe('<em>Test Title</em>');
    });
  });

  describe('URL and DOI formatting', () => {
    it('should format URL correctly', () => {
      expect(formatUrl('https://example.com/')).toBe('https://example.com');
      expect(formatUrl('https://example.com')).toBe('https://example.com');
    });

    it('should format DOI correctly', () => {
      expect(formatDOI('10.1000/test')).toBe('https://doi.org/10.1000/test');
      expect(formatDOI('doi:10.1000/test')).toBe('https://doi.org/10.1000/test');
      expect(formatDOI('https://doi.org/10.1000/test')).toBe('https://doi.org/10.1000/test');
    });
  });

  describe('Text utilities', () => {
    it('should convert to sentence case', () => {
      expect(toSentenceCase('THE GREAT GATSBY')).toBe('The great gatsby');
      expect(toSentenceCase('test title')).toBe('Test title');
    });
  });
});
