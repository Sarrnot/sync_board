import { describe, it, expect } from "vitest";
import request from "supertest";
import { createTestApp } from "./test/createTestApp.js";

describe("GET /api/health", () => {
    it("responds with ok status", async () => {
        const { app } = await createTestApp();

        const res = await request(app).get("/api/health");

        expect(res.status).toBe(200);
        expect(res.body).toEqual({ status: "ok" });
    });
});
