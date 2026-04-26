const NETWORK_DELAY_MS = 50;

async function mockApiCall(name, items = 1) {
  return new Promise(resolve => setTimeout(resolve, NETWORK_DELAY_MS * items));
}

async function runSequential(citations) {
  const start = Date.now();
  for (const c of citations) {
    await mockApiCall('deleteCitation');
  }
  await mockApiCall('deleteList');
  return Date.now() - start;
}

async function runParallel(citations) {
  const start = Date.now();
  await Promise.all(citations.map(c => mockApiCall('deleteCitation')));
  await mockApiCall('deleteList');
  return Date.now() - start;
}

async function runBatch(citations) {
  const start = Date.now();
  // DynamoDB BatchWriteItem can do up to 25 items per request
  const chunks = [];
  for (let i = 0; i < citations.length; i += 25) {
    chunks.push(citations.slice(i, i + 25));
  }
  await Promise.all(chunks.map(chunk => mockApiCall('batchWrite')));
  await mockApiCall('deleteList');
  return Date.now() - start;
}

async function main() {
  const citationCount = 100;
  const citations = Array(citationCount).fill({ id: 'test' });

  console.log(`Simulating deletion of 1 list with ${citationCount} citations`);
  console.log(`Assuming network delay of ${NETWORK_DELAY_MS}ms per request`);

  const seqTime = await runSequential(citations);
  console.log(`Sequential: ${seqTime}ms`);

  const parTime = await runParallel(citations);
  console.log(`Parallel (Promise.all): ${parTime}ms`);

  const batchTime = await runBatch(citations);
  console.log(`BatchWriteItem (25 at a time): ${batchTime}ms`);
}

main();
