import { fileURLToPath } from "node:url";
import { PGlite } from "@electric-sql/pglite";
import { is, sql } from "drizzle-orm";
import { PgTable } from "drizzle-orm/pg-core";
import { drizzle } from "drizzle-orm/pglite";
import { migrate } from "drizzle-orm/pglite/migrator";
import * as schema from "../db/schema/index.js";
import type { Db } from "../services/lib/runInTransaction.js";

const migrationsFolder = fileURLToPath(
    new URL("../../migrations", import.meta.url),
);

// All schema tables, so a new table can't be left out of the reset.
const tables = Object.values(schema).filter((v) => is(v, PgTable));

// PGlite's WASM cold start (~2s) is paid once per file: Vitest isolates the
// module graph per file, so this singleton is private to one file. Parallel
// files get their own db; tests within a file run sequentially, so the per-test
// truncate-all is a safe reset.
//
// The double cast bridges pglite to the production `Db` (postgres.js): the
// drivers are query-compatible but their result-type HKTs don't overlap, so TS
// won't relate them. Test-only — prod stays on postgres.js, and tests run the
// real query paths so genuine drift fails.
let dbPromise: Promise<Db> | undefined;

function migratedDb(): Promise<Db> {
    dbPromise ??= (async () => {
        const db = drizzle(new PGlite(), { schema, casing: "snake_case" });
        await migrate(db, { migrationsFolder });
        return db as unknown as Db;
    })();
    return dbPromise;
}

/** The file's shared test db, emptied so each test starts from a clean slate. */
export async function getTestDb(): Promise<Db> {
    const db = await migratedDb();
    await db.execute(
        sql`truncate ${sql.join(tables, sql`, `)} restart identity cascade`,
    );
    return db;
}
