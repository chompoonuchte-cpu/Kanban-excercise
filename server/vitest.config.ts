import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    globals: true,
    environment: "node",
    setupFiles: ["./src/__tests__/setup.ts"],
    env: {
      DATABASE_URL: "postgresql://kanban:kanban@localhost:5433/kanban_test",
      JWT_SECRET: "test-secret",
      PORT: "3002",
    },
  },
});
