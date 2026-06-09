/**
 * Fetches a curated set of CSL styles + the en-US locale from the official
 * Citation Style Language repositories and writes them as TypeScript modules
 * under src/lib/citation/csl/styles/ so they can be code-split via dynamic
 * import() and bundled for offline use.
 *
 * CSL styles and locales are licensed CC BY-SA 3.0 by the CSL project:
 *   https://github.com/citation-style-language/styles
 *   https://github.com/citation-style-language/locales
 *
 * Regenerate with:  node scripts/fetch-csl-styles.mjs
 */
import { writeFile, mkdir } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const STYLES_BASE =
  "https://raw.githubusercontent.com/citation-style-language/styles/master";
const LOCALES_BASE =
  "https://raw.githubusercontent.com/citation-style-language/locales/master";

// id -> source filename in the CSL styles repo
const STYLES = {
  ieee: "ieee.csl",
  vancouver: "elsevier-vancouver.csl",
  ama: "american-medical-association.csl",
  acs: "american-chemical-society.csl",
  nature: "nature.csl",
  apsa: "american-political-science-association.csl",
  "chicago-author-date": "chicago-author-date.csl",
};

const outDir = join(
  dirname(fileURLToPath(import.meta.url)),
  "..",
  "src",
  "lib",
  "citation",
  "csl",
  "styles"
);

const HEADER = (source) =>
  `// AUTO-GENERATED — do not edit by hand.\n` +
  `// Source: ${source}\n` +
  `// From the Citation Style Language project, licensed CC BY-SA 3.0.\n` +
  `// Regenerate with: node scripts/fetch-csl-styles.mjs\n\n`;

async function fetchText(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`);
  return res.text();
}

async function main() {
  await mkdir(outDir, { recursive: true });

  for (const [id, file] of Object.entries(STYLES)) {
    const url = `${STYLES_BASE}/${file}`;
    const xml = await fetchText(url);
    const module = `${HEADER(url)}const xml = ${JSON.stringify(xml)};\nexport default xml;\n`;
    await writeFile(join(outDir, `${id}.ts`), module);
    console.log(`wrote ${id}.ts (${xml.length} bytes)`);
  }

  const localeUrl = `${LOCALES_BASE}/locales-en-US.xml`;
  const localeXml = await fetchText(localeUrl);
  const localeModule = `${HEADER(localeUrl)}const xml = ${JSON.stringify(localeXml)};\nexport default xml;\n`;
  await writeFile(join(outDir, "locale-en-us.ts"), localeModule);
  console.log(`wrote locale-en-us.ts (${localeXml.length} bytes)`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
