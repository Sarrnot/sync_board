import { NotificationBus } from "./notificationBus.js";
import type { NotificationBusOptions } from "./notificationBus.js";

// TODO: tighten to the real Zod-inferred DTOs (full entity shapes, move
// positions) once the data layer exists. For now only `id` is committed to.
type EntityRef = { id: string };

/**
 * Domain event map for the sync contract: services emit after each mutation,
 * the WebSocket layer subscribes and fans out. Keys are the wire event names.
 */
export type AppEventMap = {
    "list.created": EntityRef;
    "list.updated": EntityRef;
    "list.deleted": EntityRef;
    "list.moved": EntityRef;
    "task.created": EntityRef;
    "task.updated": EntityRef;
    "task.deleted": EntityRef;
    "task.moved": EntityRef;
};

/** The application notification bus, typed to the domain {@link AppEventMap}. */
export type AppNotificationBus = NotificationBus<AppEventMap>;

/** Create the domain-typed notification bus, so callers skip restating the generic. */
export function createAppNotificationBus(
    options?: NotificationBusOptions<AppEventMap>,
): AppNotificationBus {
    return new NotificationBus<AppEventMap>(options);
}
