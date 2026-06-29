import type { ServerInferResponseBody } from "@ts-rest/core";
import type { List } from "../../db/index.js";
import { contract } from "../contract/index.js";

type ListDto = ServerInferResponseBody<typeof contract.lists.getList, 200>;

export function toListDto(list: List): ListDto {
    return {
        id: list.id,
        boardId: list.boardId,
        title: list.title,
        position: list.position,
    };
}
