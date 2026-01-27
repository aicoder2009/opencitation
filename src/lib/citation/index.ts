/**
 * OpenCitation - Citation Engine
 *
 * Main entry point for citation formatting functionality
 */

import type {
  CitationFields,
  CitationStyle,
  FormattedCitation,
} from '@/types/citation';

import { formatAPA } from './formatters/apa';
import { formatMLA } from './formatters/mla';
import { formatChicago } from './formatters/chicago';
import { formatHarvard } from './formatters/harvard';

/**
 * Format a citation in the specified style
 *
 * @param fields - The citation fields to format
 * @param style - The citation style to use
 * @returns FormattedCitation with both text and HTML versions
 *
 * @example
 * ```ts
 * const citation = formatCitation({
 *   sourceType: 'book',
 *   accessType: 'print',
 *   title: 'The Great Gatsby',
 *   authors: [{ firstName: 'F. Scott', lastName: 'Fitzgerald' }],
 *   publisher: 'Scribner',
 *   publicationDate: { year: 1925 },
 * }, 'apa');
 *
 * console.log(citation.text);
 * // "Fitzgerald, F. S. (1925). The great gatsby. Scribner."
 * ```
 */
export function formatCitation(
  fields: CitationFields,
  style: CitationStyle
): FormattedCitation {
  switch (style) {
    case 'apa':
      return formatAPA(fields);
    case 'mla':
      return formatMLA(fields);
    case 'chicago':
      return formatChicago(fields);
    case 'harvard':
      return formatHarvard(fields);
    default:
      // Fallback to APA if unknown style
      return formatAPA(fields);
  }
}

/**
 * Get a formatter function for a specific style
 *
 * @param style - The citation style
 * @returns A function that formats citations in that style
 */
export function getFormatter(style: CitationStyle) {
  const formatters = {
    apa: formatAPA,
    mla: formatMLA,
    chicago: formatChicago,
    harvard: formatHarvard,
  };

  return formatters[style] || formatAPA;
}

/**
 * Format multiple citations in the same style
 *
 * @param citationList - Array of citation fields
 * @param style - The citation style to use
 * @returns Array of formatted citations
 */
export function formatCitations(
  citationList: CitationFields[],
  style: CitationStyle
): FormattedCitation[] {
  return citationList.map((fields) => formatCitation(fields, style));
}

/**
 * Generate an in-text citation (for APA-like styles)
 * This is a simplified version - full implementation would vary by style
 *
 * @param fields - The citation fields
 * @param style - The citation style
 * @returns In-text citation string
 */
export function generateInTextCitation(
  fields: CitationFields,
  style: CitationStyle
): string {
  const year = fields.publicationDate?.year || 'n.d.';
  const authors = fields.authors || [];

  if (authors.length === 0) {
    // Use title if no authors
    const shortTitle = fields.title.split(':')[0].substring(0, 30);
    return style === 'mla' ? `("${shortTitle}")` : `("${shortTitle}", ${year})`;
  }

  const firstAuthor = authors[0].lastName;

  switch (style) {
    case 'apa':
      if (authors.length === 1) {
        return `(${firstAuthor}, ${year})`;
      } if (authors.length === 2) {
        return `(${firstAuthor} & ${authors[1].lastName}, ${year})`;
      } 
        return `(${firstAuthor} et al., ${year})`;
      

    case 'mla':
      if (authors.length === 1) {
        return `(${firstAuthor})`;
      } if (authors.length === 2) {
        return `(${firstAuthor} and ${authors[1].lastName})`;
      } 
        return `(${firstAuthor} et al.)`;
      

    case 'chicago':
      if (authors.length === 1) {
        return `(${firstAuthor} ${year})`;
      } if (authors.length <= 3) {
        const lastNames = authors.map((a) => a.lastName).join(', ');
        return `(${lastNames} ${year})`;
      } 
        return `(${firstAuthor} et al. ${year})`;
      

    case 'harvard':
      if (authors.length === 1) {
        return `(${firstAuthor}, ${year})`;
      } if (authors.length === 2) {
        return `(${firstAuthor} and ${authors[1].lastName}, ${year})`;
      } 
        return `(${firstAuthor} et al., ${year})`;
      

    default:
      return `(${firstAuthor}, ${year})`;
  }
}

// Re-export types for convenience
export type { CitationFields, CitationStyle, FormattedCitation } from '@/types/citation';

// Re-export individual formatters
export { formatAPA, formatMLA, formatChicago, formatHarvard };

// Re-export utilities
export * from './utils';
