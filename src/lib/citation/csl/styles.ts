/**
 * Registry of bundled CSL styles. Each style's XML is code-split via a dynamic
 * import() so it (and the citeproc engine) only load when a CSL style is used.
 *
 * To add a style: add its filename to scripts/fetch-csl-styles.mjs, regenerate,
 * then add an entry here.
 */

export interface CslStyleDef {
  id: string;
  label: string;
  /** Discipline shown as a grouping hint in the picker. */
  discipline: string;
  load: () => Promise<{ default: string }>;
}

export const CSL_STYLES: CslStyleDef[] = [
  {
    id: 'ieee',
    label: 'IEEE',
    discipline: 'Engineering & Computer Science',
    load: () => import('./styles/ieee'),
  },
  {
    id: 'vancouver',
    label: 'Vancouver',
    discipline: 'Medicine & Health',
    load: () => import('./styles/vancouver'),
  },
  {
    id: 'ama',
    label: 'AMA (American Medical Association)',
    discipline: 'Medicine & Health',
    load: () => import('./styles/ama'),
  },
  {
    id: 'acs',
    label: 'ACS (American Chemical Society)',
    discipline: 'Chemistry',
    load: () => import('./styles/acs'),
  },
  {
    id: 'nature',
    label: 'Nature',
    discipline: 'Sciences',
    load: () => import('./styles/nature'),
  },
  {
    id: 'apsa',
    label: 'APSA (American Political Science Assoc.)',
    discipline: 'Social Sciences',
    load: () => import('./styles/apsa'),
  },
  {
    id: 'chicago-author-date',
    label: 'Chicago (Author-Date)',
    discipline: 'Humanities & Social Sciences',
    load: () => import('./styles/chicago-author-date'),
  },
];

const CSL_STYLE_IDS = new Set(CSL_STYLES.map((s) => s.id));

export function isCslStyle(style: string): boolean {
  return CSL_STYLE_IDS.has(style);
}

export function cslStyleLabel(id: string): string {
  return CSL_STYLES.find((s) => s.id === id)?.label ?? id;
}
