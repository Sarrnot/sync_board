import { initContract } from "@ts-rest/core";
import { z } from "zod";
import { PositionSchema } from "../schemas/PositionSchema.js";
import { IdSchema } from "../schemas/IdSchema.js";
import { ErrorResponseSchema } from "../schemas/ErrorResponseSchema.js";

export const ListSchema = z.object({
    id: z.uuid(),
    boardId: z.uuid(),
    title: z.string(),
    position: z.string(),
});

export const CreateListSchema = z.object({
    boardId: z.uuid(),
    title: z.string().min(1),
    position: PositionSchema,
});

export const UpdateListSchema = z.object({
    title: z.string().min(1),
});

export const MoveListSchema = z.object({
    position: PositionSchema,
});

const ListParams = z.object({ listId: IdSchema });

export const listsContract = initContract().router({
    createList: {
        method: "POST",
        path: "/lists",
        body: CreateListSchema,
        responses: { 201: ListSchema },
    },
    getList: {
        method: "GET",
        path: "/lists/:listId",
        pathParams: ListParams,
        responses: { 200: ListSchema, 404: ErrorResponseSchema },
    },
    updateList: {
        method: "PATCH",
        path: "/lists/:listId",
        pathParams: ListParams,
        body: UpdateListSchema,
        responses: { 200: ListSchema, 404: ErrorResponseSchema },
    },
    moveList: {
        method: "POST",
        path: "/lists/:listId/move",
        pathParams: ListParams,
        body: MoveListSchema,
        responses: { 200: ListSchema, 404: ErrorResponseSchema },
    },
    deleteList: {
        method: "DELETE",
        path: "/lists/:listId",
        pathParams: ListParams,
        responses: { 200: ListSchema, 404: ErrorResponseSchema },
    },
});
