import { describe, it, expect } from 'vitest';
import { toCSLJSON } from './csl-json';
import type { BookFields, JournalFields, WebsiteFields } from '@/types/citation';

function parse(result: string) {
  return JSON.parse(result) as unknown[];
}

describe('toCSLJSON', () => {
  it('returns a valid JSON array', () => {
    const fields: BookFields = {
      sourceType: 'book',
      accessType: 'print',
      title: 'Test Book',
      authors: [{ firstName: 'John', lastName: 'Smith' }],
      publisher: 'Pub',
      publicationDate: { year: 2020 },
    };
    const result = parse(toCSLJSON([fields]));
    expect(Array.isArray(result)).toBe(true);
    expect(result).toHaveLength(1);
  });

  it('assigns sequential item IDs', () => {
    const fields: BookFields = {
      sourceType: 'book',
      accessType: 'print',
      title: 'A',
      publisher: 'Pub',
      publicationDate: { year: 2020 },
    };
    const result = parse(toCSLJSON([fields, fields])) as Array<{ id: string }>;
    expect(result[0].id).toBe('item-1');
    expect(result[1].id).toBe('item-2');
  });

  describe('type mapping', () => {
    it('maps book to "book"', () => {
      const fields: BookFields = {
        sourceType: 'book',
        accessType: 'print',
        title: 'Book',
        publicationDate: { year: 2020 },
      };
      const [item] = parse(toCSLJSON([fields])) as Array<{ type: string }>;
      expect(item.type).toBe('book');
    });

    it('maps journal to "article-journal"', () => {
      const fields: JournalFields = {
        sourceType: 'journal',
        accessType: 'database',
        title: 'Article',
        journalTitle: 'Science',
        publicationDate: { year: 2022 },
      };
      const [item] = parse(toCSLJSON([fields])) as Array<{ type: string }>;
      expect(item.type).toBe('article-journal');
    });

    it('maps website to "webpage"', () => {
      const fields: WebsiteFields = {
        sourceType: 'website',
        accessType: 'web',
        title: 'Page',
        url: 'https://example.com',
        publicationDate: { year: 2023 },
      };
      const [item] = parse(toCSLJSON([fields])) as Array<{ type: string }>;
      expect(item.type).toBe('webpage');
    });

    it('falls back to "document" for unmapped types', () => {
      const fields = {
        sourceType: 'miscellaneous',
        accessType: 'print',
        title: 'Misc',
        publicationDate: { year: 2020 },
      } as never;
      const [item] = parse(toCSLJSON([fields])) as Array<{ type: string }>;
      expect(item.type).toBe('document');
    });
  });

  describe('author formatting', () => {
    it('includes family and given names', () => {
      const fields: BookFields = {
        sourceType: 'book',
        accessType: 'print',
        title: 'Book',
        authors: [
          { firstName: 'Jane', lastName: 'Doe' },
          { firstName: 'John', lastName: 'Smith' },
        ],
        publicationDate: { year: 2020 },
      };
      const [item] = parse(toCSLJSON([fields])) as Array<{
        author: Array<{ family: string; given: string }>;
      }>;
      expect(item.author).toHaveLength(2);
      expect(item.author[0]).toEqual({ family: 'Doe', given: 'Jane' });
      expect(item.author[1]).toEqual({ family: 'Smith', given: 'John' });
    });

    it('omits given when only last name present', () => {
      const fields: BookFields = {
        sourceType: 'book',
        accessType: 'print',
        title: 'Book',
        authors: [{ lastName: 'WHO', isOrganization: true }],
        publicationDate: { year: 2020 },
      };
      const [item] = parse(toCSLJSON([fields])) as Array<{
        author: Array<{ family: string; given?: string }>;
      }>;
      expect(item.author[0].given).toBeUndefined();
      expect(item.author[0].family).toBe('WHO');
    });

    it('omits author field when no authors', () => {
      const fields: BookFields = {
        sourceType: 'book',
        accessType: 'print',
        title: 'Anonymous',
        publicationDate: { year: 2020 },
      };
      const [item] = parse(toCSLJSON([fields])) as Array<{ author?: unknown }>;
      expect(item.author).toBeUndefined();
    });
  });

  describe('date formatting', () => {
    it('includes full date parts for complete dates', () => {
      const fields: BookFields = {
        sourceType: 'book',
        accessType: 'print',
        title: 'Book',
        publicationDate: { year: 2020, month: 3, day: 15 },
      };
      const [item] = parse(toCSLJSON([fields])) as Array<{
        issued: { 'date-parts': number[][] };
      }>;
      expect(item.issued['date-parts'][0]).toEqual([2020, 3, 15]);
    });

    it('includes only year when month absent', () => {
      const fields: BookFields = {
        sourceType: 'book',
        accessType: 'print',
        title: 'Book',
        publicationDate: { year: 2021 },
      };
      const [item] = parse(toCSLJSON([fields])) as Array<{
        issued: { 'date-parts': number[][] };
      }>;
      expect(item.issued['date-parts'][0]).toEqual([2021]);
    });

    it('omits issued when no publication date', () => {
      const fields: BookFields = {
        sourceType: 'book',
        accessType: 'print',
        title: 'Undated',
      };
      const [item] = parse(toCSLJSON([fields])) as Array<{ issued?: unknown }>;
      expect(item.issued).toBeUndefined();
    });

    it('includes accessed date', () => {
      const fields: WebsiteFields = {
        sourceType: 'website',
        accessType: 'web',
        title: 'Page',
        url: 'https://example.com',
        accessDate: { year: 2024, month: 1, day: 5 },
        publicationDate: { year: 2023 },
      };
      const [item] = parse(toCSLJSON([fields])) as Array<{
        accessed: { 'date-parts': number[][] };
      }>;
      expect(item.accessed['date-parts'][0]).toEqual([2024, 1, 5]);
    });
  });

  describe('container title', () => {
    it('sets container-title from journalTitle for journals', () => {
      const fields: JournalFields = {
        sourceType: 'journal',
        accessType: 'database',
        title: 'An Article',
        journalTitle: 'Nature',
        publicationDate: { year: 2022 },
      };
      const [item] = parse(toCSLJSON([fields])) as Array<{ 'container-title': string }>;
      expect(item['container-title']).toBe('Nature');
    });

    it('sets container-title from siteName for websites', () => {
      const fields: WebsiteFields = {
        sourceType: 'website',
        accessType: 'web',
        title: 'Article',
        siteName: 'BBC News',
        url: 'https://bbc.com',
        publicationDate: { year: 2023 },
      };
      const [item] = parse(toCSLJSON([fields])) as Array<{ 'container-title': string }>;
      expect(item['container-title']).toBe('BBC News');
    });
  });

  describe('identifiers and metadata', () => {
    it('includes DOI and URL', () => {
      const fields: JournalFields = {
        sourceType: 'journal',
        accessType: 'database',
        title: 'Study',
        journalTitle: 'Science',
        doi: '10.1000/abc',
        url: 'https://example.com',
        publicationDate: { year: 2020 },
      };
      const [item] = parse(toCSLJSON([fields])) as Array<{ DOI: string; URL: string }>;
      expect(item.DOI).toBe('10.1000/abc');
      expect(item.URL).toBe('https://example.com');
    });

    it('includes volume, issue, and page range', () => {
      const fields: JournalFields = {
        sourceType: 'journal',
        accessType: 'database',
        title: 'Study',
        journalTitle: 'Lancet',
        volume: '10',
        issue: '2',
        pageRange: '50-60',
        publicationDate: { year: 2020 },
      };
      const [item] = parse(toCSLJSON([fields])) as Array<{
        volume: string;
        issue: string;
        page: string;
      }>;
      expect(item.volume).toBe('10');
      expect(item.issue).toBe('2');
      expect(item.page).toBe('50-60');
    });
  });

  it('handles an empty citations list', () => {
    const result = parse(toCSLJSON([]));
    expect(result).toEqual([]);
  });
});
