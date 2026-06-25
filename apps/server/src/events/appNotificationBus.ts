import type { Board, List, Task } from "../db/index.js";
import { NotificationBus } from "./notificationBus.js";
import type { NotificationBusOptions } from "./notificationBus.js";

/**
 * Domain event map for the sync contract: services emit after each mutation,
 * the WebSocket layer subscribes and fans out. Keys are the wire event names.
 */
export type AppEventMap = {
    "board.created": Board;
    "board.updated": Board;
    "board.deleted": Board;
    "list.created": List;
    "list.updated": List;
    "list.deleted": List;
    "list.moved": List;
    "task.created": Task;
    "task.updated": Task;
    "task.deleted": Task;
    "task.moved": Task;
};

/** The application notification bus, typed to the domain {@link AppEventMap}. */
export type AppNotificationBus = NotificationBus<AppEventMap>;

/** Create the domain-typed notification bus, so callers skip restating the generic. */
export function createAppNotificationBus(
    options?: NotificationBusOptions<AppEventMap>,
): AppNotificationBus {
    return new NotificationBus<AppEventMap>(options);
}
