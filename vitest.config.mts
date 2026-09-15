import path from "node:path";
import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname),
      // Modules guarded with `import "server-only"` are exercised directly in
      // Node here; the guard exists to keep them out of client bundles.
      "server-only": path.resolve(import.meta.dirname, "tests/support/server-only-stub.ts"),
    },
  },
  test: {
    environment: "node",
    include: ["tests/**/*.test.ts"],
    setupFiles: ["tests/support/setup.ts"],
    testTimeout: 30_000,
    hookTimeout: 60_000,
    // Integration tests share one Supabase project; run files sequentially.
    fileParallelism: false,
  },
});
