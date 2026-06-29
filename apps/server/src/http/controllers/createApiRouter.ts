import { initServer } from "@ts-rest/express";
import { contract } from "../contract/index.js";
import type { Services } from "../../services/index.js";
import { createBoardController } from "./board/boardController.js";
import { createListController } from "./list/listController.js";
import { createTaskController } from "./task/taskController.js";

const s = initServer();

/** ts-rest router implementing the full contract. */
export function createApiRouter(services: Services) {
    return s.router(contract, {
        boards: createBoardController(services),
        lists: createListController(services),
        tasks: createTaskController(services),
    });
}
