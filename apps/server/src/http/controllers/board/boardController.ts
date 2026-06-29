import { initServer } from "@ts-rest/express";
import { contract } from "../../contract/index.js";
import type { Services } from "../../../services/index.js";
import { toBoardDto, toBoardTreeDto } from "../../mappers/boardMapper.js";

const s = initServer();

export function createBoardController(services: Services) {
    return s.router(contract.boards, {
        createBoard: async ({ body }) => {
            const board = await services.boardService.create(body);
            return { status: 201, body: toBoardDto(board) };
        },
        getBoard: async ({ params }) => {
            const board = await services.boardService.getById(params.boardId);
            if (!board)
                return {
                    status: 404,
                    body: { message: `Board ${params.boardId} not found.` },
                };
            return { status: 200, body: toBoardDto(board) };
        },
        getBoardTree: async ({ params }) => {
            const board = await services.boardService.getWithChildren(
                params.boardId,
            );
            if (!board)
                return {
                    status: 404,
                    body: { message: `Board ${params.boardId} not found.` },
                };
            return { status: 200, body: toBoardTreeDto(board) };
        },
    });
}
