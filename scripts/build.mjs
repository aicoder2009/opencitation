import { spawn } from "node:child_process";

const fallbackPublishableKey = "pk_test_ZXhhbXBsZS0wMC5jbGVyay5hY2NvdW50cy5kZXYk";

const env = { ...process.env };

if (!env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY) {
  env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY = fallbackPublishableKey;
  console.warn(
    "[build] NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY is not set; using a build-time fallback key so prerender can complete."
  );
}

const child = spawn("npx", ["next", "build", "--turbopack"], {
  stdio: "inherit",
  env,
});

child.on("exit", (code, signal) => {
  if (signal) {
    process.kill(process.pid, signal);
    return;
  }

  process.exit(code ?? 1);
});
