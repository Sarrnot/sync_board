import { eq } from "drizzle-orm";
import { tasks } from "../../db/index.js";
import type { Db, NewTask, Task } from "../../db/index.js";
import { EntityNotFoundError } from "../../errors/EntityNotFoundError.js";
import { InvariantError } from "../../errors/InvariantError.js";
import type { AppNotificationBus } from "../../events/index.js";
import { reader } from "../lib/reader.js";
import { withTransaction } from "../lib/runInTransaction.js";
import type { TransactionContext } from "../lib/runInTransaction.js";

export type CreateTaskInput = Pick<NewTask, "listId" | "title" | "position">;
export type UpdateTaskInput = Pick<NewTask, "title">;
export type MoveTaskInput = Pick<NewTask, "listId" | "position">;

export class TaskService {
    private readonly db: Db;
    private readonly withTx: ReturnType<typeof withTransaction>;

    constructor(deps: { db: Db; bus: AppNotificationBus }) {
        this.db = deps.db;
        this.withTx = withTransaction(deps);
    }

    create(input: CreateTaskInput, tx?: TransactionContext): Promise<Task> {
        return this.withTx(tx, async ({ executor, emit }) => {
            const [task] = await executor
                .insert(tasks)
                .values(input)
                .returning();
            if (!task)
                throw new InvariantError("Expected insert to return one row");
            emit("task.created", task);
            return task;
        });
    }

    update(
        id: string,
        input: UpdateTaskInput,
        tx?: TransactionContext,
    ): Promise<Task> {
        return this.withTx(tx, async ({ executor, emit }) => {
            const [task] = await executor
                .update(tasks)
                .set(input)
                .where(eq(tasks.id, id))
                .returning();
            if (!task) throw new EntityNotFoundError(tasks, id);
            emit("task.updated", task);
            return task;
        });
    }

    move(
        id: string,
        input: MoveTaskInput,
        tx?: TransactionContext,
    ): Promise<Task> {
        return this.withTx(tx, async ({ executor, emit }) => {
            const [task] = await executor
                .update(tasks)
                .set(input)
                .where(eq(tasks.id, id))
                .returning();
            if (!task) throw new EntityNotFoundError(tasks, id);
            emit("task.moved", task);
            return task;
        });
    }

    remove(id: string, tx?: TransactionContext): Promise<Task> {
        return this.withTx(tx, async ({ executor, emit }) => {
            const [task] = await executor
                .delete(tasks)
                .where(eq(tasks.id, id))
                .returning();
            if (!task) throw new EntityNotFoundError(tasks, id);
            emit("task.deleted", task);
            return task;
        });
    }

    /** Delete every task of a list, emitting one `task.deleted` per task. */
    removeByList(listId: string, tx?: TransactionContext): Promise<Task[]> {
        return this.withTx(tx, async ({ executor, emit }) => {
            const removed = await executor
                .delete(tasks)
                .where(eq(tasks.listId, listId))
                .returning();
            for (const task of removed) emit("task.deleted", task);
            return removed;
        });
    }

    getById(id: string, tx?: TransactionContext): Promise<Task | undefined> {
        return reader(this.db, tx).query.tasks.findFirst({
            where: eq(tasks.id, id),
        });
    }

    listByList(listId: string, tx?: TransactionContext): Promise<Task[]> {
        return reader(this.db, tx).query.tasks.findMany({
            where: eq(tasks.listId, listId),
        });
    }
}
