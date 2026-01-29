// Quick test script to verify DynamoDB connection
// Run with: source .env.local && npx tsx scripts/test-dynamodb.ts

import {
  createList,
  getList,
  getUserLists,
  deleteList,
  createProject,
  getProject,
  deleteProject,
} from "../src/lib/db/dynamodb";

async function testDynamoDB() {
  const testUserId = `test-user-${Date.now()}`;

  console.log("🧪 Testing DynamoDB connection...\n");

  try {
    // Test 1: Create a list
    console.log("1️⃣ Creating a list...");
    const list = await createList(testUserId, "Test Research List");
    console.log(`   ✅ Created list: ${list.id} - "${list.name}"`);

    // Test 2: Get the list
    console.log("\n2️⃣ Fetching the list...");
    const fetchedList = await getList(testUserId, list.id);
    if (fetchedList) {
      console.log(`   ✅ Fetched list: ${fetchedList.name}`);
    } else {
      throw new Error("Failed to fetch list");
    }

    // Test 3: Get user lists
    console.log("\n3️⃣ Getting user lists...");
    const lists = await getUserLists(testUserId);
    console.log(`   ✅ Found ${lists.length} list(s)`);

    // Test 4: Create a project
    console.log("\n4️⃣ Creating a project...");
    const project = await createProject(testUserId, "Test Project", "A test project");
    console.log(`   ✅ Created project: ${project.id} - "${project.name}"`);

    // Test 5: Get the project
    console.log("\n5️⃣ Fetching the project...");
    const fetchedProject = await getProject(testUserId, project.id);
    if (fetchedProject) {
      console.log(`   ✅ Fetched project: ${fetchedProject.name}`);
    } else {
      throw new Error("Failed to fetch project");
    }

    // Cleanup
    console.log("\n🧹 Cleaning up test data...");
    await deleteList(testUserId, list.id);
    await deleteProject(testUserId, project.id);
    console.log("   ✅ Cleanup complete");

    console.log("\n✨ All DynamoDB tests passed! ✨\n");
    console.log("Your app is now production-ready with DynamoDB!");

  } catch (error) {
    console.error("\n❌ Test failed:", error);
    process.exit(1);
  }
}

testDynamoDB();
