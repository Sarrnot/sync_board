import { initServer } from "@ts-rest/express";
import { contract } from "../../contract/index.js";
import type { Services } from "../../../services/index.js";
import { toListDto } from "../../mappers/listMapper.js";

const s = initServer();

export function createListController(services: Services) {
    return s.router(contract.lists, {
        createList: async ({ body }) => {
            const list = await services.listService.create(body);
            return { status: 201, body: toListDto(list) };
        },
        getList: async ({ params }) => {
            const list = await services.listService.getById(params.listId);
            if (!list)
                return {
                    status: 404,
                    body: { message: `List ${params.listId} not found.` },
                };
            return { status: 200, body: toListDto(list) };
        },
        updateList: async ({ params, body }) => {
            const list = await services.listService.update(params.listId, body);
            return { status: 200, body: toListDto(list) };
        },
        moveList: async ({ params, body }) => {
            const list = await services.listService.move(params.listId, body);
            return { status: 200, body: toListDto(list) };
        },
        deleteList: async ({ params }) => {
            const list = await services.listService.remove(params.listId);
            return { status: 200, body: toListDto(list) };
        },
    });
}
