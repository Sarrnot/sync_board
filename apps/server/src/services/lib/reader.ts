import type { Db } from "../../db/index.js";
import type { Executor, TransactionContext } from "./runInTransaction.js";

/**
 * Picks where a read runs: inside the given transaction (so it sees that
 * transaction's uncommitted writes) or directly against the database. Lets a
 * read join the same transaction as a nearby write instead of missing its
 * pending changes.
 */
export function reader(database: Db, tx?: TransactionContext): Executor | Db {
    return tx?.executor ?? database;
}
