/**
 * Source Types for OpenCitation
 * 11 different source types for citations
 */

export const SOURCE_TYPES = [
  'book',
  'journal',
  'website',
  'blog',
  'newspaper',
  'video',
  'image',
  'film',
  'tv-series',
  'tv-episode',
  'miscellaneous',
] as const;

export type SourceType = (typeof SOURCE_TYPES)[number];

export const SOURCE_TYPE_LABELS: Record<SourceType, string> = {
  book: 'Book',
  journal: 'Academic Journal',
  website: 'Website',
  blog: 'Blog',
  newspaper: 'Newspaper',
  video: 'Video',
  image: 'Image',
  film: 'Film',
  'tv-series': 'TV Series',
  'tv-episode': 'TV Episode',
  miscellaneous: 'Miscellaneous',
};

export const SOURCE_TYPE_DESCRIPTIONS: Record<SourceType, string> = {
  book: 'Physical and eBooks',
  journal: 'Peer-reviewed articles',
  website: 'General web pages',
  blog: 'Blog posts and articles',
  newspaper: 'News articles',
  video: 'YouTube, Vimeo, online video',
  image: 'Photographs, artwork, graphics',
  film: 'Movies, documentaries',
  'tv-series': 'Television shows (whole series)',
  'tv-episode': 'Individual TV episodes',
  miscellaneous: 'Other sources',
};
