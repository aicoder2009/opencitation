import { describe, it, expect } from 'vitest';
import { formatHarvard } from './harvard';
import type { BookFields, JournalFields, WebsiteFields } from '@/types/citation';

describe('Harvard Formatter', () => {
  describe('Author formatting', () => {
    it('should put a space between first and middle initials', () => {
      const fields: BookFields = {
        sourceType: 'book',
        accessType: 'print',
        title: 'Test Book',
        authors: [{ firstName: 'John', lastName: 'Smith', middleName: 'Michael' }],
        publisher: 'Test Publisher',
        publicationDate: { year: 2020 },
      };

      const result = formatHarvard(fields);
      // Should produce "Smith, J. M." not "Smith, J.M."
      expect(result.text).toContain('Smith, J. M.');
    });
  });

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

      const result = formatHarvard(fields);
      expect(result.text).toContain('Fitzgerald');
      expect(result.text).toContain('(1925)');
      expect(result.text).toContain('The Great Gatsby');
      expect(result.text).toContain('Scribner');
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

      const result = formatHarvard(fields);
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

      const result = formatHarvard(fields);
      expect(result.text).toContain("'Test Article'");
      expect(result.text).toContain('Test Journal');
      expect(result.text).toContain('42');
      expect(result.text).toContain('3');
      expect(result.text).toContain('pp. 123-145');
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

      const result = formatHarvard(fields);
      expect(result.html).not.toContain('href="https://example.com/"onmouseover');
      expect(result.html).toContain('&quot;');
    });

    it('should escape volume, issue and pageRange in journal HTML output', () => {
      const fields: JournalFields = {
        sourceType: 'journal',
        accessType: 'database',
        title: 'Test Article',
        authors: [{ firstName: 'John', lastName: 'Smith' }],
        journalTitle: 'Test Journal',
        volume: '42<script>alert(1)</script>',
        issue: '3<b>bold</b>',
        pageRange: '123-145<img src=x onerror=alert(1)>',
        publicationDate: { year: 2020 },
      };

      const result = formatHarvard(fields);
      expect(result.html).not.toContain('<script>');
      expect(result.html).not.toContain('<b>bold</b>');
      expect(result.html).not.toContain('<img');
      expect(result.html).toContain('&lt;script&gt;');
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
        publicationDate: { year: 2020 },
      };

      const result = formatHarvard(fields);
      expect(result.text).toContain('Test Page');
      expect(result.text).toContain('[Online]');
      expect(result.text).toContain('Available at:');
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

      const result = formatHarvard(fields);
      expect(result.text).toContain('Accessed:');
    });
  });
});
