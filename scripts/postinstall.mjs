#!/usr/bin/env node
import { spawnSync } from "node:child_process";

if (process.env.VERCEL || process.env.CI_SKIP_ELECTRON) {
  process.exit(0);
}

const result = spawnSync("npx", ["--no-install", "electron-builder", "install-app-deps"], {
  stdio: "inherit",
  shell: true,
});

process.exit(result.status ?? 0);
