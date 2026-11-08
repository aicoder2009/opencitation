#!/usr/bin/env node
import { execSync } from "child_process";
import { existsSync, copyFileSync } from "fs";
import { join } from "path";

const root = new URL("..", import.meta.url).pathname;

function run(cmd, opts = {}) {
  execSync(cmd, { stdio: "inherit", cwd: root, ...opts });
}

console.log("\nOpenCitation — quick start\n");

// 1. Node version check
const [major] = process.versions.node.split(".").map(Number);
if (major < 18) {
  console.error(`Node.js 18+ is required. You have ${process.versions.node}.`);
  process.exit(1);
}

// 2. Install dependencies if node_modules is missing
if (!existsSync(join(root, "node_modules"))) {
  console.log("Installing dependencies…");
  run("npm install");
} else {
  console.log("Dependencies already installed.");
}

// 3. Copy .env.example → .env.local if .env.local is missing
const envLocal = join(root, ".env.local");
const envExample = join(root, ".env.example");
if (!existsSync(envLocal)) {
  if (existsSync(envExample)) {
    copyFileSync(envExample, envLocal);
    console.log("Created .env.local from .env.example — fill in your API keys before continuing.");
  } else {
    console.log("No .env.example found. Create .env.local manually with your Clerk and AWS credentials.");
  }
} else {
  console.log(".env.local already exists.");
}

console.log(`
Everything looks good! Start the dev server with:

  npm run dev

Then open http://localhost:3000 in your browser.

For the desktop app:  npm run electron:dev
For tests:            npm run test:run
`);
