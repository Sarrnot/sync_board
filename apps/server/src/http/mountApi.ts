import { createExpressEndpoints } from "@ts-rest/express";
import type { Express } from "express";
import { contract } from "./contract/index.js";
import { createApiRouter } from "./controllers/index.js";
import { domainErrorMiddleware } from "./middleware/domainErrorMiddleware.js";
import type { Services } from "../services/index.js";

/** Mount the REST API onto an Express app, then its domain-error boundary. */
export function mountApi(app: Express, services: Services): void {
    createExpressEndpoints(contract, createApiRouter(services), app);
    app.use(domainErrorMiddleware);
}
