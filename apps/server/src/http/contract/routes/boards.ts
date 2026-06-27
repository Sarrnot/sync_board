import { initContract } from "@ts-rest/core";
import { z } from "zod";
import { ListSchema } from "./lists.js";
import { TaskSchema } from "./tasks.js";
import { IdSchema } from "../schemas/IdSchema.js";
import { ErrorResponseSchema } from "../schemas/ErrorResponseSchema.js";

export const BoardSchema = z.object({
    id: z.uuid(),
    title: z.string(),
});

/** Board with its lists and their tasks. */
export const BoardTreeSchema = BoardSchema.extend({
    lists: z.array(ListSchema.extend({ tasks: z.array(TaskSchema) })),
});

export const CreateBoardSchema = z.object({
    title: z.string().min(1),
});

const BoardParams = z.object({ boardId: IdSchema });

export const boardsContract = initContract().router({
    createBoard: {
        method: "POST",
        path: "/boards",
        body: CreateBoardSchema,
        responses: { 201: BoardSchema },
    },
    getBoard: {
        method: "GET",
        path: "/boards/:boardId",
        pathParams: BoardParams,
        responses: { 200: BoardSchema, 404: ErrorResponseSchema },
    },
    getBoardTree: {
        method: "GET",
        path: "/boards/:boardId/tree",
        pathParams: BoardParams,
        responses: { 200: BoardTreeSchema, 404: ErrorResponseSchema },
    },
});
