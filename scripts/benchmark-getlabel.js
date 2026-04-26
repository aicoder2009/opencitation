const { performance } = require('perf_hooks');

const CITATION_STYLES = [
  { value: "apa", label: "APA 7th" },
  { value: "mla", label: "MLA 9th" },
  { value: "chicago", label: "Chicago 17th" },
  { value: "harvard", label: "Harvard" },
];

const ACCESS_TYPES = [
  { value: "web", label: "Web" },
  { value: "print", label: "Print" },
  { value: "database", label: "Database" },
  { value: "app", label: "App" },
  { value: "archive", label: "Archive" },
];

const SOURCE_TYPES = [
  { value: "book", label: "Book" },
  { value: "book-chapter", label: "Book Chapter" },
  { value: "journal", label: "Journal" },
  { value: "website", label: "Website" },
  { value: "blog", label: "Blog" },
  { value: "newspaper", label: "Newspaper" },
  { value: "video", label: "Video" },
  { value: "image", label: "Image" },
  { value: "film", label: "Film" },
  { value: "tv-series", label: "TV Series" },
  { value: "tv-episode", label: "TV Episode" },
  { value: "song", label: "Song" },
  { value: "album", label: "Album" },
  { value: "podcast-episode", label: "Podcast Episode" },
  { value: "video-game", label: "Video Game" },
  { value: "artwork", label: "Artwork" },
  { value: "thesis", label: "Thesis / Dissertation" },
  { value: "conference-paper", label: "Conference Paper" },
  { value: "dataset", label: "Dataset" },
  { value: "software", label: "Software / Code" },
  { value: "preprint", label: "Preprint" },
  { value: "social-media", label: "Social Media" },
  { value: "ai-generated", label: "AI-Generated" },
  { value: "interview", label: "Interview" },
  { value: "government-report", label: "Government Report" },
  { value: "legal-case", label: "Legal Case" },
  { value: "encyclopedia", label: "Encyclopedia" },
  { value: "miscellaneous", label: "Miscellaneous" },
];

// Baseline implementations
const getStyleLabelBaseline = (value) =>
  CITATION_STYLES.find(s => s.value === value)?.label || value;

const getSourceLabelBaseline = (value) =>
  SOURCE_TYPES.find(s => s.value === value)?.label || value;

const getAccessLabelBaseline = (value) =>
  ACCESS_TYPES.find(s => s.value === value)?.label || value;

// Optimized implementations using maps
const citationStyleMap = Object.fromEntries(CITATION_STYLES.map(s => [s.value, s.label]));
const getStyleLabelOptimized = (value) => citationStyleMap[value] || value;

const sourceTypeMap = Object.fromEntries(SOURCE_TYPES.map(s => [s.value, s.label]));
const getSourceLabelOptimized = (value) => sourceTypeMap[value] || value;

const accessTypeMap = Object.fromEntries(ACCESS_TYPES.map(s => [s.value, s.label]));
const getAccessLabelOptimized = (value) => accessTypeMap[value] || value;

// Map Map implementations (Map object instead of plain object)
const citationStyleMapObj = new Map(CITATION_STYLES.map(s => [s.value, s.label]));
const getStyleLabelOptimizedMap = (value) => citationStyleMapObj.get(value) || value;

const sourceTypeMapObj = new Map(SOURCE_TYPES.map(s => [s.value, s.label]));
const getSourceLabelOptimizedMap = (value) => sourceTypeMapObj.get(value) || value;

const accessTypeMapObj = new Map(ACCESS_TYPES.map(s => [s.value, s.label]));
const getAccessLabelOptimizedMap = (value) => accessTypeMapObj.get(value) || value;


const ITERATIONS = 1000000;
const testValues = {
  style: ['apa', 'mla', 'chicago', 'harvard', 'unknown'],
  source: ['book', 'video', 'miscellaneous', 'website', 'unknown'],
  access: ['web', 'app', 'archive', 'print', 'unknown']
};

function runBenchmark() {
  console.log(`Running benchmark with ${ITERATIONS} iterations...\n`);

  // --- Baseline ---
  const startBaseline = performance.now();
  for (let i = 0; i < ITERATIONS; i++) {
    getStyleLabelBaseline(testValues.style[i % 5]);
    getSourceLabelBaseline(testValues.source[i % 5]);
    getAccessLabelBaseline(testValues.access[i % 5]);
  }
  const endBaseline = performance.now();
  const durationBaseline = endBaseline - startBaseline;

  // --- Optimized (Plain Object) ---
  const startOptimized = performance.now();
  for (let i = 0; i < ITERATIONS; i++) {
    getStyleLabelOptimized(testValues.style[i % 5]);
    getSourceLabelOptimized(testValues.source[i % 5]);
    getAccessLabelOptimized(testValues.access[i % 5]);
  }
  const endOptimized = performance.now();
  const durationOptimized = endOptimized - startOptimized;

  // --- Optimized (Map Object) ---
  const startOptimizedMap = performance.now();
  for (let i = 0; i < ITERATIONS; i++) {
    getStyleLabelOptimizedMap(testValues.style[i % 5]);
    getSourceLabelOptimizedMap(testValues.source[i % 5]);
    getAccessLabelOptimizedMap(testValues.access[i % 5]);
  }
  const endOptimizedMap = performance.now();
  const durationOptimizedMap = endOptimizedMap - startOptimizedMap;

  console.log('--- Results ---');
  console.log(`Baseline (.find): ${durationBaseline.toFixed(2)}ms`);
  console.log(`Optimized (Record): ${durationOptimized.toFixed(2)}ms`);
  console.log(`Optimized (Map): ${durationOptimizedMap.toFixed(2)}ms`);
  console.log(`\nImprovement (Record): ${((durationBaseline - durationOptimized) / durationBaseline * 100).toFixed(2)}% faster`);
  console.log(`Improvement (Map): ${((durationBaseline - durationOptimizedMap) / durationBaseline * 100).toFixed(2)}% faster`);
}

runBenchmark();
