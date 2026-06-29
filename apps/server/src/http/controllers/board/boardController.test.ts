import { describe, it, expect } from "vitest";
import request from "supertest";
import { contract } from "../../contract/index.js";
import { createTestApp } from "../../../test/createTestApp.js";
import { parseResponse } from "../../../test/parseResponse.js";

const MISSING_ID = "00000000-0000-0000-0000-000000000000";

describe("board controllers", () => {
    describe("POST /api/boards", () => {
        it("creates a board", async () => {
            const { app } = await createTestApp();

            const res = await request(app)
                .post("/api/boards")
                .send({ title: "B" });

            expect(res.status).toBe(201);
            const board = parseResponse(
                contract.boards.createBoard,
                201,
                res.body,
            );
            expect(board.title).toBe("B");
        });

        it("400s on a missing title", async () => {
            const { app } = await createTestApp();

            const res = await request(app).post("/api/boards").send({});

            expect(res.status).toBe(400);
        });
    });

    describe("GET /api/boards/:boardId", () => {
        it("returns the flat board", async () => {
            const { app, boardService } = await createTestApp();
            const created = await boardService.create({ title: "B" });

            const res = await request(app).get(`/api/boards/${created.id}`);

            expect(res.status).toBe(200);
            const board = parseResponse(
                contract.boards.getBoard,
                200,
                res.body,
            );
            expect(board).toEqual({ id: created.id, title: "B" });
        });

        it("404s for a missing board", async () => {
            const { app } = await createTestApp();

            const res = await request(app).get(`/api/boards/${MISSING_ID}`);

            expect(res.status).toBe(404);
        });

        it("400s for an invalid uuid", async () => {
            const { app } = await createTestApp();

            const res = await request(app).get("/api/boards/not-a-uuid");

            expect(res.status).toBe(400);
        });
    });

    describe("GET /api/boards/:boardId/tree", () => {
        it("returns the board with its lists and tasks nested", async () => {
            const { app, boardService, listService, taskService } =
                await createTestApp();
            const board = await boardService.create({ title: "B" });
            const list = await listService.create({
                boardId: board.id,
                title: "L1",
                position: "a",
            });
            await taskService.create({
                listId: list.id,
                title: "T1",
                position: "a",
            });

            const res = await request(app).get(`/api/boards/${board.id}/tree`);

            expect(res.status).toBe(200);
            const tree = parseResponse(
                contract.boards.getBoardTree,
                200,
                res.body,
            );
            expect(tree.id).toBe(board.id);
            expect(tree.lists).toHaveLength(1);
            expect(tree.lists[0]?.title).toBe("L1");
            expect(tree.lists[0]?.tasks).toHaveLength(1);
            expect(tree.lists[0]?.tasks[0]?.title).toBe("T1");
        });

        it("404s for a missing board", async () => {
            const { app } = await createTestApp();

            const res = await request(app).get(
                `/api/boards/${MISSING_ID}/tree`,
            );

            expect(res.status).toBe(404);
        });
    });
});
