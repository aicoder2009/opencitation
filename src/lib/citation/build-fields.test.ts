import { describe, it, expect } from 'vitest';
import { buildCitationFields } from './build-fields';

describe('buildCitationFields', () => {
  describe('base fields', () => {
    it('uses provided title', () => {
      const result = buildCitationFields({ title: 'My Title' }, 'book', 'print');
      expect(result.title).toBe('My Title');
    });

    it('defaults to "Untitled" when title missing', () => {
      const result = buildCitationFields({}, 'book', 'print');
      expect(result.title).toBe('Untitled');
    });

    it('passes through sourceType and accessType', () => {
      const result = buildCitationFields({ title: 'T' }, 'journal', 'database');
      expect(result.sourceType).toBe('journal');
      expect(result.accessType).toBe('database');
    });

    it('passes through url and doi', () => {
      const result = buildCitationFields(
        { title: 'T', url: 'https://x.com', doi: '10.1/x' },
        'website',
        'web',
      );
      expect(result.url).toBe('https://x.com');
      expect(result.doi).toBe('10.1/x');
    });
  });

  describe('author parsing', () => {
    it('parses structured authors array', () => {
      const result = buildCitationFields(
        { title: 'T', authors: [{ firstName: 'Jane', lastName: 'Doe' }] },
        'book',
        'print',
      );
      expect(result.authors).toHaveLength(1);
      expect(result.authors![0]).toMatchObject({ firstName: 'Jane', lastName: 'Doe' });
    });

    it('parses plain "author" string by splitting on spaces', () => {
      const result = buildCitationFields(
        { title: 'T', author: 'John Smith' },
        'book',
        'print',
      );
      expect(result.authors).toHaveLength(1);
      expect(result.authors![0].lastName).toBe('Smith');
      expect(result.authors![0].firstName).toBe('John');
    });

    it('uses full name as lastName for single-word author', () => {
      const result = buildCitationFields(
        { title: 'T', author: 'Aristotle' },
        'book',
        'print',
      );
      expect(result.authors![0].lastName).toBe('Aristotle');
    });

    it('omits authors field when no authors provided', () => {
      const result = buildCitationFields({ title: 'T' }, 'book', 'print');
      expect(result.authors).toBeUndefined();
    });
  });

  describe('publication date parsing', () => {
    it('uses publicationDate object directly', () => {
      const result = buildCitationFields(
        { title: 'T', publicationDate: { year: 2022, month: 6 } },
        'book',
        'print',
      );
      expect(result.publicationDate).toEqual({ year: 2022, month: 6 });
    });

    it('extracts year from publishedDate string', () => {
      const result = buildCitationFields(
        { title: 'T', publishedDate: '2019-03-15' },
        'book',
        'print',
      );
      expect(result.publicationDate).toEqual({ year: 2019 });
    });

    it('omits publicationDate when not provided', () => {
      const result = buildCitationFields({ title: 'T' }, 'book', 'print');
      expect(result.publicationDate).toBeUndefined();
    });
  });

  describe('source-type-specific fields', () => {
    it('journal: includes journalTitle, volume, issue, pageRange', () => {
      const result = buildCitationFields(
        {
          title: 'Study',
          journalTitle: 'Nature',
          volume: '10',
          issue: '3',
          pageRange: '1-5',
        },
        'journal',
        'database',
      );
      expect(result.sourceType).toBe('journal');
      if (result.sourceType === 'journal') {
        expect(result.journalTitle).toBe('Nature');
        expect(result.volume).toBe('10');
        expect(result.issue).toBe('3');
        expect(result.pageRange).toBe('1-5');
      }
    });

    it('journal: defaults journalTitle to "Unknown Journal"', () => {
      const result = buildCitationFields({ title: 'Study' }, 'journal', 'database');
      if (result.sourceType === 'journal') {
        expect(result.journalTitle).toBe('Unknown Journal');
      }
    });

    it('website: includes siteName', () => {
      const result = buildCitationFields(
        { title: 'Page', siteName: 'BBC' },
        'website',
        'web',
      );
      if (result.sourceType === 'website') {
        expect(result.siteName).toBe('BBC');
      }
    });

    it('blog: includes blogName from siteName fallback', () => {
      const result = buildCitationFields(
        { title: 'Post', siteName: 'My Blog' },
        'blog',
        'web',
      );
      if (result.sourceType === 'blog') {
        expect(result.blogName).toBe('My Blog');
      }
    });

    it('book: includes isbn and edition', () => {
      const result = buildCitationFields(
        { title: 'Book', isbn: '978-0-00-000000-0', edition: '2nd' },
        'book',
        'print',
      );
      if (result.sourceType === 'book') {
        expect(result.isbn).toBe('978-0-00-000000-0');
        expect(result.edition).toBe('2nd');
      }
    });

    it('preprint: defaults repository to "arXiv"', () => {
      const result = buildCitationFields({ title: 'Paper' }, 'preprint', 'web');
      if (result.sourceType === 'preprint') {
        expect(result.repository).toBe('arXiv');
      }
    });

    it('video: includes channelName and platform', () => {
      const result = buildCitationFields(
        { title: 'Video', channelName: 'MyChan', platform: 'YouTube' },
        'video',
        'web',
      );
      if (result.sourceType === 'video') {
        expect(result.channelName).toBe('MyChan');
        expect(result.platform).toBe('YouTube');
      }
    });

    it('social-media: includes platform and postType', () => {
      const result = buildCitationFields(
        { title: 'Tweet', platform: 'Twitter', postType: 'tweet' },
        'social-media',
        'web',
      );
      if (result.sourceType === 'social-media') {
        expect(result.platform).toBe('Twitter');
        expect(result.postType).toBe('tweet');
      }
    });

    it('social-media: ignores unknown postType', () => {
      const result = buildCitationFields(
        { title: 'Post', postType: 'unknown-type' },
        'social-media',
        'web',
      );
      if (result.sourceType === 'social-media') {
        expect(result.postType).toBeUndefined();
      }
    });

    it('ai-generated: includes company and modelName', () => {
      const result = buildCitationFields(
        { title: 'Response', company: 'Anthropic', modelName: 'Claude' },
        'ai-generated',
        'web',
      );
      if (result.sourceType === 'ai-generated') {
        expect(result.company).toBe('Anthropic');
        expect(result.modelName).toBe('Claude');
      }
    });

    it('podcast-episode: defaults showName when missing', () => {
      const result = buildCitationFields(
        { title: 'Episode' },
        'podcast-episode',
        'web',
      );
      if (result.sourceType === 'podcast-episode') {
        expect(result.showName).toBe('Unknown Show');
      }
    });

    it('dataset: includes repository', () => {
      const result = buildCitationFields(
        { title: 'Data', repository: 'Zenodo' },
        'dataset',
        'web',
      );
      if (result.sourceType === 'dataset') {
        expect(result.repository).toBe('Zenodo');
      }
    });

    it('defaults to miscellaneous for unknown sourceType', () => {
      const result = buildCitationFields({ title: 'T' }, 'miscellaneous', 'print');
      expect(result.sourceType).toBe('miscellaneous');
    });
  });
});
