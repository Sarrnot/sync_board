import { initServer } from "@ts-rest/express";
import { contract } from "../../contract/index.js";
import type { Services } from "../../../services/index.js";
import { toTaskDto } from "../../mappers/taskMapper.js";

const s = initServer();

export function createTaskController(services: Services) {
    return s.router(contract.tasks, {
        createTask: async ({ body }) => {
            const task = await services.taskService.create(body);
            return { status: 201, body: toTaskDto(task) };
        },
        getTask: async ({ params }) => {
            const task = await services.taskService.getById(params.taskId);
            if (!task)
                return {
                    status: 404,
                    body: { message: `Task ${params.taskId} not found.` },
                };
            return { status: 200, body: toTaskDto(task) };
        },
        updateTask: async ({ params, body }) => {
            const task = await services.taskService.update(params.taskId, body);
            return { status: 200, body: toTaskDto(task) };
        },
        moveTask: async ({ params, body }) => {
            const task = await services.taskService.move(params.taskId, body);
            return { status: 200, body: toTaskDto(task) };
        },
        deleteTask: async ({ params }) => {
            const task = await services.taskService.remove(params.taskId);
            return { status: 200, body: toTaskDto(task) };
        },
    });
}
