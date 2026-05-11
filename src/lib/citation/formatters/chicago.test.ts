import { describe, it, expect } from 'vitest';
import { formatChicago } from './chicago';
import type { BookFields, JournalFields, WebsiteFields } from '@/types/citation';

describe('Chicago Formatter', () => {
  describe('Book formatting', () => {
    it('should format a basic book citation', () => {
      const fields: BookFields = {
        sourceType: 'book',
        accessType: 'print',
        title: 'The Great Gatsby',
        authors: [{ firstName: 'F. Scott', lastName: 'Fitzgerald' }],
        publisher: 'Scribner',
        publicationPlace: 'New York',
        publicationDate: { year: 1925 },
      };

      const result = formatChicago(fields);
      expect(result.text).toContain('Fitzgerald');
      expect(result.text).toContain('1925');
      expect(result.text).toContain('The Great Gatsby');
      expect(result.text).toContain('Scribner');
    });

    it('should place editor in author slot for edited volumes', () => {
      const fields: BookFields = {
        sourceType: 'book',
        accessType: 'print',
        title: 'Handbook of Psychology',
        editors: [{ firstName: 'John', lastName: 'Smith' }],
        publisher: 'Wiley',
        publicationDate: { year: 2020 },
      };
      const result = formatChicago(fields);
      expect(result.text).toContain('Smith, John, ed.');
      // Must not produce double period ("ed..") after editor label
      expect(result.text).not.toContain('ed..');
    });

    it('should use eds. (not eds..) for multiple editors in author slot', () => {
      const fields: BookFields = {
        sourceType: 'book',
        accessType: 'print',
        title: 'Handbook of Psychology',
        editors: [
          { firstName: 'John', lastName: 'Smith' },
          { firstName: 'Jane', lastName: 'Doe' },
        ],
        publisher: 'Wiley',
        publicationDate: { year: 2020 },
      };
      const result = formatChicago(fields);
      expect(result.text).toContain('eds.');
      expect(result.text).not.toContain('eds..');
    });

    it('should use Oxford comma and "and" for two-author books', () => {
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
      const result = formatChicago(fields);
      expect(result.text).toContain('Smith, John, and Jane Doe');
    });

    it('should format place and publisher correctly', () => {
      const fields: BookFields = {
        sourceType: 'book',
        accessType: 'print',
        title: 'Test Book',
        authors: [{ firstName: 'John', lastName: 'Smith' }],
        publisher: 'Test Publisher',
        publicationPlace: 'New York',
        publicationDate: { year: 2020 },
      };

      const result = formatChicago(fields);
      expect(result.text).toContain('New York');
      expect(result.text).toContain('Test Publisher');
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

      const result = formatChicago(fields);
      expect(result.text).toContain('"Test Article."');
      expect(result.text).toContain('Test Journal');
      expect(result.text).toContain('42');
      expect(result.text).toContain('no. 3');
      expect(result.text).toContain('123-145');
    });

    it('strips "doi:" prefix and produces a clean https://doi.org/ URL', () => {
      const fields: JournalFields = {
        sourceType: 'journal',
        accessType: 'database',
        title: 'Test Article',
        authors: [{ firstName: 'John', lastName: 'Smith' }],
        journalTitle: 'Test Journal',
        volume: '1',
        publicationDate: { year: 2020 },
        doi: 'doi:10.1000/test',
      };

      const result = formatChicago(fields);
      expect(result.text).toContain('https://doi.org/10.1000/test');
      expect(result.text).not.toContain('doi:doi');
      expect(result.html).toContain('<a href="https://doi.org/10.1000/test">');
    });
  });

  describe('HTML safety', () => {
    it('should escape URL in href attribute to prevent XSS', () => {
      const fields: WebsiteFields = {
        sourceType: 'website',
        accessType: 'web',
        title: 'Test Page',
        siteName: 'Test Site',
        url: 'https://example.com/"onmouseover="alert(1)',
        publicationDate: { year: 2020 },
      };

      const result = formatChicago(fields);
      expect(result.html).not.toContain('href="https://example.com/"onmouseover');
      expect(result.html).toContain('&quot;');
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

      const result = formatChicago(fields);
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

      const result = formatChicago(fields);
      expect(result.text).toContain('Accessed');
    });
  });
});
