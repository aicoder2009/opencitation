import { describe, it, expect } from 'vitest';
import {
  formatCitation,
  getFormatter,
  formatCitations,
  generateInTextCitation,
} from './index';
import type { BookFields, CitationStyle } from '@/types/citation';

describe('Citation Engine', () => {
  const sampleBook: BookFields = {
    sourceType: 'book',
    accessType: 'print',
    title: 'Test Book',
    authors: [{ firstName: 'John', lastName: 'Smith' }],
    publisher: 'Test Publisher',
    publicationDate: { year: 2020 },
  };

  describe('formatCitation', () => {
    it('should format citation in APA style', () => {
      const result = formatCitation(sampleBook, 'apa');
      expect(result.text).toBeTruthy();
      expect(result.html).toBeTruthy();
      expect(result.text).toContain('Smith');
    });

    it('should format citation in MLA style', () => {
      const result = formatCitation(sampleBook, 'mla');
      expect(result.text).toBeTruthy();
      expect(result.html).toBeTruthy();
      expect(result.text).toContain('Smith');
    });

    it('should format citation in Chicago style', () => {
      const result = formatCitation(sampleBook, 'chicago');
      expect(result.text).toBeTruthy();
      expect(result.html).toBeTruthy();
      expect(result.text).toContain('Smith');
    });

    it('should format citation in Harvard style', () => {
      const result = formatCitation(sampleBook, 'harvard');
      expect(result.text).toBeTruthy();
      expect(result.html).toBeTruthy();
      expect(result.text).toContain('Smith');
    });

    it('should fallback to APA for unknown style', () => {
      const result = formatCitation(sampleBook, 'unknown' as CitationStyle);
      expect(result.text).toBeTruthy();
    });
  });

  describe('getFormatter', () => {
    it('should return APA formatter', () => {
      const formatter = getFormatter('apa');
      expect(typeof formatter).toBe('function');
      const result = formatter(sampleBook);
      expect(result.text).toBeTruthy();
    });

    it('should return MLA formatter', () => {
      const formatter = getFormatter('mla');
      expect(typeof formatter).toBe('function');
    });

    it('should fallback to APA for unknown style', () => {
      const formatter = getFormatter('unknown' as CitationStyle);
      expect(typeof formatter).toBe('function');
    });
  });

  describe('formatCitations', () => {
    it('should format multiple citations', () => {
      const citations = [sampleBook, sampleBook];
      const results = formatCitations(citations, 'apa');
      expect(results).toHaveLength(2);
      expect(results[0].text).toBeTruthy();
      expect(results[1].text).toBeTruthy();
    });
  });

  describe('generateInTextCitation', () => {
    it('should generate APA in-text citation', () => {
      const result = generateInTextCitation(sampleBook, 'apa');
      expect(result).toContain('Smith');
      expect(result).toContain('2020');
      expect(result).toMatch(/\(.*\)/);
    });

    it('should generate MLA in-text citation', () => {
      const result = generateInTextCitation(sampleBook, 'mla');
      expect(result).toContain('Smith');
      expect(result).toMatch(/\(.*\)/);
    });

    it('should handle multiple authors in APA', () => {
      const multiAuthor: BookFields = {
        ...sampleBook,
        authors: [
          { firstName: 'John', lastName: 'Smith' },
          { firstName: 'Jane', lastName: 'Doe' },
        ],
      };
      const result = generateInTextCitation(multiAuthor, 'apa');
      expect(result).toContain('Smith');
      expect(result).toContain('Doe');
      expect(result).toContain('&');
    });

    it('should use et al. for 3+ authors', () => {
      const multiAuthor: BookFields = {
        ...sampleBook,
        authors: [
          { firstName: 'John', lastName: 'Smith' },
          { firstName: 'Jane', lastName: 'Doe' },
          { firstName: 'Bob', lastName: 'Johnson' },
        ],
      };
      const result = generateInTextCitation(multiAuthor, 'apa');
      expect(result).toContain('et al.');
    });

    it('should handle missing authors', () => {
      const noAuthor: BookFields = {
        ...sampleBook,
        authors: undefined,
      };
      const result = generateInTextCitation(noAuthor, 'apa');
      expect(result).toBeTruthy();
    });

    it('should handle missing date', () => {
      const noDate: BookFields = {
        ...sampleBook,
        publicationDate: undefined,
      };
      const result = generateInTextCitation(noDate, 'apa');
      expect(result).toContain('n.d.');
    });
  });
});
