import { describe, it, expect } from 'vitest';
import { toCslJson } from './to-csl-json';
import type { CitationFields } from '@/types/citation';

describe('toCslJson', () => {
  it('maps a book with a personal author', () => {
    const fields: CitationFields = {
      sourceType: 'book',
      accessType: 'print',
      title: 'The Great Gatsby',
      authors: [{ firstName: 'F. Scott', lastName: 'Fitzgerald' }],
      publisher: 'Scribner',
      publicationDate: { year: 1925 },
      isbn: '9780743273565',
      edition: '2nd',
    };
    const item = toCslJson(fields);
    expect(item.type).toBe('book');
    expect(item.title).toBe('The Great Gatsby');
    expect(item.author).toEqual([{ family: 'Fitzgerald', given: 'F. Scott' }]);
    expect(item.publisher).toBe('Scribner');
    expect(item.issued).toEqual({ 'date-parts': [[1925]] });
    expect(item.ISBN).toBe('9780743273565');
    expect(item.edition).toBe('2nd');
  });

  it('renders organization authors as literal names', () => {
    const fields: CitationFields = {
      sourceType: 'book',
      accessType: 'print',
      title: 'Constitution',
      authors: [{ lastName: 'World Health Organization', isOrganization: true }],
    };
    expect(toCslJson(fields).author).toEqual([
      { literal: 'World Health Organization' },
    ]);
  });

  it('combines first and middle names and keeps the suffix', () => {
    const fields: CitationFields = {
      sourceType: 'book',
      accessType: 'print',
      title: 'X',
      authors: [
        { firstName: 'Martin', middleName: 'Luther', lastName: 'King', suffix: 'Jr.' },
      ],
    };
    expect(toCslJson(fields).author).toEqual([
      { family: 'King', given: 'Martin Luther', suffix: 'Jr.' },
    ]);
  });

  it('maps a journal article with container, locators and DOI', () => {
    const fields: CitationFields = {
      sourceType: 'journal',
      accessType: 'web',
      title: 'On the Electrodynamics of Moving Bodies',
      journalTitle: 'Annalen der Physik',
      authors: [{ firstName: 'Albert', lastName: 'Einstein' }],
      volume: '17',
      issue: '10',
      pageRange: '891-921',
      doi: '10.1002/andp.19053221004',
      publicationDate: { year: 1905, month: 6 },
    };
    const item = toCslJson(fields);
    expect(item.type).toBe('article-journal');
    expect(item['container-title']).toBe('Annalen der Physik');
    expect(item.volume).toBe('17');
    expect(item.issue).toBe('10');
    expect(item.page).toBe('891-921');
    expect(item.DOI).toBe('10.1002/andp.19053221004');
    expect(item.issued).toEqual({ 'date-parts': [[1905, 6]] });
  });

  it('maps a book chapter to chapter with editors as container editors', () => {
    const fields: CitationFields = {
      sourceType: 'book-chapter',
      accessType: 'print',
      title: 'Chapter One',
      bookTitle: 'A Big Edited Book',
      bookEditors: [{ firstName: 'Ed', lastName: 'Itor' }],
      authors: [{ firstName: 'Al', lastName: 'Pha' }],
      pageRange: '1-10',
    };
    const item = toCslJson(fields);
    expect(item.type).toBe('chapter');
    expect(item.title).toBe('Chapter One');
    expect(item['container-title']).toBe('A Big Edited Book');
    expect(item.editor).toEqual([{ family: 'Itor', given: 'Ed' }]);
    expect(item.author).toEqual([{ family: 'Pha', given: 'Al' }]);
    expect(item.page).toBe('1-10');
  });

  it('falls back to the director as author for films', () => {
    const fields: CitationFields = {
      sourceType: 'film',
      accessType: 'web',
      title: 'Inception',
      directors: [{ firstName: 'Christopher', lastName: 'Nolan' }],
      publicationDate: { year: 2010 },
    };
    const item = toCslJson(fields);
    expect(item.type).toBe('motion_picture');
    expect(item.author).toEqual([{ family: 'Nolan', given: 'Christopher' }]);
  });

  it('appends a subtitle to the title', () => {
    const fields: CitationFields = {
      sourceType: 'book',
      accessType: 'print',
      title: 'Sapiens',
      subtitle: 'A Brief History of Humankind',
    };
    expect(toCslJson(fields).title).toBe(
      'Sapiens: A Brief History of Humankind'
    );
  });

  it('maps seasons to CSL numeric seasons', () => {
    const fields: CitationFields = {
      sourceType: 'journal',
      accessType: 'web',
      title: 'X',
      journalTitle: 'J',
      publicationDate: { year: 2021, season: 'spring' },
    };
    expect(toCslJson(fields).issued).toEqual({
      'date-parts': [[2021]],
      season: 1,
    });
  });

  it('tags preprints with the preprint genre and repository container', () => {
    const fields: CitationFields = {
      sourceType: 'preprint',
      accessType: 'web',
      title: 'A New Method',
      repository: 'arXiv',
      authors: [{ firstName: 'Jane', lastName: 'Doe' }],
      publicationDate: { year: 2023 },
    };
    const item = toCslJson(fields);
    expect(item.type).toBe('article');
    expect(item.genre).toBe('preprint');
    expect(item['container-title']).toBe('arXiv');
  });

  it('captures website access dates and URLs', () => {
    const fields: CitationFields = {
      sourceType: 'website',
      accessType: 'web',
      title: 'A Page',
      siteName: 'Example',
      url: 'https://example.com/page',
      accessDate: { year: 2024, month: 1, day: 5 },
    };
    const item = toCslJson(fields);
    expect(item.type).toBe('webpage');
    expect(item['container-title']).toBe('Example');
    expect(item.URL).toBe('https://example.com/page');
    expect(item.accessed).toEqual({ 'date-parts': [[2024, 1, 5]] });
  });

  it('omits issued when there is no date', () => {
    const fields: CitationFields = {
      sourceType: 'book',
      accessType: 'print',
      title: 'Undated',
    };
    expect(toCslJson(fields).issued).toBeUndefined();
  });
});
