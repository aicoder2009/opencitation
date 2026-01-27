/**
 * Access Types for OpenCitation
 * 5 different ways a source can be accessed
 */

export const ACCESS_TYPES = [
  'web',
  'print',
  'database',
  'app',
  'archive',
] as const;

export type AccessType = (typeof ACCESS_TYPES)[number];

export const ACCESS_TYPE_LABELS: Record<AccessType, string> = {
  web: 'Web',
  print: 'Print',
  database: 'Database',
  app: 'App',
  archive: 'Archive',
};

export const ACCESS_TYPE_DESCRIPTIONS: Record<AccessType, string> = {
  web: 'Direct website access',
  print: 'Physical copy (book, newspaper, etc.)',
  database: 'Academic database (JSTOR, ProQuest, etc.)',
  app: 'Mobile/desktop application',
  archive: 'Internet Archive, Wayback Machine, etc.',
};
