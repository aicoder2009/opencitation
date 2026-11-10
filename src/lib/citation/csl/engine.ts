/**
 * CSL formatting engine. Wraps citeproc-js to render a single citation in any
 * bundled CSL style, producing both a plain-text and an inline-HTML version
 * that match the shape of OpenCitation's built-in formatters.
 *
 * citeproc + the locale are statically imported here, but this whole module is
 * only ever reached via dynamic import() (see lib/citation/index.ts), so it is
 * code-split out of the main bundle and loads on demand.
 */
import CSL, { type CiteprocEngine } from 'citeproc';
import type { CitationFields, FormattedCitation } from '@/types/citation';
import { toCslJson } from './to-csl-json';
import { CSL_STYLES } from './styles';
import localeEnUs from './styles/locale-en-us';

interface CachedStyleEngine {
  engine: CiteprocEngine;
  activeId: string;
  activeItem: ReturnType<typeof toCslJson> | null;
}

const engineCache = new Map<string, Promise<CachedStyleEngine>>();
let itemCounter = 0;

function getOrCreateStyleEngine(styleId: string): Promise<CachedStyleEngine> {
  const cached = engineCache.get(styleId);
  if (cached) return cached;

  const styleDef = CSL_STYLES.find((s) => s.id === styleId);
  if (!styleDef) {
    return Promise.reject(new Error(`Unknown CSL style: "${styleId}"`));
  }

  const initPromise = styleDef.load().then((mod) => {
    const state: CachedStyleEngine = {
      activeId: 'ITEM-0',
      activeItem: null,
      engine: null as unknown as CiteprocEngine,
    };
    state.engine = new CSL.Engine(
      {
        retrieveLocale: () => localeEnUs,
        retrieveItem: (id: string) => {
          if (state.activeItem && id === state.activeId) {
            return state.activeItem;
          }
          return toCslJson(
            { sourceType: 'miscellaneous', accessType: 'web', title: '' },
            id
          );
        },
      },
      mod.default,
      'en-US'
    );
    return state;
  }).catch((err) => {
    engineCache.delete(styleId);
    throw err;
  });

  engineCache.set(styleId, initPromise);
  return initPromise;
}

async function prepareEngine(
  fields: CitationFields,
  styleId: string
): Promise<{ engine: CiteprocEngine; itemId: string }> {
  const state = await getOrCreateStyleEngine(styleId);
  const itemId = `ITEM-${++itemCounter}`;
  state.activeId = itemId;
  state.activeItem = toCslJson(fields, itemId);
  state.engine.updateItems([itemId]);
  return { engine: state.engine, itemId };
}

/** First bibliography entry as a raw string, or "" if none. */
function firstEntry(bib: ReturnType<CiteprocEngine['makeBibliography']>): string {
  if (!bib || !Array.isArray(bib) || !bib[1] || !bib[1][0]) return '';
  return bib[1][0];
}

/**
 * citeproc wraps bibliography entries in block <div>s (and, for numbered
 * styles, a number column). Flatten those to inline HTML while keeping inline
 * formatting (italics, sup, small-caps, links).
 */
function toInlineHtml(entry: string): string {
  return entry
    .replace(/<div[^>]*>/g, '')
    .replace(/<\/div>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function toPlainText(entry: string): string {
  return entry.replace(/\s+/g, ' ').trim();
}

/**
 * Format a single citation in a bundled CSL style.
 *
 * @returns text + inline HTML, matching FormattedCitation from the built-ins
 */
export async function formatCsl(
  fields: CitationFields,
  styleId: string
): Promise<FormattedCitation> {
  const { engine } = await prepareEngine(fields, styleId);

  engine.setOutputFormat('html');
  const html = toInlineHtml(firstEntry(engine.makeBibliography()));

  engine.setOutputFormat('text');
  const text = toPlainText(firstEntry(engine.makeBibliography()));

  return { text, html };
}

/**
 * In-text / inline citation for a CSL style — "[1]" for numbered styles,
 * "(Author, 2020)" for author-date styles.
 */
export async function inTextCsl(
  fields: CitationFields,
  styleId: string
): Promise<string> {
  const { engine, itemId } = await prepareEngine(fields, styleId);
  engine.setOutputFormat('text');
  const result = engine.processCitationCluster(
    { citationItems: [{ id: itemId }], properties: { noteIndex: 0 } },
    [],
    []
  );
  const rendered = result?.[1]?.[0]?.[1] ?? '';
  return rendered.trim();
}
