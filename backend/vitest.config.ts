import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: ["tests/**/*.test.ts"],

    coverage: {
      provider: "v8",
      reporter: ["text", "html", "json-summary"],

      include: ["src/**/*.{ts,tsx}"],

      exclude: ["src/generated/**", "src/**/*.d.ts", "src/server.ts"],
    },
  },
});
