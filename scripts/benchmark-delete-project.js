const { performance } = require('perf_hooks');

// Simulated database operations
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function getUserLists() {
  await delay(50); // Simulate network latency for fetch
  return Array.from({ length: 20 }, (_, i) => ({
    id: `list-${i}`,
    projectId: 'test-project'
  }));
}

async function updateList() {
  await delay(20); // Simulate network latency for update
}

async function deleteProjectSequential() {
  const start = performance.now();
  const lists = await getUserLists();
  for (const list of lists) {
    if (list.projectId === 'test-project') {
      await updateList();
    }
  }
  await delay(20); // delete project
  const end = performance.now();
  return end - start;
}

async function deleteProjectConcurrent() {
  const start = performance.now();
  const lists = await getUserLists();

  const updatePromises = lists
    .filter(list => list.projectId === 'test-project')
    .map(list => updateList());

  await Promise.all(updatePromises);
  await delay(20); // delete project

  const end = performance.now();
  return end - start;
}

async function runBenchmark() {
  console.log('Running sequential benchmark...');
  let seqTime = 0;
  for (let i = 0; i < 5; i++) seqTime += await deleteProjectSequential();
  console.log(`Sequential Average: ${seqTime / 5}ms`);

  console.log('Running concurrent benchmark...');
  let concTime = 0;
  for (let i = 0; i < 5; i++) concTime += await deleteProjectConcurrent();
  console.log(`Concurrent Average: ${concTime / 5}ms`);
}

runBenchmark().catch(console.error);
