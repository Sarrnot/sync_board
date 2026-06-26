import { describe, expect, it, vi } from "vitest";
import type { Db } from "../../db/index.js";
import { reader } from "./reader.js";
import type { TransactionContext } from "./runInTransaction.js";

// reader is pure delegation — it never touches the values,
// so opaque sentinels stand in for the real Db/executor. The casts are
// the justified exception to the no-`as` rule: there's nothing to narrow.
const db = {} as unknown as Db;
const tx = {
    executor: {},
    emit: vi.fn(),
} as unknown as TransactionContext;

describe("reader", () => {
    it("returns the transaction's executor when a context is passed", () => {
        expect(reader(db, tx)).toBe(tx.executor);
    });

    it("returns the database when no context is passed", () => {
        expect(reader(db)).toBe(db);
    });
});
