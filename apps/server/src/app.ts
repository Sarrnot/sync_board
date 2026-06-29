import express from "express";
import type { Express } from "express";
import { mountApi } from "./http/index.js";
import type { Services } from "./services/index.js";

/**
 * Builds the Express application. Kept free of side effects (no `listen`)
 * so it can be used directly in tests via supertest. Services are injected
 * so tests can wire them against an in-process database.
 */
export function createApp(deps: { services: Services }): Express {
    const app = express();

    app.use(express.json());

    app.get("/api/health", (_req, res) => {
        res.json({ status: "ok" });
    });

    mountApi(app, deps.services);

    return app;
}
