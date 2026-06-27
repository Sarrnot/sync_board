import { eq } from "drizzle-orm";
import { boards } from "../../db/index.js";
import type { Board, Db, NewBoard } from "../../db/index.js";
import { EntityNotFoundError } from "../../errors/EntityNotFoundError.js";
import { InvariantError } from "../../errors/InvariantError.js";
import type { AppNotificationBus } from "../../events/index.js";
import { reader } from "../lib/reader.js";
import { withTransaction } from "../lib/runInTransaction.js";
import type { TransactionContext } from "../lib/runInTransaction.js";
import type { ListService } from "../list/ListService.js";

export type CreateBoardInput = Pick<NewBoard, "title">;
export type UpdateBoardInput = Pick<NewBoard, "title">;

export class BoardService {
    private readonly db: Db;
    private readonly listService: ListService;
    private readonly withTx: ReturnType<typeof withTransaction>;

    constructor(deps: {
        db: Db;
        bus: AppNotificationBus;
        listService: ListService;
    }) {
        this.db = deps.db;
        this.listService = deps.listService;
        this.withTx = withTransaction({ bus: deps.bus, db: deps.db });
    }

    create(input: CreateBoardInput, tx?: TransactionContext): Promise<Board> {
        return this.withTx(tx, async ({ executor, emit }) => {
            const [board] = await executor
                .insert(boards)
                .values(input)
                .returning();
            if (!board)
                throw new InvariantError("Expected insert to return one row");
            emit("board.created", board);
            return board;
        });
    }

    update(
        id: string,
        input: UpdateBoardInput,
        tx?: TransactionContext,
    ): Promise<Board> {
        return this.withTx(tx, async ({ executor, emit }) => {
            const [board] = await executor
                .update(boards)
                .set(input)
                .where(eq(boards.id, id))
                .returning();
            if (!board) throw new EntityNotFoundError(boards, id);
            emit("board.updated", board);
            return board;
        });
    }

    /** Delete a board. Cascades to all its lists and their tasks. */
    remove(id: string, tx?: TransactionContext): Promise<Board> {
        return this.withTx(tx, async (currentTx) => {
            await this.listService.removeByBoard(id, currentTx);
            const [board] = await currentTx.executor
                .delete(boards)
                .where(eq(boards.id, id))
                .returning();
            if (!board) throw new EntityNotFoundError(boards, id);
            currentTx.emit("board.deleted", board);
            return board;
        });
    }

    getById(id: string, tx?: TransactionContext): Promise<Board | undefined> {
        return reader(this.db, tx).query.boards.findFirst({
            where: eq(boards.id, id),
        });
    }

    /** Board with its lists and their tasks. */
    getWithChildren(id: string, tx?: TransactionContext) {
        return reader(this.db, tx).query.boards.findFirst({
            where: eq(boards.id, id),
            with: { lists: { with: { tasks: true } } },
        });
    }

    listAll(tx?: TransactionContext): Promise<Board[]> {
        return reader(this.db, tx).query.boards.findMany();
    }
}
