import { initContract } from "@ts-rest/core";
import { z } from "zod";
import { PositionSchema } from "../schemas/PositionSchema.js";
import { IdSchema } from "../schemas/IdSchema.js";
import { ErrorResponseSchema } from "../schemas/ErrorResponseSchema.js";

export const TaskSchema = z.object({
    id: z.uuid(),
    listId: z.uuid(),
    title: z.string(),
    position: z.string(),
});

export const CreateTaskSchema = z.object({
    listId: z.uuid(),
    title: z.string().min(1),
    position: PositionSchema,
});

export const UpdateTaskSchema = z.object({
    title: z.string().min(1),
});

export const MoveTaskSchema = z.object({
    listId: z.uuid(),
    position: PositionSchema,
});

const TaskParams = z.object({ taskId: IdSchema });

export const tasksContract = initContract().router({
    createTask: {
        method: "POST",
        path: "/tasks",
        body: CreateTaskSchema,
        responses: { 201: TaskSchema },
    },
    getTask: {
        method: "GET",
        path: "/tasks/:taskId",
        pathParams: TaskParams,
        responses: { 200: TaskSchema, 404: ErrorResponseSchema },
    },
    updateTask: {
        method: "PATCH",
        path: "/tasks/:taskId",
        pathParams: TaskParams,
        body: UpdateTaskSchema,
        responses: { 200: TaskSchema, 404: ErrorResponseSchema },
    },
    moveTask: {
        method: "POST",
        path: "/tasks/:taskId/move",
        pathParams: TaskParams,
        body: MoveTaskSchema,
        responses: { 200: TaskSchema, 404: ErrorResponseSchema },
    },
    deleteTask: {
        method: "DELETE",
        path: "/tasks/:taskId",
        pathParams: TaskParams,
        responses: { 200: TaskSchema, 404: ErrorResponseSchema },
    },
});
