import {
  createList,
  addCitation,
  deleteList as deleteListSequential,
  getUserLists
} from "../src/lib/db/dynamodb";
import { docClient, TABLE_NAME, keys } from "../src/lib/db/dynamodb";

async function populateList(userId: string, numCitations: number) {
  const list = await createList(userId, `Benchmark List - ${numCitations} citations`);
  for (let i = 0; i < numCitations; i++) {
    await addCitation(
      list.id,
      { title: `Citation ${i}` },
      "apa",
      "text",
      "html",
      []
    );
  }
  return list;
}

async function benchmark() {
  const testUserId = `test-bench-${Date.now()}`;
  console.log("🧪 Benchmarking deleteList...");

  // Create list with 50 citations
  const numCitations = 50;
  console.log(`Setting up list with ${numCitations} citations...`);
  const list1 = await populateList(testUserId, numCitations);

  const startSeq = Date.now();
  await deleteListSequential(testUserId, list1.id);
  const endSeq = Date.now();

  console.log(`Baseline (Sequential delete): ${endSeq - startSeq}ms`);
}

benchmark().catch(console.error);
