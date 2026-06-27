import { initContract } from "@ts-rest/core";
import { boardsContract } from "./routes/boards.js";
import { listsContract } from "./routes/lists.js";
import { tasksContract } from "./routes/tasks.js";

/**
 * Public REST contract — the shared source of truth for the server's HTTP API.
 * Exposed as the `server/contract` package export so clients import it directly.
 */
export const contract = initContract().router(
    {
        boards: boardsContract,
        lists: listsContract,
        tasks: tasksContract,
    },
    { pathPrefix: "/api" },
);
