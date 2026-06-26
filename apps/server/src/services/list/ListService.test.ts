import { beforeEach, describe, expect, it, vi } from "vitest";
import { lists, tasks } from "../../db/index.js";
import { EntityNotFoundError } from "../../errors/EntityNotFoundError.js";
import { createAppNotificationBus } from "../../events/index.js";
import { getTestDb } from "../../test/getTestDb.js";
import { createServices } from "../index.js";

async function setup() {
    const db = await getTestDb();
    const bus = createAppNotificationBus();
    const services = createServices({ db, bus });
    const board = await services.boardService.create({ title: "B" });
    return { db, bus, ...services, board };
}

type Ctx = Awaited<ReturnType<typeof setup>>;

const MISSING_ID = "00000000-0000-0000-0000-000000000000";

// List under the seeded board, holding `taskCount` tasks — for cascade cases.
async function seedListWithTasks(ctx: Ctx, position = "a") {
    const list = await ctx.listService.create({
        boardId: ctx.board.id,
        title: "L",
        position,
    });
    await ctx.taskService.create({
        listId: list.id,
        title: "T1",
        position: "a",
    });
    await ctx.taskService.create({
        listId: list.id,
        title: "T2",
        position: "b",
    });
    return { list, taskCount: 2 };
}

describe("listService", () => {
    let ctx: Ctx;
    beforeEach(async () => {
        ctx = await setup();
    });

    describe("create", () => {
        it("persists the list", async () => {
            const list = await ctx.listService.create({
                boardId: ctx.board.id,
                title: "L",
                position: "a",
            });

            expect(await ctx.db.select().from(lists)).toEqual([list]);
        });

        it("emits list.created", async () => {
            const handler = vi.fn();
            ctx.bus.on("list.created", handler);

            const list = await ctx.listService.create({
                boardId: ctx.board.id,
                title: "L",
                position: "a",
            });

            expect(handler).toHaveBeenCalledExactlyOnceWith(list);
        });
    });

    describe("update", () => {
        it("persists the updated list", async () => {
            const list = await ctx.listService.create({
                boardId: ctx.board.id,
                title: "L",
                position: "a",
            });

            await ctx.listService.update(list.id, { title: "L2" });

            const [row] = await ctx.db.select().from(lists);
            expect(row?.title).toBe("L2");
        });

        it("emits list.updated", async () => {
            const list = await ctx.listService.create({
                boardId: ctx.board.id,
                title: "L",
                position: "a",
            });
            const handler = vi.fn();
            ctx.bus.on("list.updated", handler);

            const updated = await ctx.listService.update(list.id, {
                title: "L2",
            });

            expect(handler).toHaveBeenCalledExactlyOnceWith(updated);
        });

        it("throws EntityNotFoundError for a missing list", async () => {
            const error = await ctx.listService
                .update(MISSING_ID, { title: "X" })
                .catch((e: unknown) => e);

            expect(error).toBeInstanceOf(EntityNotFoundError);
            expect(error).toMatchObject({ entity: "lists", id: MISSING_ID });
        });
    });

    describe("move", () => {
        it("persists the moved list", async () => {
            const list = await ctx.listService.create({
                boardId: ctx.board.id,
                title: "L",
                position: "a",
            });

            await ctx.listService.move(list.id, { position: "m" });

            const [row] = await ctx.db.select().from(lists);
            expect(row?.position).toBe("m");
        });

        it("emits list.moved", async () => {
            const list = await ctx.listService.create({
                boardId: ctx.board.id,
                title: "L",
                position: "a",
            });
            const handler = vi.fn();
            ctx.bus.on("list.moved", handler);

            const moved = await ctx.listService.move(list.id, {
                position: "m",
            });

            expect(handler).toHaveBeenCalledExactlyOnceWith(moved);
        });

        it("throws EntityNotFoundError for a missing list", async () => {
            const error = await ctx.listService
                .move(MISSING_ID, { position: "m" })
                .catch((e: unknown) => e);

            expect(error).toBeInstanceOf(EntityNotFoundError);
            expect(error).toMatchObject({ entity: "lists", id: MISSING_ID });
        });
    });

    describe("remove", () => {
        it("deletes the list and cascades to its tasks", async () => {
            const { list } = await seedListWithTasks(ctx);

            await ctx.listService.remove(list.id);

            expect(await ctx.db.select().from(lists)).toHaveLength(0);
            expect(await ctx.db.select().from(tasks)).toHaveLength(0);
        });

        it("emits list.deleted", async () => {
            const list = await ctx.listService.create({
                boardId: ctx.board.id,
                title: "L",
                position: "a",
            });
            const handler = vi.fn();
            ctx.bus.on("list.deleted", handler);

            const removed = await ctx.listService.remove(list.id);

            expect(handler).toHaveBeenCalledExactlyOnceWith(removed);
        });

        it("emits one task.deleted per descendant task", async () => {
            const { list, taskCount } = await seedListWithTasks(ctx);
            const handler = vi.fn();
            ctx.bus.on("task.deleted", handler);

            await ctx.listService.remove(list.id);

            expect(handler).toHaveBeenCalledTimes(taskCount);
        });

        it("throws EntityNotFoundError for a missing list", async () => {
            const error = await ctx.listService
                .remove(MISSING_ID)
                .catch((e: unknown) => e);

            expect(error).toBeInstanceOf(EntityNotFoundError);
            expect(error).toMatchObject({ entity: "lists", id: MISSING_ID });
        });
    });

    describe("removeByBoard", () => {
        it("deletes every list of the board, cascading to their tasks", async () => {
            await seedListWithTasks(ctx, "a");
            await seedListWithTasks(ctx, "b");

            await ctx.listService.removeByBoard(ctx.board.id);

            expect(await ctx.db.select().from(lists)).toHaveLength(0);
            expect(await ctx.db.select().from(tasks)).toHaveLength(0);
        });

        it("leaves other boards' lists untouched", async () => {
            const other = await ctx.boardService.create({ title: "Other" });
            const kept = await ctx.listService.create({
                boardId: other.id,
                title: "Keep",
                position: "a",
            });
            await seedListWithTasks(ctx);

            await ctx.listService.removeByBoard(ctx.board.id);

            expect(await ctx.db.select().from(lists)).toEqual([kept]);
        });

        it("emits one list.deleted per removed list", async () => {
            await seedListWithTasks(ctx, "a");
            await seedListWithTasks(ctx, "b");
            const handler = vi.fn();
            ctx.bus.on("list.deleted", handler);

            await ctx.listService.removeByBoard(ctx.board.id);

            expect(handler).toHaveBeenCalledTimes(2);
        });
    });

    describe("getById", () => {
        it("returns the matching list", async () => {
            const list = await ctx.listService.create({
                boardId: ctx.board.id,
                title: "L",
                position: "a",
            });

            expect(await ctx.listService.getById(list.id)).toEqual(list);
        });

        it("returns undefined for a missing list", async () => {
            expect(await ctx.listService.getById(MISSING_ID)).toBeUndefined();
        });
    });

    describe("listByBoard", () => {
        it("returns only the given board's lists", async () => {
            const mine = await ctx.listService.create({
                boardId: ctx.board.id,
                title: "Mine",
                position: "a",
            });
            const other = await ctx.boardService.create({ title: "Other" });
            await ctx.listService.create({
                boardId: other.id,
                title: "Theirs",
                position: "a",
            });

            expect(await ctx.listService.listByBoard(ctx.board.id)).toEqual([
                mine,
            ]);
        });

        it("returns an empty array when the board has no lists", async () => {
            expect(await ctx.listService.listByBoard(ctx.board.id)).toEqual([]);
        });
    });
});
