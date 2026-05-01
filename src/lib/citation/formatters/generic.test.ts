import { describe, it, expect } from 'vitest';
import { formatGeneric, descriptorFor, type Style } from './generic';
import type {
  SongFields,
  ThesisFields,
  ConferencePaperFields,
  SoftwareFields,
  PreprintFields,
  SocialMediaFields,
  AIGeneratedFields,
  ArtworkFields,
  GovernmentReportFields,
  InterviewFields,
  LegalCaseFields,
} from '@/types/citation';

describe('descriptorFor', () => {
  it('returns "Song" for song type', () => {
    const fields = { sourceType: 'song' } as SongFields;
    expect(descriptorFor(fields)).toBe('Song');
  });

  it('returns "Album" for album type', () => {
    expect(descriptorFor({ sourceType: 'album' } as never)).toBe('Album');
  });

  it('returns "Audio podcast episode" for podcast-episode', () => {
    expect(descriptorFor({ sourceType: 'podcast-episode' } as never)).toBe('Audio podcast episode');
  });

  it('returns "Data set" for dataset', () => {
    expect(descriptorFor({ sourceType: 'dataset' } as never)).toBe('Data set');
  });

  it('returns "Video game" for video-game', () => {
    expect(descriptorFor({ sourceType: 'video-game' } as never)).toBe('Video game');
  });

  it('returns medium for artwork when medium set', () => {
    const fields = { sourceType: 'artwork', medium: 'Oil on canvas' } as ArtworkFields;
    expect(descriptorFor(fields)).toBe('Oil on canvas');
  });

  it('returns "Artwork" for artwork without medium', () => {
    const fields = { sourceType: 'artwork' } as ArtworkFields;
    expect(descriptorFor(fields)).toBe('Artwork');
  });

  describe('thesis', () => {
    it('returns "Doctoral dissertation" with institution', () => {
      const fields: ThesisFields = {
        sourceType: 'thesis',
        accessType: 'web',
        title: 'T',
        degree: 'doctoral',
        institution: 'MIT',
      };
      expect(descriptorFor(fields)).toBe('Doctoral dissertation, MIT');
    });

    it('returns "Master\'s thesis" for masters', () => {
      const fields: ThesisFields = {
        sourceType: 'thesis',
        accessType: 'web',
        title: 'T',
        degree: 'masters',
      };
      expect(descriptorFor(fields)).toBe("Master's thesis");
    });

    it('returns "Thesis" for unknown degree', () => {
      const fields = { sourceType: 'thesis', degree: undefined } as never;
      expect(descriptorFor(fields)).toBe('Thesis');
    });
  });

  describe('software', () => {
    it('includes version when present', () => {
      const fields: SoftwareFields = {
        sourceType: 'software',
        accessType: 'web',
        title: 'App',
        version: '3.2.1',
      };
      expect(descriptorFor(fields)).toBe('Computer software, Version 3.2.1');
    });

    it('returns base label without version', () => {
      const fields: SoftwareFields = {
        sourceType: 'software',
        accessType: 'web',
        title: 'App',
      };
      expect(descriptorFor(fields)).toBe('Computer software');
    });
  });

  describe('preprint', () => {
    it('includes repository when present', () => {
      const fields: PreprintFields = {
        sourceType: 'preprint',
        accessType: 'web',
        title: 'P',
        repository: 'bioRxiv',
      };
      expect(descriptorFor(fields)).toBe('Preprint, bioRxiv');
    });
  });

  describe('social-media', () => {
    it('returns "Tweet" for tweet postType', () => {
      const fields = { sourceType: 'social-media', postType: 'tweet' } as SocialMediaFields;
      expect(descriptorFor(fields)).toBe('Tweet');
    });

    it('returns platform post label when platform is set', () => {
      const fields = {
        sourceType: 'social-media',
        platform: 'Instagram',
        postType: undefined,
      } as SocialMediaFields;
      expect(descriptorFor(fields)).toBe('Instagram post');
    });

    it('returns generic label when no platform or postType', () => {
      const fields = { sourceType: 'social-media' } as SocialMediaFields;
      expect(descriptorFor(fields)).toBe('Social media post');
    });
  });

  describe('ai-generated', () => {
    it('combines company and model version', () => {
      const fields: AIGeneratedFields = {
        sourceType: 'ai-generated',
        accessType: 'web',
        title: 'Response',
        company: 'Anthropic',
        modelVersion: 'Claude 3',
      };
      expect(descriptorFor(fields)).toBe('Large language model, Anthropic, version Claude 3');
    });
  });

  describe('interview', () => {
    it('returns "Broadcast interview" for broadcast type', () => {
      const fields = { sourceType: 'interview', interviewType: 'broadcast' } as InterviewFields;
      expect(descriptorFor(fields)).toBe('Broadcast interview');
    });

    it('returns "Personal interview" for personal type', () => {
      const fields = { sourceType: 'interview', interviewType: 'personal' } as InterviewFields;
      expect(descriptorFor(fields)).toBe('Personal interview');
    });
  });

  it('returns "Government report" for government-report', () => {
    const fields = { sourceType: 'government-report' } as GovernmentReportFields;
    expect(descriptorFor(fields)).toBe('Government report');
  });

  it('returns "Legal case" for legal-case', () => {
    const fields = { sourceType: 'legal-case' } as LegalCaseFields;
    expect(descriptorFor(fields)).toBe('Legal case');
  });

  it('returns "Encyclopedia entry" for encyclopedia', () => {
    expect(descriptorFor({ sourceType: 'encyclopedia' } as never)).toBe('Encyclopedia entry');
  });

  it('returns empty string for unrecognized type', () => {
    expect(descriptorFor({ sourceType: 'miscellaneous' } as never)).toBe('');
  });
});

describe('formatGeneric', () => {
  const styles: Style[] = ['apa', 'mla', 'chicago', 'harvard'];

  it('includes author, date, title, and descriptor in output', () => {
    const fields: SongFields = {
      sourceType: 'song',
      accessType: 'web',
      title: 'Bohemian Rhapsody',
      authors: [{ firstName: 'Freddie', lastName: 'Mercury' }],
      publicationDate: { year: 1975 },
    };
    for (const style of styles) {
      const result = formatGeneric(fields, style);
      expect(result.text).toContain('Mercury');
      expect(result.text).toContain('1975');
      expect(result.text).toContain('Bohemian Rhapsody');
      expect(result.text).toContain('[Song]');
    }
  });

  it('includes subtitle when present', () => {
    const fields: SoftwareFields = {
      sourceType: 'software',
      accessType: 'web',
      title: 'VS Code',
      subtitle: 'Code Editor',
      version: '1.0',
      publicationDate: { year: 2024 },
    };
    const result = formatGeneric(fields, 'apa');
    expect(result.text).toContain('VS Code: Code Editor');
  });

  it('includes publisher when present', () => {
    const fields: SoftwareFields = {
      sourceType: 'software',
      accessType: 'web',
      title: 'App',
      publisher: 'Microsoft',
      publicationDate: { year: 2022 },
    };
    const result = formatGeneric(fields, 'apa');
    expect(result.text).toContain('Microsoft');
  });

  it('includes URL as link in HTML output', () => {
    const fields: SoftwareFields = {
      sourceType: 'software',
      accessType: 'web',
      title: 'App',
      url: 'https://example.com',
      publicationDate: { year: 2022 },
    };
    const result = formatGeneric(fields, 'apa');
    expect(result.html).toContain('<a href="https://example.com">');
  });

  it('prefers DOI over URL', () => {
    const fields: PreprintFields = {
      sourceType: 'preprint',
      accessType: 'web',
      title: 'Study',
      doi: '10.1000/xyz',
      url: 'https://fallback.com',
      publicationDate: { year: 2023 },
    };
    const result = formatGeneric(fields, 'apa');
    expect(result.text).toContain('doi.org/10.1000/xyz');
    expect(result.text).not.toContain('fallback.com');
  });

  it('italicizes title in HTML output', () => {
    const fields: SongFields = {
      sourceType: 'song',
      accessType: 'web',
      title: 'My Song',
      publicationDate: { year: 2020 },
    };
    const result = formatGeneric(fields, 'apa');
    expect(result.html).toContain('<em>');
  });

  it('returns both text and html', () => {
    const fields: SongFields = {
      sourceType: 'song',
      accessType: 'web',
      title: 'Track',
      publicationDate: { year: 2020 },
    };
    const result = formatGeneric(fields, 'apa');
    expect(result.text).toBeTruthy();
    expect(result.html).toBeTruthy();
  });

  it('handles missing author gracefully', () => {
    const fields: SongFields = {
      sourceType: 'song',
      accessType: 'web',
      title: 'Anonymous Track',
      publicationDate: { year: 2020 },
    };
    const result = formatGeneric(fields, 'apa');
    expect(result.text).toContain('Anonymous Track');
  });

  it('song extras include album and label', () => {
    const fields: SongFields = {
      sourceType: 'song',
      accessType: 'web',
      title: 'Track',
      album: 'Greatest Hits',
      label: 'EMI',
      publicationDate: { year: 1990 },
    };
    const result = formatGeneric(fields, 'apa');
    expect(result.text).toContain('Greatest Hits');
    expect(result.text).toContain('EMI');
    expect(result.html).toContain('<em>Greatest Hits</em>');
  });

  it('conference-paper extras include proceedings title and pages', () => {
    const fields: ConferencePaperFields = {
      sourceType: 'conference-paper',
      accessType: 'web',
      title: 'My Talk',
      proceedingsTitle: 'Proceedings of ICML',
      pageRange: '1-10',
      publicationDate: { year: 2022 },
    };
    const result = formatGeneric(fields, 'apa');
    expect(result.text).toContain('Proceedings of ICML');
    expect(result.text).toContain('pp. 1-10');
  });

  it('government-report extras include report number', () => {
    const fields: GovernmentReportFields = {
      sourceType: 'government-report',
      accessType: 'web',
      title: 'Report',
      reportNumber: 'DOE-2024-001',
      publicationDate: { year: 2024 },
    };
    const result = formatGeneric(fields, 'apa');
    expect(result.text).toContain('Report No. DOE-2024-001');
  });
});
