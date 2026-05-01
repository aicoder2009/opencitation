import { describe, it, expect } from 'vitest';
import { toBibTeX, toBibTeXMultiple } from './bibtex';
import type { BookFields, JournalFields, WebsiteFields } from '@/types/citation';

describe('toBibTeX', () => {
  describe('key generation', () => {
    it('generates key from author, year, first title word', () => {
      const fields: BookFields = {
        sourceType: 'book',
        accessType: 'print',
        title: 'Great Expectations',
        authors: [{ firstName: 'Charles', lastName: 'Dickens' }],
        publisher: 'Publisher',
        publicationDate: { year: 1861 },
      };
      const result = toBibTeX(fields);
      expect(result).toContain('@book{dickens1861great,');
    });

    it('uses "unknown" when no author and "untitled" when no title', () => {
      const fields: BookFields = {
        sourceType: 'book',
        accessType: 'print',
        title: '',
        publisher: 'Publisher',
      };
      const result = toBibTeX(fields);
      expect(result).toMatch(/@book\{unknown\d+untitled,/);
    });
  });

  describe('BibTeX escaping', () => {
    it('escapes special characters in title', () => {
      const fields: BookFields = {
        sourceType: 'book',
        accessType: 'print',
        title: 'Title & More',
        authors: [{ firstName: 'A', lastName: 'B' }],
        publisher: 'Pub',
        publicationDate: { year: 2020 },
      };
      const result = toBibTeX(fields);
      expect(result).toContain('Title \\& More');
    });

    it('escapes percent signs', () => {
      const fields: BookFields = {
        sourceType: 'book',
        accessType: 'print',
        title: '100% True',
        authors: [{ firstName: 'A', lastName: 'B' }],
        publisher: 'Pub',
        publicationDate: { year: 2020 },
      };
      const result = toBibTeX(fields);
      expect(result).toContain('100\\% True');
    });
  });

  describe('organization authors', () => {
    it('wraps organization authors in extra braces', () => {
      const fields: BookFields = {
        sourceType: 'book',
        accessType: 'print',
        title: 'Report',
        authors: [{ lastName: 'World Health Organization', isOrganization: true }],
        publisher: 'WHO',
        publicationDate: { year: 2023 },
      };
      const result = toBibTeX(fields);
      expect(result).toContain('author = {{World Health Organization}}');
    });
  });

  describe('multiple authors', () => {
    it('joins authors with "and"', () => {
      const fields: BookFields = {
        sourceType: 'book',
        accessType: 'print',
        title: 'Book',
        authors: [
          { firstName: 'Alice', lastName: 'Smith' },
          { firstName: 'Bob', lastName: 'Jones' },
        ],
        publisher: 'Pub',
        publicationDate: { year: 2020 },
      };
      const result = toBibTeX(fields);
      expect(result).toContain('Smith, Alice and Jones, Bob');
    });

    it('includes middle name in author', () => {
      const fields: BookFields = {
        sourceType: 'book',
        accessType: 'print',
        title: 'Book',
        authors: [{ firstName: 'John', middleName: 'Paul', lastName: 'Smith' }],
        publisher: 'Pub',
        publicationDate: { year: 2020 },
      };
      const result = toBibTeX(fields);
      expect(result).toContain('Smith, John Paul');
    });
  });

  describe('month field', () => {
    it('outputs abbreviated month name', () => {
      const fields: BookFields = {
        sourceType: 'book',
        accessType: 'print',
        title: 'Book',
        authors: [{ firstName: 'A', lastName: 'B' }],
        publisher: 'Pub',
        publicationDate: { year: 2020, month: 3 },
      };
      const result = toBibTeX(fields);
      expect(result).toContain('month = mar');
    });
  });

  describe('book type', () => {
    it('includes publisher, isbn, and edition', () => {
      const fields: BookFields = {
        sourceType: 'book',
        accessType: 'print',
        title: 'My Book',
        authors: [{ firstName: 'A', lastName: 'B' }],
        publisher: 'Test Press',
        isbn: '978-3-16-148410-0',
        edition: '3rd ed.',
        publicationDate: { year: 2021 },
      };
      const result = toBibTeX(fields);
      expect(result).toContain('publisher = {Test Press}');
      expect(result).toContain('isbn = {978-3-16-148410-0}');
      expect(result).toContain('edition = {3rd ed.}');
    });

    it('includes DOI', () => {
      const fields: BookFields = {
        sourceType: 'book',
        accessType: 'web',
        title: 'Online Book',
        authors: [{ firstName: 'A', lastName: 'B' }],
        publisher: 'Pub',
        publicationDate: { year: 2020 },
        doi: '10.1000/xyz',
      };
      const result = toBibTeX(fields);
      expect(result).toContain('doi = {10.1000/xyz}');
    });
  });

  describe('journal type', () => {
    it('outputs @article with journal fields', () => {
      const fields: JournalFields = {
        sourceType: 'journal',
        accessType: 'database',
        title: 'A Study',
        authors: [{ firstName: 'Alice', lastName: 'Doe' }],
        journalTitle: 'Nature',
        volume: '42',
        issue: '7',
        pageRange: '100–120',
        publicationDate: { year: 2022 },
      };
      const result = toBibTeX(fields);
      expect(result).toContain('@article{');
      expect(result).toContain('journal = {Nature}');
      expect(result).toContain('volume = {42}');
      expect(result).toContain('number = {7}');
      expect(result).toContain('pages = {100–120}');
    });
  });

  describe('website type', () => {
    it('outputs @online with organization and urldate', () => {
      const fields: WebsiteFields = {
        sourceType: 'website',
        accessType: 'web',
        title: 'Home Page',
        siteName: 'Example',
        url: 'https://example.com',
        publicationDate: { year: 2023 },
        accessDate: { year: 2024, month: 6, day: 15 },
      };
      const result = toBibTeX(fields);
      expect(result).toContain('@online{');
      expect(result).toContain('organization = {Example}');
      expect(result).toContain('url = {https://example.com}');
      expect(result).toContain('urldate = {2024-06-15}');
    });
  });

  describe('trailing comma stripping', () => {
    it('does not end the last field with a comma', () => {
      const fields: BookFields = {
        sourceType: 'book',
        accessType: 'print',
        title: 'Simple Book',
        authors: [{ firstName: 'A', lastName: 'B' }],
        publisher: 'Pub',
        publicationDate: { year: 2020 },
      };
      const result = toBibTeX(fields);
      const lines = result.split('\n');
      const lastField = lines[lines.length - 2];
      expect(lastField.trim()).not.toMatch(/,$/);
    });
  });

  describe('source type mapping', () => {
    it('maps newspaper to @article', () => {
      const result = toBibTeX({
        sourceType: 'newspaper',
        accessType: 'web',
        title: 'Article',
        publicationDate: { year: 2020 },
        newspaperTitle: 'Times',
      } as never);
      expect(result).toContain('@article{');
    });

    it('maps film to @misc', () => {
      const result = toBibTeX({
        sourceType: 'film',
        accessType: 'print',
        title: 'The Movie',
        publicationDate: { year: 2000 },
      } as never);
      expect(result).toContain('@misc{');
    });

    it('maps thesis to @phdthesis', () => {
      const result = toBibTeX({
        sourceType: 'thesis',
        accessType: 'web',
        title: 'My Dissertation',
        institution: 'MIT',
        publicationDate: { year: 2019 },
      } as never);
      expect(result).toContain('@phdthesis{');
      expect(result).toContain('school = {MIT}');
    });

    it('maps conference-paper to @inproceedings', () => {
      const result = toBibTeX({
        sourceType: 'conference-paper',
        accessType: 'web',
        title: 'A Paper',
        proceedingsTitle: 'ICML 2023',
        publicationDate: { year: 2023 },
      } as never);
      expect(result).toContain('@inproceedings{');
      expect(result).toContain('booktitle = {ICML 2023}');
    });

    it('maps preprint to @unpublished with eprint field', () => {
      const result = toBibTeX({
        sourceType: 'preprint',
        accessType: 'web',
        title: 'Preprint',
        repository: 'arXiv',
        preprintId: '2301.00001',
        publicationDate: { year: 2023 },
      } as never);
      expect(result).toContain('@unpublished{');
      expect(result).toContain('eprint = {2301.00001}');
    });
  });
});

describe('toBibTeXMultiple', () => {
  it('joins multiple entries with a blank line between them', () => {
    const fields: BookFields = {
      sourceType: 'book',
      accessType: 'print',
      title: 'Book',
      authors: [{ firstName: 'A', lastName: 'B' }],
      publisher: 'Pub',
      publicationDate: { year: 2020 },
    };
    const result = toBibTeXMultiple([fields, fields]);
    expect(result).toContain('\n\n');
    const entries = result.split('\n\n');
    expect(entries).toHaveLength(2);
  });

  it('returns single entry for one citation', () => {
    const fields: BookFields = {
      sourceType: 'book',
      accessType: 'print',
      title: 'Solo',
      authors: [{ firstName: 'A', lastName: 'B' }],
      publisher: 'Pub',
      publicationDate: { year: 2020 },
    };
    const result = toBibTeXMultiple([fields]);
    expect(result).not.toContain('\n\n');
    expect(result).toContain('@book{');
  });
});
