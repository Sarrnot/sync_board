import type { ServerInferResponseBody } from "@ts-rest/core";
import type { Board, List, Task } from "../../db/index.js";
import { contract } from "../contract/index.js";
import { toListDto } from "./listMapper.js";
import { toTaskDto } from "./taskMapper.js";

/** Drizzle's nested board read (BoardService.getWithChildren). */
type BoardTreeRow = Board & { lists: (List & { tasks: Task[] })[] };

type BoardDto = ServerInferResponseBody<typeof contract.boards.getBoard, 200>;
type BoardTreeDto = ServerInferResponseBody<
    typeof contract.boards.getBoardTree,
    200
>;

export function toBoardDto(board: Board): BoardDto {
    return { id: board.id, title: board.title };
}

export function toBoardTreeDto(board: BoardTreeRow): BoardTreeDto {
    return {
        ...toBoardDto(board),
        lists: board.lists.map((list) => ({
            ...toListDto(list),
            tasks: list.tasks.map(toTaskDto),
        })),
    };
}
