import { describe, it, expect } from 'vitest';
import { formatAPA } from './apa';
import type {
  BookFields,
  JournalFields,
  WebsiteFields,
  VideoFields,
  BlogFields,
  NewspaperFields,
  FilmFields,
  TVSeriesFields,
  TVEpisodeFields,
  MiscellaneousFields,
} from '@/types/citation';

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

    it('should place editors in author slot for edited volumes (no authors)', () => {
      const fields: BookFields = {
        sourceType: 'book',
        accessType: 'print',
        title: 'Handbook of Psychology',
        editors: [{ firstName: 'John', lastName: 'Smith' }],
        publisher: 'Wiley',
        publicationDate: { year: 2020 },
      };
      const result = formatAPA(fields);
      expect(result.text).toContain('Smith, J.');
      // APA 7: editor slot ends with a period: "(Ed.)."
      expect(result.text).toContain('(Ed.).');
    });

    it('should use Eds. for multiple editors in author slot', () => {
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
      const result = formatAPA(fields);
      // APA 7: editor slot ends with a period: "(Eds.)."
      expect(result.text).toContain('(Eds.).');
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
      // APA 7: website titles use sentence case
      expect(result.text).toContain('Test page');
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

      const result = formatAPA(fields);
      // The href must not contain a raw unescaped double-quote
      expect(result.html).not.toContain('href="https://example.com/"onmouseover');
      expect(result.html).toContain('&quot;');
    });
  });

  describe('Video formatting', () => {
    it('should format a YouTube video with author and channel name', () => {
      const fields: VideoFields = {
        sourceType: 'video',
        accessType: 'web',
        title: 'The Bigger Picture: America job market is collapsing',
        authors: [{ firstName: 'Max', lastName: 'Fisher' }],
        channelName: 'Max Fisher',
        platform: 'YouTube',
        url: 'https://youtu.be/aUM4kv0HnG0',
        uploadDate: { year: 2026, month: 4, day: 10 },
      };

      const result = formatAPA(fields);
      expect(result.text).toContain('Fisher, M. [Max Fisher].');
      expect(result.text).toContain('(2026, April 10).');
      expect(result.text).toContain('The bigger picture:');
      expect(result.text).toContain('[Video]');
      expect(result.text).toContain('YouTube');
    });

    it('should sentence-case the video title', () => {
      const fields: VideoFields = {
        sourceType: 'video',
        accessType: 'web',
        title: 'How To Build A React App From Scratch',
        platform: 'YouTube',
        url: 'https://youtu.be/example',
        uploadDate: { year: 2024 },
      };

      const result = formatAPA(fields);
      expect(result.text).toContain('How to build a react app from scratch');
    });

    it('should italicise the title in HTML output', () => {
      const fields: VideoFields = {
        sourceType: 'video',
        accessType: 'web',
        title: 'Test Video Title',
        platform: 'YouTube',
        url: 'https://youtu.be/example',
        uploadDate: { year: 2024 },
      };

      const result = formatAPA(fields);
      expect(result.html).toContain('<em>Test video title</em>');
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

  describe('Sentence case titles', () => {
    it('should apply sentence case to blog post titles', () => {
      const fields: BlogFields = {
        sourceType: 'blog',
        accessType: 'web',
        title: 'How To Improve Your Writing Skills',
        blogName: 'Write Better Blog',
        url: 'https://example.com',
        publicationDate: { year: 2021 },
      };
      const result = formatAPA(fields);
      expect(result.text).toContain('How to improve your writing skills');
    });

    it('should apply sentence case to newspaper article titles', () => {
      const fields: NewspaperFields = {
        sourceType: 'newspaper',
        accessType: 'web',
        title: 'Scientists Discover New Planet In Solar System',
        newspaperTitle: 'The Daily Times',
        publicationDate: { year: 2021 },
      };
      const result = formatAPA(fields);
      expect(result.text).toContain('Scientists discover new planet in solar system');
    });

    it('should apply sentence case to film titles', () => {
      const fields: FilmFields = {
        sourceType: 'film',
        accessType: 'web',
        title: 'The Dark Knight Rises',
        publicationDate: { year: 2012 },
      };
      const result = formatAPA(fields);
      expect(result.text).toContain('The dark knight rises');
    });

    it('should apply sentence case to TV series titles', () => {
      const fields: TVSeriesFields = {
        sourceType: 'tv-series',
        accessType: 'web',
        title: 'Breaking Bad: A Crime Drama',
        publicationDate: { year: 2008 },
      };
      const result = formatAPA(fields);
      expect(result.text).toContain('Breaking bad:');
    });

    it('should apply sentence case to TV episode titles', () => {
      const fields: TVEpisodeFields = {
        sourceType: 'tv-episode',
        accessType: 'web',
        title: 'Pilot Episode',
        episodeTitle: 'Pilot Episode',
        publicationDate: { year: 2008 },
      };
      const result = formatAPA(fields);
      expect(result.text).toContain('Pilot episode');
    });

    it('should apply sentence case to miscellaneous titles', () => {
      const fields: MiscellaneousFields = {
        sourceType: 'miscellaneous',
        accessType: 'web',
        title: 'Annual Report On Climate Change',
        publicationDate: { year: 2022 },
      };
      const result = formatAPA(fields);
      expect(result.text).toContain('Annual report on climate change');
    });
  });
});
