import { describe, it, expect } from 'vitest';
import { formatAPA } from './apa';
import type {
  TVSeriesFields,
  TVEpisodeFields,
  FilmFields,
  ImageFields,
  BookFields,
  JournalFields,
  WebsiteFields,
  VideoFields,
  BlogFields,
  NewspaperFields,
  MiscellaneousFields,
} from '@/types/citation';

function a(lastName: string, firstName?: string) {
  return { lastName, firstName };
}

// ── TV Series ─────────────────────────────────────────────────────────────────

describe('APA TV Series – year range', () => {
  const base: TVSeriesFields = {
    sourceType: 'tv-series',
    accessType: 'web',
    title: 'Breaking Bad',
    creators: [a('Gilligan', 'Vince')],
    network: 'AMC',
  };

  it('yearStart only → shows yearStart–present', () => {
    const { text } = formatAPA({ ...base, yearStart: 2008 });
    expect(text).toContain('(2008–present)');
  });

  it('yearStart + yearEnd → shows range', () => {
    const { text } = formatAPA({ ...base, yearStart: 2008, yearEnd: 2013 });
    expect(text).toContain('(2008–2013)');
  });

  it('no yearStart → falls back to publicationDate', () => {
    const { text } = formatAPA({ ...base, publicationDate: { year: 2008 } });
    expect(text).toContain('(2008)');
    expect(text).not.toContain('–present');
  });

  it('executiveProducers used when no creators', () => {
    const { text } = formatAPA({
      ...base,
      creators: undefined,
      executiveProducers: [a('Shore', 'David')],
      yearStart: 2004,
    });
    expect(text).toContain('Shore, D.');
    expect(text).toContain('Executive Producer');
  });

  it('plural role label when multiple creators', () => {
    const { text } = formatAPA({
      ...base,
      creators: [a('Gilligan', 'Vince'), a('Cooper', 'Sam')],
      yearStart: 2008,
    });
    expect(text).toContain('Creators');
  });
});

// ── TV Episode ────────────────────────────────────────────────────────────────

describe('APA TV Episode – season/episode combos', () => {
  const base: TVEpisodeFields = {
    sourceType: 'tv-episode',
    accessType: 'web',
    title: 'Ozymandias',
    episodeTitle: 'Ozymandias',
    seriesTitle: 'Breaking Bad',
    network: 'AMC',
    publicationDate: { year: 2013 },
  };

  it('both season and episodeNumber', () => {
    const { text } = formatAPA({ ...base, season: 5, episodeNumber: 14 });
    expect(text).toContain('Season 5, Episode 14');
  });

  it('season only', () => {
    const { text } = formatAPA({ ...base, season: 5 });
    expect(text).toContain('Season 5');
    expect(text).not.toContain('Episode');
  });

  it('episodeNumber only', () => {
    const { text } = formatAPA({ ...base, episodeNumber: 14 });
    expect(text).toContain('Episode 14');
    expect(text).not.toContain('Season');
  });

  it('no season or episode', () => {
    const { text } = formatAPA({ ...base });
    expect(text).not.toContain('Season');
    expect(text).not.toContain('Episode');
    expect(text).toContain('[TV series episode]');
  });

  it('writers and directors both present', () => {
    const { text } = formatAPA({
      ...base,
      writers: [a('Gilligan', 'Vince')],
      directors: [a('Johnson', 'Rian')],
    });
    expect(text).toContain('(Writer)');
    expect(text).toContain('(Director)');
    expect(text).toContain('&');
  });

  it('writers only', () => {
    const { text } = formatAPA({ ...base, writers: [a('Gilligan', 'Vince')] });
    expect(text).toContain('(Writer)');
    expect(text).not.toContain('Director');
  });

  it('directors only', () => {
    const { text } = formatAPA({ ...base, directors: [a('Johnson', 'Rian')] });
    expect(text).toContain('(Director)');
    expect(text).not.toContain('Writer');
  });

  it('streamingService preferred over network', () => {
    const { text } = formatAPA({ ...base, network: 'AMC', streamingService: 'Netflix' });
    expect(text).toContain('Netflix');
  });
});

// ── Film ──────────────────────────────────────────────────────────────────────

describe('APA Film – no directors', () => {
  it('omits director label when directors array is empty', () => {
    const fields: FilmFields = {
      sourceType: 'film',
      accessType: 'web',
      title: 'Inception',
      directors: [],
      productionCompany: 'Warner Bros.',
      publicationDate: { year: 2010 },
    };
    const { text } = formatAPA(fields);
    expect(text).not.toContain('Director');
    expect(text).toContain('Warner Bros.');
    expect(text).toContain('[Film]');
  });

  it('plural Directors label for multiple directors', () => {
    const fields: FilmFields = {
      sourceType: 'film',
      accessType: 'print',
      title: 'Test Film',
      directors: [a('Nolan', 'Christopher'), a('Smith', 'Jane')],
      publicationDate: { year: 2020 },
    };
    const { text } = formatAPA(fields);
    expect(text).toContain('Directors');
  });
});

// ── Image ─────────────────────────────────────────────────────────────────────

describe('APA Image – museum/collection/location', () => {
  const base: ImageFields = {
    sourceType: 'image',
    accessType: 'web',
    title: 'Starry Night',
    authors: [a('van Gogh', 'Vincent')],
    publicationDate: { year: 1889 },
  };

  it('museum without location — no comma after museum name', () => {
    const { text } = formatAPA({ ...base, museum: 'MoMA' });
    expect(text).toContain('MoMA');
    expect(text).not.toMatch(/MoMA,/);
  });

  it('museum with location', () => {
    const { text } = formatAPA({ ...base, museum: 'MoMA', location: 'New York' });
    expect(text).toContain('MoMA, New York');
  });

  it('collection used when no museum', () => {
    const { text } = formatAPA({ ...base, collection: 'National Gallery' });
    expect(text).toContain('National Gallery');
  });

  it('no museum or collection – omits location block', () => {
    const { text } = formatAPA({ ...base, location: 'Paris' });
    expect(text).not.toContain('Paris');
  });

  it('uses medium field in brackets', () => {
    const { text } = formatAPA({ ...base, medium: 'Oil on canvas' });
    expect(text).toContain('[Oil on canvas]');
  });

  it('falls back to imageType when no medium', () => {
    const { text } = formatAPA({ ...base, imageType: 'photograph' });
    expect(text).toContain('[photograph]');
  });

  it('defaults to Image when neither medium nor imageType', () => {
    const { text } = formatAPA({ ...base });
    expect(text).toContain('[Image]');
  });
});

// ── Book ──────────────────────────────────────────────────────────────────────

describe('APA Book – publisher and URL edges', () => {
  const base: BookFields = {
    sourceType: 'book',
    accessType: 'print',
    title: 'Test Book',
    authors: [a('Smith', 'Jane')],
    publicationDate: { year: 2020 },
  };

  it('omits publisher block when absent', () => {
    const { text } = formatAPA({ ...base, publisher: undefined });
    expect(text).not.toContain('Publisher');
  });

  it('includes URL when no DOI', () => {
    const { text } = formatAPA({ ...base, url: 'https://example.com', doi: undefined });
    expect(text).toContain('https://example.com');
  });

  it('prefers DOI over URL', () => {
    const { text } = formatAPA({ ...base, doi: '10.1000/xyz', url: 'https://example.com' });
    expect(text).toContain('doi.org');
    expect(text).not.toContain('example.com');
  });
});

// ── Journal ───────────────────────────────────────────────────────────────────

describe('APA Journal – volume and issue edges', () => {
  const base: JournalFields = {
    sourceType: 'journal',
    accessType: 'web',
    title: 'Quantum Effects',
    authors: [a('Smith', 'Jane')],
    journalTitle: 'Nature',
    publicationDate: { year: 2020 },
  };

  it('no volume skips volume and issue', () => {
    const { text } = formatAPA({ ...base });
    expect(text).not.toMatch(/Nature, \d/);
  });

  it('volume without issue omits issue parentheses', () => {
    const { text } = formatAPA({ ...base, volume: '10' });
    expect(text).toContain('Nature, 10');
    expect(text).not.toMatch(/10\(/);
  });

  it('volume with issue includes issue in parentheses', () => {
    const { text } = formatAPA({ ...base, volume: '10', issue: '3' });
    expect(text).toContain('10(3)');
  });
});

// ── Descriptor-in-title edge cases ───────────────────────────────────────────
// These tests guard against the .replace() stripping bug: when a user's own
// title text contains the same substring as the APA descriptor (e.g. "[Video]"),
// the HTML <em> wrapping must cover the full title, not truncate it.

describe('APA HTML – descriptor substring in user title', () => {
  it('video title containing "[Video]" wraps full title in <em>', () => {
    const fields: VideoFields = {
      sourceType: 'video',
      accessType: 'web',
      title: 'My [Video] Tutorial',
      platform: 'YouTube',
      url: 'https://youtu.be/example',
      uploadDate: { year: 2024 },
    };
    const { html } = formatAPA(fields);
    // Full sentence-cased title must be inside <em>
    expect(html).toContain('<em>My [video] tutorial</em>');
    // Descriptor must appear outside <em>
    expect(html).toContain('</em> [Video].');
  });

  it('film title containing "[Film]" wraps full title in <em>', () => {
    const fields: FilmFields = {
      sourceType: 'film',
      accessType: 'web',
      title: 'The [Film] Experiment',
      publicationDate: { year: 2022 },
    };
    const { html } = formatAPA(fields);
    expect(html).toContain('<em>The [film] experiment</em>');
    expect(html).toContain('</em> [Film].');
  });

  it('TV series title containing "[TV series]" wraps full title in <em>', () => {
    const fields: TVSeriesFields = {
      sourceType: 'tv-series',
      accessType: 'web',
      title: 'The [TV series] Chronicles',
      publicationDate: { year: 2021 },
    };
    const { html } = formatAPA(fields);
    expect(html).toContain('<em>The [tv series] chronicles</em>');
    expect(html).toContain('</em> [TV series].');
  });

  it('TV episode title containing "[TV series episode]" keeps full episode info intact', () => {
    const fields: TVEpisodeFields = {
      sourceType: 'tv-episode',
      accessType: 'web',
      title: 'The [TV series episode] Pilot',
      episodeTitle: 'The [TV series episode] Pilot',
      seriesTitle: 'Test Show',
      publicationDate: { year: 2020 },
    };
    const { html } = formatAPA(fields);
    // The episode info string must appear before the descriptor bracket
    expect(html).toContain('[TV series episode].');
    // The raw title text must survive intact (sentence-cased)
    expect(html).toContain('The [tv series episode] pilot');
  });

  it('image title containing the medium string wraps full title in <em>', () => {
    const fields: ImageFields = {
      sourceType: 'image',
      accessType: 'web',
      title: 'Abstract [Oil on canvas] Study',
      medium: 'Oil on canvas',
      authors: [a('Smith', 'Jane')],
      publicationDate: { year: 2000 },
    };
    const { html } = formatAPA(fields);
    expect(html).toContain('<em>Abstract [oil on canvas] study</em>');
    expect(html).toContain('</em> [Oil on canvas].');
  });
});

// ── Website ───────────────────────────────────────────────────────────────────

describe('APA Website – author and siteName combos', () => {
  const base: WebsiteFields = {
    sourceType: 'website',
    accessType: 'web',
    title: 'Home Page',
    url: 'https://example.com',
    publicationDate: { year: 2023 },
  };

  it('authors + siteName: siteName appears as separate element', () => {
    const { text } = formatAPA({
      ...base,
      authors: [a('Smith', 'Jane')],
      siteName: 'Example Site',
    });
    expect(text).toContain('Smith, J.');
    expect(text).toContain('Example Site');
  });

  it('no authors + siteName: siteName used as author', () => {
    const { text } = formatAPA({ ...base, siteName: 'Example Site' });
    // siteName appears at start (as author substitute) and is NOT repeated
    const count = (text.match(/Example Site/g) || []).length;
    expect(count).toBe(1);
  });

  it('no authors + no siteName: no author element', () => {
    const { text } = formatAPA({ ...base });
    // Starts with the date
    expect(text.trim()).toMatch(/^\(/);
  });
});

// ── Organization-name author period ───────────────────────────────────────────
// APA 7 requires a period after the author block before the date parenthetical.
// Organization names and bare-last-name authors don't end with "." on their own,
// so each formatter must append one: "World Health Organization. (2020)."

describe('APA – organization-name author period', () => {
  it('book: org author gets period before date', () => {
    const fields: BookFields = {
      sourceType: 'book',
      accessType: 'print',
      title: 'Health Report',
      authors: [{ lastName: 'World Health Organization', isOrganization: true }],
      publicationDate: { year: 2020 },
    };
    expect(formatAPA(fields).text).toContain('World Health Organization. (2020)');
  });

  it('journal: org author gets period before date', () => {
    const fields: JournalFields = {
      sourceType: 'journal',
      accessType: 'web',
      title: 'Study Results',
      authors: [{ lastName: 'CDC', isOrganization: true }],
      journalTitle: 'Test Journal',
      publicationDate: { year: 2021 },
    };
    expect(formatAPA(fields).text).toContain('CDC. (2021)');
  });

  it('website: org author gets period before date', () => {
    const fields: WebsiteFields = {
      sourceType: 'website',
      accessType: 'web',
      title: 'Home Page',
      authors: [{ lastName: 'UNICEF', isOrganization: true }],
      url: 'https://unicef.org',
      publicationDate: { year: 2022 },
    };
    expect(formatAPA(fields).text).toContain('UNICEF. (2022)');
  });

  it('website: siteName used as author gets period before date', () => {
    const fields: WebsiteFields = {
      sourceType: 'website',
      accessType: 'web',
      title: 'Home Page',
      siteName: 'Example Site',
      url: 'https://example.com',
      publicationDate: { year: 2022 },
    };
    expect(formatAPA(fields).text).toContain('Example Site. (2022)');
  });

  it('blog: org author gets period before date', () => {
    const fields: BlogFields = {
      sourceType: 'blog',
      accessType: 'web',
      title: 'Policy Update',
      authors: [{ lastName: 'Government Agency', isOrganization: true }],
      blogName: 'Official Blog',
      url: 'https://example.gov',
      publicationDate: { year: 2023 },
    };
    expect(formatAPA(fields).text).toContain('Government Agency. (2023)');
  });

  it('newspaper: org author gets period before date', () => {
    const fields: NewspaperFields = {
      sourceType: 'newspaper',
      accessType: 'web',
      title: 'Breaking News',
      authors: [{ lastName: 'Staff Reporter', isOrganization: true }],
      newspaperTitle: 'Daily Times',
      publicationDate: { year: 2022 },
    };
    expect(formatAPA(fields).text).toContain('Staff Reporter. (2022)');
  });

  it('image: org author gets period before date', () => {
    const fields: ImageFields = {
      sourceType: 'image',
      accessType: 'web',
      title: 'Collection Photo',
      authors: [{ lastName: 'MoMA Archive', isOrganization: true }],
      publicationDate: { year: 2019 },
    };
    expect(formatAPA(fields).text).toContain('MoMA Archive. (2019)');
  });

  it('miscellaneous: org author gets period before date', () => {
    const fields: MiscellaneousFields = {
      sourceType: 'miscellaneous',
      accessType: 'web',
      title: 'Annual Report',
      authors: [{ lastName: 'Company Name', isOrganization: true }],
      publicationDate: { year: 2021 },
    };
    expect(formatAPA(fields).text).toContain('Company Name. (2021)');
  });

  it('video: org author without channelName gets period before date', () => {
    const fields: VideoFields = {
      sourceType: 'video',
      accessType: 'web',
      title: 'Tutorial',
      authors: [{ lastName: 'NASA', isOrganization: true }],
      platform: 'YouTube',
      url: 'https://youtu.be/example',
      uploadDate: { year: 2023 },
    };
    expect(formatAPA(fields).text).toContain('NASA. (2023)');
  });
});
