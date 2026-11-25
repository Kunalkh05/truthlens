import { defineConfig } from "vitest/config";
import path from "path";

export default defineConfig({
  test: {
    environment: "node",
    globals: true,
    include: ["src/**/*.test.ts", "tests/**/*.test.ts"],
    server: {
      deps: {
        external: [/^node:/, "node:sqlite"],
      },
    },
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
