import { createApp } from "../app.js";
import { createAppNotificationBus } from "../events/index.js";
import { createServices } from "../services/index.js";
import { getTestDb } from "./getTestDb.js";

/**
 * Builds an Express app wired to the in-process test database, returning it
 * alongside the services and bus so tests can seed data and assert events.
 */
export async function createTestApp() {
    const db = await getTestDb();
    const bus = createAppNotificationBus();
    const services = createServices({ db, bus });
    const app = createApp({ services });
    return { app, db, bus, ...services };
}
