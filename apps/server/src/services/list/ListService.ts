import { eq } from "drizzle-orm";
import { lists } from "../../db/index.js";
import type { Db, List, NewList } from "../../db/index.js";
import { EntityNotFoundError } from "../../errors/EntityNotFoundError.js";
import { InvariantError } from "../../errors/InvariantError.js";
import type { AppNotificationBus } from "../../events/index.js";
import { reader } from "../lib/reader.js";
import { withTransaction } from "../lib/runInTransaction.js";
import type { TransactionContext } from "../lib/runInTransaction.js";
import type { TaskService } from "../task/TaskService.js";

export type CreateListInput = Pick<NewList, "boardId" | "title" | "position">;
export type UpdateListInput = Pick<NewList, "title">;
export type MoveListInput = Pick<NewList, "position">;

export class ListService {
    private readonly db: Db;
    private readonly taskService: TaskService;
    private readonly withTx: ReturnType<typeof withTransaction>;

    constructor(deps: {
        db: Db;
        bus: AppNotificationBus;
        taskService: TaskService;
    }) {
        this.db = deps.db;
        this.taskService = deps.taskService;
        this.withTx = withTransaction({ bus: deps.bus, db: deps.db });
    }

    create(input: CreateListInput, tx?: TransactionContext): Promise<List> {
        return this.withTx(tx, async ({ executor, emit }) => {
            const [list] = await executor
                .insert(lists)
                .values(input)
                .returning();
            if (!list)
                throw new InvariantError("Expected insert to return one row");
            emit("list.created", list);
            return list;
        });
    }

    update(
        id: string,
        input: UpdateListInput,
        tx?: TransactionContext,
    ): Promise<List> {
        return this.withTx(tx, async ({ executor, emit }) => {
            const [list] = await executor
                .update(lists)
                .set(input)
                .where(eq(lists.id, id))
                .returning();
            if (!list) throw new EntityNotFoundError(lists, id);
            emit("list.updated", list);
            return list;
        });
    }

    move(
        id: string,
        input: MoveListInput,
        tx?: TransactionContext,
    ): Promise<List> {
        return this.withTx(tx, async ({ executor, emit }) => {
            const [list] = await executor
                .update(lists)
                .set(input)
                .where(eq(lists.id, id))
                .returning();
            if (!list) throw new EntityNotFoundError(lists, id);
            emit("list.moved", list);
            return list;
        });
    }

    /** Delete a list. Cascades to all its tasks. */
    remove(id: string, tx?: TransactionContext): Promise<List> {
        return this.withTx(tx, async (currentTx) => {
            await this.taskService.removeByList(id, currentTx);
            const [list] = await currentTx.executor
                .delete(lists)
                .where(eq(lists.id, id))
                .returning();
            if (!list) throw new EntityNotFoundError(lists, id);
            currentTx.emit("list.deleted", list);
            return list;
        });
    }

    /** Delete every list of a board, cascading to their tasks. */
    removeByBoard(
        boardId: string,
        tx?: TransactionContext,
    ): Promise<{ id: string }[]> {
        return this.withTx(tx, async (currentTx) => {
            const children = await currentTx.executor
                .select({ id: lists.id })
                .from(lists)
                .where(eq(lists.boardId, boardId));
            for (const child of children)
                await this.remove(child.id, currentTx);
            return children;
        });
    }

    getById(id: string, tx?: TransactionContext): Promise<List | undefined> {
        return reader(this.db, tx).query.lists.findFirst({
            where: eq(lists.id, id),
        });
    }

    listByBoard(boardId: string, tx?: TransactionContext): Promise<List[]> {
        return reader(this.db, tx).query.lists.findMany({
            where: eq(lists.boardId, boardId),
        });
    }
}
