import { beforeEach, describe, expect, it, vi } from "vitest";
import { boards, lists, tasks } from "../../db/index.js";
import { EntityNotFoundError } from "../../errors/EntityNotFoundError.js";
import { createAppNotificationBus } from "../../events/index.js";
import { getTestDb } from "../../test/getTestDb.js";
import { createServices } from "../index.js";

async function setup() {
    const db = await getTestDb();
    const bus = createAppNotificationBus();
    return { db, bus, ...createServices({ db, bus }) };
}

type Ctx = Awaited<ReturnType<typeof setup>>;

const MISSING_ID = "00000000-0000-0000-0000-000000000000";

// Board with 2 lists and 3 tasks across them, for the cascade-delete cases.
async function seedBoardTree(ctx: Ctx) {
    const board = await ctx.boardService.create({ title: "B" });
    const l1 = await ctx.listService.create({
        boardId: board.id,
        title: "L1",
        position: "a",
    });
    const l2 = await ctx.listService.create({
        boardId: board.id,
        title: "L2",
        position: "b",
    });
    await ctx.taskService.create({ listId: l1.id, title: "T1", position: "a" });
    await ctx.taskService.create({ listId: l1.id, title: "T2", position: "b" });
    await ctx.taskService.create({ listId: l2.id, title: "T3", position: "a" });
    return { board, listCount: 2, taskCount: 3 };
}

describe("boardService", () => {
    let ctx: Ctx;
    beforeEach(async () => {
        ctx = await setup();
    });

    describe("create", () => {
        it("persists the board", async () => {
            const board = await ctx.boardService.create({ title: "B" });

            const rows = await ctx.db.select().from(boards);
            expect(rows).toEqual([board]);
        });

        it("emits board.created", async () => {
            const handler = vi.fn();
            ctx.bus.on("board.created", handler);

            const board = await ctx.boardService.create({ title: "B" });

            expect(handler).toHaveBeenCalledExactlyOnceWith(board);
        });
    });

    describe("update", () => {
        it("persists the updated board", async () => {
            const board = await ctx.boardService.create({ title: "B" });

            await ctx.boardService.update(board.id, { title: "B2" });

            const [row] = await ctx.db.select().from(boards);
            expect(row?.title).toBe("B2");
        });

        it("emits board.updated", async () => {
            const board = await ctx.boardService.create({ title: "B" });
            const handler = vi.fn();
            ctx.bus.on("board.updated", handler);

            const updated = await ctx.boardService.update(board.id, {
                title: "B2",
            });

            expect(handler).toHaveBeenCalledExactlyOnceWith(updated);
        });

        it("throws EntityNotFoundError for a missing board", async () => {
            const error = await ctx.boardService
                .update(MISSING_ID, { title: "X" })
                .catch((e: unknown) => e);

            expect(error).toBeInstanceOf(EntityNotFoundError);
            expect(error).toMatchObject({ entity: "boards", id: MISSING_ID });
        });
    });

    describe("remove", () => {
        it("deletes the board and cascades to its lists and tasks", async () => {
            const { board } = await seedBoardTree(ctx);

            await ctx.boardService.remove(board.id);

            expect(await ctx.db.select().from(boards)).toHaveLength(0);
            expect(await ctx.db.select().from(lists)).toHaveLength(0);
            expect(await ctx.db.select().from(tasks)).toHaveLength(0);
        });

        it("emits board.deleted", async () => {
            const board = await ctx.boardService.create({ title: "B" });
            const handler = vi.fn();
            ctx.bus.on("board.deleted", handler);

            const removed = await ctx.boardService.remove(board.id);

            expect(handler).toHaveBeenCalledExactlyOnceWith(removed);
        });

        it("emits one list.deleted per descendant list", async () => {
            const { board, listCount } = await seedBoardTree(ctx);
            const handler = vi.fn();
            ctx.bus.on("list.deleted", handler);

            await ctx.boardService.remove(board.id);

            expect(handler).toHaveBeenCalledTimes(listCount);
        });

        it("emits one task.deleted per descendant task", async () => {
            const { board, taskCount } = await seedBoardTree(ctx);
            const handler = vi.fn();
            ctx.bus.on("task.deleted", handler);

            await ctx.boardService.remove(board.id);

            expect(handler).toHaveBeenCalledTimes(taskCount);
        });

        it("throws EntityNotFoundError for a missing board", async () => {
            const error = await ctx.boardService
                .remove(MISSING_ID)
                .catch((e: unknown) => e);

            expect(error).toBeInstanceOf(EntityNotFoundError);
            expect(error).toMatchObject({ entity: "boards", id: MISSING_ID });
        });
    });

    describe("getById", () => {
        it("returns the matching board", async () => {
            const board = await ctx.boardService.create({ title: "B" });

            expect(await ctx.boardService.getById(board.id)).toEqual(board);
        });

        it("returns undefined for a missing board", async () => {
            expect(await ctx.boardService.getById(MISSING_ID)).toBeUndefined();
        });
    });

    describe("getWithChildren", () => {
        it("returns board with all lists and their tasks", async () => {
            const { board } = await seedBoardTree(ctx);

            const tree = await ctx.boardService.getWithChildren(board.id);

            expect(tree?.id).toBe(board.id);
            expect(tree?.lists.map((l) => l.title).sort()).toEqual([
                "L1",
                "L2",
            ]);
            const l1 = tree?.lists.find((l) => l.title === "L1");
            expect(l1?.tasks.map((t) => t.title).sort()).toEqual(["T1", "T2"]);
            const l2 = tree?.lists.find((l) => l.title === "L2");
            expect(l2?.tasks.map((t) => t.title).sort()).toEqual(["T3"]);
        });

        it("returns a board with an empty list array when it has no lists", async () => {
            const board = await ctx.boardService.create({ title: "B" });

            const tree = await ctx.boardService.getWithChildren(board.id);

            expect(tree).toMatchObject({ id: board.id, lists: [] });
        });

        it("returns undefined for a missing board", async () => {
            expect(
                await ctx.boardService.getWithChildren(MISSING_ID),
            ).toBeUndefined();
        });
    });

    describe("listAll", () => {
        it("returns every board", async () => {
            const b1 = await ctx.boardService.create({ title: "B1" });
            const b2 = await ctx.boardService.create({ title: "B2" });

            expect(await ctx.boardService.listAll()).toEqual(
                expect.arrayContaining([b1, b2]),
            );
        });

        it("returns an empty array when there are no boards", async () => {
            expect(await ctx.boardService.listAll()).toEqual([]);
        });
    });
});
