import type { ServerInferResponseBody } from "@ts-rest/core";
import type { Task } from "../../db/index.js";
import { contract } from "../contract/index.js";

type TaskDto = ServerInferResponseBody<typeof contract.tasks.getTask, 200>;

export function toTaskDto(task: Task): TaskDto {
    return {
        id: task.id,
        listId: task.listId,
        title: task.title,
        position: task.position,
    };
}
