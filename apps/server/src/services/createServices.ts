import type { AppNotificationBus } from "../events/index.js";
import { BoardService } from "./board/BoardService.js";
import { ListService } from "./list/ListService.js";
import { TaskService } from "./task/TaskService.js";
import type { Db } from "../db/index.js";

export type Services = ReturnType<typeof createServices>;

/** Composition root: wire the cascade DI chain (task -> list -> board). */
export function createServices(deps: { db: Db; bus: AppNotificationBus }) {
    const { db, bus } = deps;
    const taskService = new TaskService({ db, bus });
    const listService = new ListService({ db, bus, taskService });
    const boardService = new BoardService({ db, bus, listService });
    return { taskService, listService, boardService };
}
