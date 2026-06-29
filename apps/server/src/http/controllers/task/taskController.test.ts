import { describe, it, expect } from "vitest";
import request from "supertest";
import { contract } from "../../contract/index.js";
import { createTestApp } from "../../../test/createTestApp.js";
import { parseResponse } from "../../../test/parseResponse.js";

const MISSING_ID = "00000000-0000-0000-0000-000000000000";

/** App with a board + list to hang tasks off of. */
async function setup() {
    const ctx = await createTestApp();
    const board = await ctx.boardService.create({ title: "B" });
    const list = await ctx.listService.create({
        boardId: board.id,
        title: "L",
        position: "a",
    });
    return { ...ctx, board, list };
}

describe("task controllers", () => {
    describe("POST /api/tasks", () => {
        it("creates a task", async () => {
            const { app, list } = await setup();

            const res = await request(app).post("/api/tasks").send({
                listId: list.id,
                title: "T",
                position: "a",
            });

            expect(res.status).toBe(201);
            const task = parseResponse(
                contract.tasks.createTask,
                201,
                res.body,
            );
            expect(task).toMatchObject({
                listId: list.id,
                title: "T",
                position: "a",
            });
        });

        it("400s on a missing title", async () => {
            const { app, list } = await setup();

            const res = await request(app)
                .post("/api/tasks")
                .send({ listId: list.id, position: "a" });

            expect(res.status).toBe(400);
        });
    });

    describe("GET /api/tasks/:taskId", () => {
        it("returns the task", async () => {
            const { app, list, taskService } = await setup();
            const created = await taskService.create({
                listId: list.id,
                title: "T",
                position: "a",
            });

            const res = await request(app).get(`/api/tasks/${created.id}`);

            expect(res.status).toBe(200);
            const task = parseResponse(contract.tasks.getTask, 200, res.body);
            expect(task.id).toBe(created.id);
        });

        it("404s for a missing task", async () => {
            const { app } = await setup();

            const res = await request(app).get(`/api/tasks/${MISSING_ID}`);

            expect(res.status).toBe(404);
        });

        it("400s for an invalid uuid", async () => {
            const { app } = await setup();

            const res = await request(app).get("/api/tasks/not-a-uuid");

            expect(res.status).toBe(400);
        });
    });

    describe("PATCH /api/tasks/:taskId", () => {
        it("updates the title", async () => {
            const { app, list, taskService } = await setup();
            const created = await taskService.create({
                listId: list.id,
                title: "T",
                position: "a",
            });

            const res = await request(app)
                .patch(`/api/tasks/${created.id}`)
                .send({ title: "T2" });

            expect(res.status).toBe(200);
            const task = parseResponse(
                contract.tasks.updateTask,
                200,
                res.body,
            );
            expect(task.title).toBe("T2");
        });

        it("404s for a missing task", async () => {
            const { app } = await setup();

            const res = await request(app)
                .patch(`/api/tasks/${MISSING_ID}`)
                .send({ title: "T2" });

            expect(res.status).toBe(404);
        });
    });

    describe("POST /api/tasks/:taskId/move", () => {
        it("moves the task to another list and position", async () => {
            const { app, board, list, listService, taskService } =
                await setup();
            const created = await taskService.create({
                listId: list.id,
                title: "T",
                position: "a",
            });
            const target = await listService.create({
                boardId: board.id,
                title: "L2",
                position: "b",
            });

            const res = await request(app)
                .post(`/api/tasks/${created.id}/move`)
                .send({ listId: target.id, position: "z" });

            expect(res.status).toBe(200);
            const task = parseResponse(contract.tasks.moveTask, 200, res.body);
            expect(task).toMatchObject({ listId: target.id, position: "z" });
        });

        it("404s for a missing task", async () => {
            const { app, list } = await setup();

            const res = await request(app)
                .post(`/api/tasks/${MISSING_ID}/move`)
                .send({ listId: list.id, position: "z" });

            expect(res.status).toBe(404);
        });
    });

    describe("DELETE /api/tasks/:taskId", () => {
        it("deletes the task and returns it", async () => {
            const { app, list, taskService } = await setup();
            const created = await taskService.create({
                listId: list.id,
                title: "T",
                position: "a",
            });

            const res = await request(app).delete(`/api/tasks/${created.id}`);

            expect(res.status).toBe(200);
            const task = parseResponse(
                contract.tasks.deleteTask,
                200,
                res.body,
            );
            expect(task.id).toBe(created.id);
            expect(await taskService.getById(created.id)).toBeUndefined();
        });

        it("404s for a missing task", async () => {
            const { app } = await setup();

            const res = await request(app).delete(`/api/tasks/${MISSING_ID}`);

            expect(res.status).toBe(404);
        });
    });
});
