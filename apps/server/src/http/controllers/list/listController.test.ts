import { describe, it, expect } from "vitest";
import request from "supertest";
import { contract } from "../../contract/index.js";
import { createTestApp } from "../../../test/createTestApp.js";
import { parseResponse } from "../../../test/parseResponse.js";

const MISSING_ID = "00000000-0000-0000-0000-000000000000";

/** App with a board to hang lists off of. */
async function setup() {
    const ctx = await createTestApp();
    const board = await ctx.boardService.create({ title: "B" });
    return { ...ctx, board };
}

describe("list controllers", () => {
    describe("POST /api/lists", () => {
        it("creates a list", async () => {
            const { app, board } = await setup();

            const res = await request(app).post("/api/lists").send({
                boardId: board.id,
                title: "L",
                position: "a",
            });

            expect(res.status).toBe(201);
            const list = parseResponse(
                contract.lists.createList,
                201,
                res.body,
            );
            expect(list).toMatchObject({
                boardId: board.id,
                title: "L",
                position: "a",
            });
        });

        it("400s on a missing title", async () => {
            const { app, board } = await setup();

            const res = await request(app)
                .post("/api/lists")
                .send({ boardId: board.id, position: "a" });

            expect(res.status).toBe(400);
        });
    });

    describe("GET /api/lists/:listId", () => {
        it("returns the list", async () => {
            const { app, board, listService } = await setup();
            const created = await listService.create({
                boardId: board.id,
                title: "L",
                position: "a",
            });

            const res = await request(app).get(`/api/lists/${created.id}`);

            expect(res.status).toBe(200);
            const list = parseResponse(contract.lists.getList, 200, res.body);
            expect(list.id).toBe(created.id);
        });

        it("404s for a missing list", async () => {
            const { app } = await setup();

            const res = await request(app).get(`/api/lists/${MISSING_ID}`);

            expect(res.status).toBe(404);
        });

        it("400s for an invalid uuid", async () => {
            const { app } = await setup();

            const res = await request(app).get("/api/lists/not-a-uuid");

            expect(res.status).toBe(400);
        });
    });

    describe("PATCH /api/lists/:listId", () => {
        it("updates the title", async () => {
            const { app, board, listService } = await setup();
            const created = await listService.create({
                boardId: board.id,
                title: "L",
                position: "a",
            });

            const res = await request(app)
                .patch(`/api/lists/${created.id}`)
                .send({ title: "L2" });

            expect(res.status).toBe(200);
            const list = parseResponse(
                contract.lists.updateList,
                200,
                res.body,
            );
            expect(list.title).toBe("L2");
        });

        it("404s for a missing list", async () => {
            const { app } = await setup();

            const res = await request(app)
                .patch(`/api/lists/${MISSING_ID}`)
                .send({ title: "L2" });

            expect(res.status).toBe(404);
        });
    });

    describe("POST /api/lists/:listId/move", () => {
        it("moves the list to a new position", async () => {
            const { app, board, listService } = await setup();
            const created = await listService.create({
                boardId: board.id,
                title: "L",
                position: "a",
            });

            const res = await request(app)
                .post(`/api/lists/${created.id}/move`)
                .send({ position: "z" });

            expect(res.status).toBe(200);
            const list = parseResponse(contract.lists.moveList, 200, res.body);
            expect(list.position).toBe("z");
        });

        it("404s for a missing list", async () => {
            const { app } = await setup();

            const res = await request(app)
                .post(`/api/lists/${MISSING_ID}/move`)
                .send({ position: "z" });

            expect(res.status).toBe(404);
        });
    });

    describe("DELETE /api/lists/:listId", () => {
        it("deletes the list and returns it", async () => {
            const { app, board, listService } = await setup();
            const created = await listService.create({
                boardId: board.id,
                title: "L",
                position: "a",
            });

            const res = await request(app).delete(`/api/lists/${created.id}`);

            expect(res.status).toBe(200);
            const list = parseResponse(
                contract.lists.deleteList,
                200,
                res.body,
            );
            expect(list.id).toBe(created.id);
            expect(await listService.getById(created.id)).toBeUndefined();
        });

        it("404s for a missing list", async () => {
            const { app } = await setup();

            const res = await request(app).delete(`/api/lists/${MISSING_ID}`);

            expect(res.status).toBe(404);
        });
    });
});
