/**
 * Generic descriptor-based formatter used for newer source types.
 *
 * Each citation style (APA/MLA/Chicago/Harvard) routes specialized types
 * (song, podcast-episode, dataset, software, preprint, social-media, etc.)
 * through this helper with a style-appropriate descriptor and any type-
 * specific extras ("performed by X", "[Version 2.1]", "In {bookTitle}").
 *
 * The output approximates each style's convention for non-print works
 * without needing a bespoke function per (style × type) combination.
 */

import type {
  CitationFields,
  FormattedCitation,
  Author,
  CitationDate,
  SongFields,
  PodcastEpisodeFields,
  ArtworkFields,
  ThesisFields,
  ConferencePaperFields,
  BookChapterFields,
  SoftwareFields,
  PreprintFields,
  SocialMediaFields,
  AIGeneratedFields,
  InterviewFields,
  GovernmentReportFields,
  LegalCaseFields,
  EncyclopediaFields,
  AlbumFields,
} from '@/types/citation';

import {
  formatAuthorsAPA,
  formatAuthorsMLA,
  formatAuthorsChicago,
  formatAuthorsHarvard,
  formatDateAPA,
  formatDateMLA,
  formatDateChicago,
  formatDateHarvard,
  formatUrl,
  escapeHtml,
  italic,
} from '../utils';

export type Style = 'apa' | 'mla' | 'chicago' | 'harvard';

/** Shared descriptor text used across all styles. */
export function descriptorFor(fields: CitationFields): string {
  switch (fields.sourceType) {
    case 'song':
      return 'Song';
    case 'album':
      return 'Album';
    case 'podcast-episode':
      return 'Audio podcast episode';
    case 'video-game':
      return 'Video game';
    case 'artwork': {
      const artwork = fields as ArtworkFields;
      return artwork.medium ? artwork.medium : 'Artwork';
    }
    case 'thesis': {
      const thesis = fields as ThesisFields;
      const degreeLabel =
        thesis.degree === 'doctoral'
          ? 'Doctoral dissertation'
          : thesis.degree === 'masters'
            ? "Master's thesis"
            : thesis.degree === 'bachelors'
              ? "Bachelor's thesis"
              : 'Thesis';
      return thesis.institution
        ? `${degreeLabel}, ${thesis.institution}`
        : degreeLabel;
    }
    case 'conference-paper': {
      const conf = fields as ConferencePaperFields;
      return conf.conferenceName
        ? `Paper presented at ${conf.conferenceName}${conf.conferenceLocation ? `, ${conf.conferenceLocation}` : ''}`
        : 'Conference paper';
    }
    case 'dataset':
      return 'Data set';
    case 'software': {
      const sw = fields as SoftwareFields;
      return sw.version ? `Computer software, Version ${sw.version}` : 'Computer software';
    }
    case 'preprint': {
      const pp = fields as PreprintFields;
      return pp.repository ? `Preprint, ${pp.repository}` : 'Preprint';
    }
    case 'social-media': {
      const sm = fields as SocialMediaFields;
      if (sm.postType === 'tweet') return 'Tweet';
      if (sm.postType === 'reel') return 'Reel';
      if (sm.postType === 'story') return 'Story';
      if (sm.postType === 'comment') return 'Comment';
      return sm.platform ? `${sm.platform} post` : 'Social media post';
    }
    case 'ai-generated': {
      const ai = fields as AIGeneratedFields;
      const parts = ['Large language model'];
      if (ai.company) parts.push(ai.company);
      if (ai.modelVersion) parts.push(`version ${ai.modelVersion}`);
      return parts.join(', ');
    }
    case 'interview': {
      const iv = fields as InterviewFields;
      return iv.interviewType === 'broadcast'
        ? 'Broadcast interview'
        : iv.interviewType === 'published'
          ? 'Published interview'
          : 'Personal interview';
    }
    case 'government-report':
      return 'Government report';
    case 'legal-case':
      return 'Legal case';
    case 'encyclopedia':
      return 'Encyclopedia entry';
    default:
      return '';
  }
}

/** Pick credits most relevant as "author" for a given type. */
function creditsForStyle(fields: CitationFields): Author[] {
  switch (fields.sourceType) {
    case 'song':
      return (fields as SongFields).performers || (fields as SongFields).composers || fields.authors || [];
    case 'album':
      return (fields as AlbumFields).performers || fields.authors || [];
    case 'podcast-episode':
      return (fields as PodcastEpisodeFields).host || fields.authors || [];
    case 'artwork':
      return (fields as ArtworkFields).artists || fields.authors || [];
    case 'interview': {
      const iv = fields as InterviewFields;
      return iv.interviewee || iv.interviewer || fields.authors || [];
    }
    case 'government-report': {
      const gr = fields as GovernmentReportFields;
      if (fields.authors && fields.authors.length > 0) return fields.authors;
      if (gr.agency)
        return [{ lastName: gr.agency, isOrganization: true } as Author];
      return [];
    }
    default:
      return fields.authors || [];
  }
}

function styleAuthors(authors: Author[], style: Style): string {
  if (!authors || authors.length === 0) return '';
  switch (style) {
    case 'apa':
      return formatAuthorsAPA(authors);
    case 'mla':
      return formatAuthorsMLA(authors);
    case 'chicago':
      return formatAuthorsChicago(authors);
    case 'harvard':
      return formatAuthorsHarvard(authors);
  }
}

function styleDate(date: CitationDate | undefined, style: Style): string {
  switch (style) {
    case 'apa':
      return formatDateAPA(date);
    case 'mla':
      return formatDateMLA(date);
    case 'chicago':
      return formatDateChicago(date);
    case 'harvard':
      return formatDateHarvard(date);
  }
}

/** Type-specific extras appended before the URL/DOI. */
function extrasFor(fields: CitationFields): { text: string; html: string } {
  const out = { text: '', html: '' };
  switch (fields.sourceType) {
    case 'song': {
      const s = fields as SongFields;
      const bits: string[] = [];
      const bitsHtml: string[] = [];
      if (s.album) {
        bits.push(`On ${s.album}.`);
        bitsHtml.push(`On ${italic(escapeHtml(s.album))}.`);
      }
      if (s.label) {
        bits.push(`${s.label}.`);
        bitsHtml.push(`${escapeHtml(s.label)}.`);
      }
      out.text = bits.join(' ');
      out.html = bitsHtml.join(' ');
      return out;
    }
    case 'album': {
      const a = fields as AlbumFields;
      if (a.label) {
        out.text = `${a.label}.`;
        out.html = `${escapeHtml(a.label)}.`;
      }
      return out;
    }
    case 'podcast-episode': {
      const p = fields as PodcastEpisodeFields;
      if (p.showName) {
        out.text = `In ${p.showName}.`;
        out.html = `In ${italic(escapeHtml(p.showName))}.`;
      }
      return out;
    }
    case 'book-chapter': {
      const bc = fields as BookChapterFields;
      const editorBit = bc.bookEditors && bc.bookEditors.length > 0
        ? `${bc.bookEditors.map((e) => e.lastName).join(', ')} (Ed.), `
        : '';
      const pageBit = bc.pageRange ? ` (pp. ${bc.pageRange})` : '';
      if (bc.bookTitle) {
        out.text = `In ${editorBit}${bc.bookTitle}${pageBit}.`;
        out.html = `In ${escapeHtml(editorBit)}${italic(escapeHtml(bc.bookTitle))}${escapeHtml(pageBit)}.`;
      }
      return out;
    }
    case 'conference-paper': {
      const cp = fields as ConferencePaperFields;
      if (cp.proceedingsTitle) {
        const pageBit = cp.pageRange ? ` (pp. ${cp.pageRange})` : '';
        out.text = `In ${cp.proceedingsTitle}${pageBit}.`;
        out.html = `In ${italic(escapeHtml(cp.proceedingsTitle))}${escapeHtml(pageBit)}.`;
      }
      return out;
    }
    case 'encyclopedia': {
      const e = fields as EncyclopediaFields;
      const editorBit = e.editors && e.editors.length > 0
        ? `${e.editors.map((ed) => ed.lastName).join(', ')} (Ed.), `
        : '';
      const pageBit = e.pageRange ? ` (pp. ${e.pageRange})` : '';
      if (e.encyclopediaTitle) {
        out.text = `In ${editorBit}${e.encyclopediaTitle}${pageBit}.`;
        out.html = `In ${escapeHtml(editorBit)}${italic(escapeHtml(e.encyclopediaTitle))}${escapeHtml(pageBit)}.`;
      }
      return out;
    }
    case 'legal-case': {
      const lc = fields as LegalCaseFields;
      const bits: string[] = [];
      if (lc.citationNumber) bits.push(lc.citationNumber);
      if (lc.court) bits.push(lc.court);
      if (lc.docketNumber) bits.push(`Docket ${lc.docketNumber}`);
      if (bits.length > 0) {
        out.text = `${bits.join(', ')}.`;
        out.html = escapeHtml(out.text);
      }
      return out;
    }
    case 'government-report': {
      const gr = fields as GovernmentReportFields;
      const bits: string[] = [];
      if (gr.reportNumber) bits.push(`Report No. ${gr.reportNumber}`);
      if (gr.series) bits.push(gr.series);
      if (bits.length > 0) {
        out.text = `${bits.join(', ')}.`;
        out.html = escapeHtml(out.text);
      }
      return out;
    }
    default:
      return out;
  }
}

/**
 * Format a citation using a generic descriptor-based layout.
 *
 * Layout: Authors. (Date). Title [Descriptor]. Extras. Publisher. URL/DOI.
 */
export function formatGeneric(
  fields: CitationFields,
  style: Style
): FormattedCitation {
  const parts: string[] = [];
  const htmlParts: string[] = [];

  const credits = creditsForStyle(fields);
  const authorText = styleAuthors(credits, style);
  if (authorText) {
    parts.push(authorText);
    htmlParts.push(escapeHtml(authorText));
  }

  const date = styleDate(fields.publicationDate, style);
  if (date) {
    parts.push(date);
    htmlParts.push(date);
  }

  let { title } = fields;
  if (fields.subtitle) title += `: ${fields.subtitle}`;
  const descriptor = descriptorFor(fields);
  const titleWithDescriptor = descriptor ? `${title} [${descriptor}]` : title;
  parts.push(`${titleWithDescriptor}.`);

  let titleHtml = italic(escapeHtml(fields.title + (fields.subtitle ? `: ${fields.subtitle}` : '')));
  if (descriptor) titleHtml += ` [${escapeHtml(descriptor)}]`;
  htmlParts.push(`${titleHtml}.`);

  const extras = extrasFor(fields);
  if (extras.text) {
    parts.push(extras.text);
    htmlParts.push(extras.html);
  }

  if (fields.publisher) {
    parts.push(`${fields.publisher}.`);
    htmlParts.push(`${escapeHtml(fields.publisher)}.`);
  }

  if (fields.doi) {
    const doi = `https://doi.org/${fields.doi.replace(/^https?:\/\/(dx\.)?doi\.org\//, '')}`;
    parts.push(doi);
    htmlParts.push(`<a href="${doi}">${escapeHtml(doi)}</a>`);
  } else if (fields.url) {
    const url = formatUrl(fields.url);
    parts.push(url);
    htmlParts.push(`<a href="${url}">${escapeHtml(url)}</a>`);
  }

  return {
    text: parts.join(' ').replace(/\s+/g, ' ').trim(),
    html: htmlParts.join(' ').replace(/\s+/g, ' ').trim(),
  };
}
