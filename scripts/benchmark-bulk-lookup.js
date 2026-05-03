const { performance } = require('perf_hooks');

const items = Array.from({ length: 20 }, (_, i) => `item-${i}`);

// Simulate a network delay of 100ms
const fakeFetch = async (item) => {
  return new Promise(resolve => setTimeout(() => resolve(`result-${item}`), 100));
};

async function sequentialProcess() {
  const results = [];
  for (const item of items) {
    const res = await fakeFetch(item);
    results.push(res);
  }
  return results;
}

async function concurrentProcess() {
  const promises = items.map(item => fakeFetch(item));
  const results = await Promise.all(promises);
  return results;
}

async function runBenchmark() {
  console.log('Running benchmark for sequential vs concurrent processing...');

  const startSeq = performance.now();
  await sequentialProcess();
  const endSeq = performance.now();
  const durationSeq = endSeq - startSeq;

  const startCon = performance.now();
  await concurrentProcess();
  const endCon = performance.now();
  const durationCon = endCon - startCon;

  console.log('--- Results ---');
  console.log(`Sequential: ${durationSeq.toFixed(2)}ms`);
  console.log(`Concurrent (Promise.all): ${durationCon.toFixed(2)}ms`);
  console.log(`Improvement: ${((durationSeq - durationCon) / durationSeq * 100).toFixed(2)}% faster`);
}

runBenchmark();
