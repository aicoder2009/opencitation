import { describe, it, expect } from 'vitest';
import { formatMLA } from './mla';
import type { BookFields, JournalFields, WebsiteFields } from '@/types/citation';

describe('MLA Formatter', () => {
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

      const result = formatMLA(fields);
      expect(result.text).toContain('Fitzgerald');
      expect(result.text).toContain('1925');
      expect(result.text).toContain('The Great Gatsby');
      expect(result.text).toContain('Scribner');
    });

    it('should format book with two authors', () => {
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

      const result = formatMLA(fields);
      expect(result.text).toContain('Smith');
      expect(result.text).toContain('and');
      expect(result.text).toContain('Doe');
    });

    it('should use et al. for three or more authors', () => {
      const fields: BookFields = {
        sourceType: 'book',
        accessType: 'print',
        title: 'Test Book',
        authors: [
          { firstName: 'John', lastName: 'Smith' },
          { firstName: 'Jane', lastName: 'Doe' },
          { firstName: 'Bob', lastName: 'Johnson' },
        ],
        publisher: 'Test Publisher',
        publicationDate: { year: 2020 },
      };

      const result = formatMLA(fields);
      expect(result.text).toContain('et al.');
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
      };

      const result = formatMLA(fields);
      expect(result.text).toContain('"Test Article."');
      expect(result.text).toContain('Test Journal');
      expect(result.text).toContain('vol. 42');
      expect(result.text).toContain('no. 3');
      expect(result.text).toContain('pp. 123-145');
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

      const result = formatMLA(fields);
      expect(result.text).toContain('"Test Page."');
      expect(result.text).toContain('Test Site');
      expect(result.text).toContain('example.com');
    });

    it('should include access date when provided', () => {
      const fields: WebsiteFields = {
        sourceType: 'website',
        accessType: 'web',
        title: 'Test Page',
        siteName: 'Test Site',
        url: 'https://example.com',
        publicationDate: { year: 2020 },
        accessDate: { year: 2024, month: 1, day: 15 },
      };

      const result = formatMLA(fields);
      expect(result.text).toContain('Accessed');
    });
  });
});
