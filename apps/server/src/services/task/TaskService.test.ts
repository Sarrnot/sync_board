import { beforeEach, describe, expect, it, vi } from "vitest";
import { tasks } from "../../db/index.js";
import { EntityNotFoundError } from "../../errors/EntityNotFoundError.js";
import { createAppNotificationBus } from "../../events/index.js";
import { getTestDb } from "../../test/getTestDb.js";
import { createServices } from "../index.js";

async function setup() {
    const db = await getTestDb();
    const bus = createAppNotificationBus();
    const services = createServices({ db, bus });
    const board = await services.boardService.create({ title: "B" });
    const list = await services.listService.create({
        boardId: board.id,
        title: "L",
        position: "a",
    });
    return { db, bus, ...services, board, list };
}

type Ctx = Awaited<ReturnType<typeof setup>>;

const MISSING_ID = "00000000-0000-0000-0000-000000000000";

function createTask(ctx: Ctx, listId = ctx.list.id, position = "a") {
    return ctx.taskService.create({ listId, title: "T", position });
}

describe("taskService", () => {
    let ctx: Ctx;
    beforeEach(async () => {
        ctx = await setup();
    });

    describe("create", () => {
        it("persists the task", async () => {
            const task = await createTask(ctx);

            expect(await ctx.db.select().from(tasks)).toEqual([task]);
        });

        it("emits task.created", async () => {
            const handler = vi.fn();
            ctx.bus.on("task.created", handler);

            const task = await createTask(ctx);

            expect(handler).toHaveBeenCalledExactlyOnceWith(task);
        });
    });

    describe("update", () => {
        it("persists the updated task", async () => {
            const task = await createTask(ctx);

            await ctx.taskService.update(task.id, { title: "T2" });

            const [row] = await ctx.db.select().from(tasks);
            expect(row?.title).toBe("T2");
        });

        it("emits task.updated", async () => {
            const task = await createTask(ctx);
            const handler = vi.fn();
            ctx.bus.on("task.updated", handler);

            const updated = await ctx.taskService.update(task.id, {
                title: "T2",
            });

            expect(handler).toHaveBeenCalledExactlyOnceWith(updated);
        });

        it("throws EntityNotFoundError for a missing task", async () => {
            const error = await ctx.taskService
                .update(MISSING_ID, { title: "X" })
                .catch((e: unknown) => e);

            expect(error).toBeInstanceOf(EntityNotFoundError);
            expect(error).toMatchObject({ entity: "tasks", id: MISSING_ID });
        });
    });

    describe("move", () => {
        it("persists the moved task", async () => {
            const other = await ctx.listService.create({
                boardId: ctx.board.id,
                title: "L2",
                position: "b",
            });
            const task = await createTask(ctx);

            await ctx.taskService.move(task.id, {
                listId: other.id,
                position: "m",
            });

            const [row] = await ctx.db.select().from(tasks);
            expect(row?.listId).toBe(other.id);
            expect(row?.position).toBe("m");
        });

        it("emits task.moved", async () => {
            const task = await createTask(ctx);
            const handler = vi.fn();
            ctx.bus.on("task.moved", handler);

            const moved = await ctx.taskService.move(task.id, {
                listId: ctx.list.id,
                position: "m",
            });

            expect(handler).toHaveBeenCalledExactlyOnceWith(moved);
        });

        it("throws EntityNotFoundError for a missing task", async () => {
            const error = await ctx.taskService
                .move(MISSING_ID, { listId: ctx.list.id, position: "m" })
                .catch((e: unknown) => e);

            expect(error).toBeInstanceOf(EntityNotFoundError);
            expect(error).toMatchObject({ entity: "tasks", id: MISSING_ID });
        });
    });

    describe("remove", () => {
        it("deletes the task", async () => {
            const task = await createTask(ctx);

            await ctx.taskService.remove(task.id);

            expect(await ctx.db.select().from(tasks)).toHaveLength(0);
        });

        it("emits task.deleted", async () => {
            const task = await createTask(ctx);
            const handler = vi.fn();
            ctx.bus.on("task.deleted", handler);

            const removed = await ctx.taskService.remove(task.id);

            expect(handler).toHaveBeenCalledExactlyOnceWith(removed);
        });

        it("throws EntityNotFoundError for a missing task", async () => {
            const error = await ctx.taskService
                .remove(MISSING_ID)
                .catch((e: unknown) => e);

            expect(error).toBeInstanceOf(EntityNotFoundError);
            expect(error).toMatchObject({ entity: "tasks", id: MISSING_ID });
        });
    });

    describe("removeByList", () => {
        it("deletes every task of the list", async () => {
            await createTask(ctx, ctx.list.id, "a");
            await createTask(ctx, ctx.list.id, "b");

            await ctx.taskService.removeByList(ctx.list.id);

            expect(await ctx.db.select().from(tasks)).toHaveLength(0);
        });

        it("leaves other lists' tasks untouched", async () => {
            const other = await ctx.listService.create({
                boardId: ctx.board.id,
                title: "L2",
                position: "b",
            });
            const kept = await createTask(ctx, other.id, "a");
            await createTask(ctx, ctx.list.id, "a");

            await ctx.taskService.removeByList(ctx.list.id);

            expect(await ctx.db.select().from(tasks)).toEqual([kept]);
        });

        it("emits one task.deleted per removed task", async () => {
            await createTask(ctx, ctx.list.id, "a");
            await createTask(ctx, ctx.list.id, "b");
            const handler = vi.fn();
            ctx.bus.on("task.deleted", handler);

            await ctx.taskService.removeByList(ctx.list.id);

            expect(handler).toHaveBeenCalledTimes(2);
        });
    });

    describe("getById", () => {
        it("returns the matching task", async () => {
            const task = await createTask(ctx);

            expect(await ctx.taskService.getById(task.id)).toEqual(task);
        });

        it("returns undefined for a missing task", async () => {
            expect(await ctx.taskService.getById(MISSING_ID)).toBeUndefined();
        });
    });

    describe("listByList", () => {
        it("returns only the given list's tasks", async () => {
            const mine = await createTask(ctx, ctx.list.id, "a");
            const other = await ctx.listService.create({
                boardId: ctx.board.id,
                title: "L2",
                position: "b",
            });
            await createTask(ctx, other.id, "a");

            expect(await ctx.taskService.listByList(ctx.list.id)).toEqual([
                mine,
            ]);
        });

        it("returns an empty array when the list has no tasks", async () => {
            expect(await ctx.taskService.listByList(ctx.list.id)).toEqual([]);
        });
    });
});
