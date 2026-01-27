import { describe, it, expect } from 'vitest';
import { formatAPA } from './apa';
import type { BookFields, JournalFields, WebsiteFields } from '@/types/citation';

describe('APA Formatter', () => {
  describe('Book formatting', () => {
    it('should format a basic book citation', () => {
      const fields: BookFields = {
        sourceType: 'book',
        accessType: 'print',
        title: 'The Great Gatsby',
        authors: [{ firstName: 'F. Scott', lastName: 'Fitzgerald' }],
        publisher: 'Scribner',
        publicationDate: { year: 1925 },
      };

      const result = formatAPA(fields);
      expect(result.text).toContain('Fitzgerald');
      expect(result.text).toContain('1925');
      expect(result.text).toContain('The great gatsby');
      expect(result.text).toContain('Scribner');
    });

    it('should format book with multiple authors', () => {
      const fields: BookFields = {
        sourceType: 'book',
        accessType: 'print',
        title: 'Test Book',
        authors: [
          { firstName: 'John', lastName: 'Smith' },
          { firstName: 'Jane', lastName: 'Doe' },
        ],
        publisher: 'Test Publisher',
        publicationDate: { year: 2020 },
      };

      const result = formatAPA(fields);
      expect(result.text).toContain('Smith');
      expect(result.text).toContain('Doe');
      expect(result.text).toContain('&');
    });

    it('should format book with subtitle', () => {
      const fields: BookFields = {
        sourceType: 'book',
        accessType: 'print',
        title: 'Test Book',
        subtitle: 'A Subtitle',
        authors: [{ firstName: 'John', lastName: 'Smith' }],
        publisher: 'Test Publisher',
        publicationDate: { year: 2020 },
      };

      const result = formatAPA(fields);
      expect(result.text).toContain('Test book: A subtitle');
    });

    it('should format book with edition', () => {
      const fields: BookFields = {
        sourceType: 'book',
        accessType: 'print',
        title: 'Test Book',
        authors: [{ firstName: 'John', lastName: 'Smith' }],
        edition: '2nd ed.',
        publisher: 'Test Publisher',
        publicationDate: { year: 2020 },
      };

      const result = formatAPA(fields);
      expect(result.text).toContain('2nd ed.');
    });

    it('should include DOI when available', () => {
      const fields: BookFields = {
        sourceType: 'book',
        accessType: 'web',
        title: 'Test Book',
        authors: [{ firstName: 'John', lastName: 'Smith' }],
        publisher: 'Test Publisher',
        publicationDate: { year: 2020 },
        doi: '10.1000/test',
      };

      const result = formatAPA(fields);
      expect(result.text).toContain('doi.org');
      expect(result.html).toContain('<a href');
    });
  });

  describe('Journal formatting', () => {
    it('should format a basic journal article', () => {
      const fields: JournalFields = {
        sourceType: 'journal',
        accessType: 'database',
        title: 'Test Article',
        authors: [{ firstName: 'John', lastName: 'Smith' }],
        journalTitle: 'Test Journal',
        volume: '42',
        issue: '3',
        pageRange: '123-145',
        publicationDate: { year: 2020 },
        doi: '10.1000/test',
      };

      const result = formatAPA(fields);
      expect(result.text).toContain('Smith');
      expect(result.text).toContain('2020');
      expect(result.text).toContain('Test article');
      expect(result.text).toContain('Test Journal');
      expect(result.text).toContain('42');
      expect(result.text).toContain('3');
      expect(result.text).toContain('123-145');
    });

    it('should format journal with article number instead of pages', () => {
      const fields: JournalFields = {
        sourceType: 'journal',
        accessType: 'web',
        title: 'Test Article',
        authors: [{ firstName: 'John', lastName: 'Smith' }],
        journalTitle: 'Test Journal',
        volume: '42',
        articleNumber: 'e12345',
        publicationDate: { year: 2020 },
      };

      const result = formatAPA(fields);
      expect(result.text).toContain('Article e12345');
    });
  });

  describe('Website formatting', () => {
    it('should format a basic website citation', () => {
      const fields: WebsiteFields = {
        sourceType: 'website',
        accessType: 'web',
        title: 'Test Page',
        siteName: 'Test Site',
        url: 'https://example.com',
        publicationDate: { year: 2020, month: 1, day: 15 },
      };

      const result = formatAPA(fields);
      expect(result.text).toContain('Test Page');
      expect(result.text).toContain('Test Site');
      expect(result.text).toContain('example.com');
      expect(result.html).toContain('<a href');
    });

    it('should use site name as author when no authors provided', () => {
      const fields: WebsiteFields = {
        sourceType: 'website',
        accessType: 'web',
        title: 'Test Page',
        siteName: 'Test Site',
        url: 'https://example.com',
        publicationDate: { year: 2020 },
      };

      const result = formatAPA(fields);
      expect(result.text).toContain('Test Site');
    });
  });

  describe('Edge cases', () => {
    it('should handle missing authors gracefully', () => {
      const fields: BookFields = {
        sourceType: 'book',
        accessType: 'print',
        title: 'Test Book',
        publisher: 'Test Publisher',
        publicationDate: { year: 2020 },
      };

      const result = formatAPA(fields);
      expect(result.text).toBeTruthy();
    });

    it('should handle missing publication date', () => {
      const fields: BookFields = {
        sourceType: 'book',
        accessType: 'print',
        title: 'Test Book',
        authors: [{ firstName: 'John', lastName: 'Smith' }],
        publisher: 'Test Publisher',
      };

      const result = formatAPA(fields);
      expect(result.text).toContain('n.d.');
    });

    it('should return both text and HTML versions', () => {
      const fields: BookFields = {
        sourceType: 'book',
        accessType: 'print',
        title: 'Test Book',
        authors: [{ firstName: 'John', lastName: 'Smith' }],
        publisher: 'Test Publisher',
        publicationDate: { year: 2020 },
      };

      const result = formatAPA(fields);
      expect(result.text).toBeTruthy();
      expect(result.html).toBeTruthy();
      expect(result.html).toContain('<em>');
    });
  });
});
