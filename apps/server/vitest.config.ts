import { defineConfig } from "vitest/config";

export default defineConfig({
    test: {
        // Tests use an in-process pglite db (see src/test/createTestDb.ts); this
        // only satisfies env validation when the db singleton module is imported.
        env: {
            DATABASE_URL: "postgresql://test:test@localhost:5432/test",
        },
        // Covers the one-time pglite WASM cold start (~2s, see getTestDb.ts),
        // paid once per file and slower when several files boot in parallel.
        // Per-test work is a sub-ms TRUNCATE — this is not a per-test budget.
        testTimeout: 15000,
        hookTimeout: 15000,
    },
});
