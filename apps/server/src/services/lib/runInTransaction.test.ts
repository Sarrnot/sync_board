import { describe, expect, it, vi } from "vitest";
import { boards } from "../../db/index.js";
import type { List } from "../../db/index.js";
import { createAppNotificationBus } from "../../events/index.js";
import { getTestDb } from "../../test/getTestDb.js";
import { runInTransaction } from "./runInTransaction.js";

// Payload value is incidental here — these tests exercise buffer/flush timing.
const aList: List = {
    id: "abc",
    boardId: "def",
    title: "L",
    position: "a",
    createdAt: new Date(),
    updatedAt: new Date(),
};

describe("runInTransaction", () => {
    it("does not fire emitted events while the transaction body runs", async () => {
        const db = await getTestDb();
        const bus = createAppNotificationBus();
        const handler = vi.fn();
        bus.on("list.created", handler);

        let calledInsideTx = false;
        await runInTransaction({ bus, db }, ({ emit }) => {
            emit("list.created", aList);
            calledInsideTx = handler.mock.calls.length > 0;
            return Promise.resolve();
        });

        expect(calledInsideTx).toBe(false);
    });

    it("flushes buffered events when the transaction commits", async () => {
        const db = await getTestDb();
        const bus = createAppNotificationBus();
        const handler = vi.fn();
        bus.on("list.created", handler);

        await runInTransaction({ bus, db }, ({ emit }) => {
            emit("list.created", aList);
            return Promise.resolve();
        });

        expect(handler).toHaveBeenCalledExactlyOnceWith(aList);
    });

    it("persists writes when the transaction commits", async () => {
        const db = await getTestDb();
        const bus = createAppNotificationBus();

        await runInTransaction({ bus, db }, async ({ executor }) => {
            await executor.insert(boards).values({ title: "kept" });
        });

        expect(await db.select().from(boards)).toHaveLength(1);
    });

    it("drops buffered events when the body throws", async () => {
        const db = await getTestDb();
        const bus = createAppNotificationBus();
        const handler = vi.fn();
        bus.on("list.created", handler);

        await expect(
            runInTransaction({ bus, db }, ({ emit }) => {
                emit("list.created", aList);
                throw new Error("boom");
            }),
        ).rejects.toThrow("boom");

        expect(handler).not.toHaveBeenCalled();
    });

    it("rolls back writes when the body throws", async () => {
        const db = await getTestDb();
        const bus = createAppNotificationBus();

        await expect(
            runInTransaction({ bus, db }, async ({ executor }) => {
                await executor.insert(boards).values({ title: "doomed" });
                throw new Error("boom");
            }),
        ).rejects.toThrow("boom");

        expect(await db.select().from(boards)).toHaveLength(0);
    });
});
