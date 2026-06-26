import type { Db } from "../../db/index.js";
import type { AppEventMap, AppNotificationBus } from "../../events/index.js";

/** Drizzle transaction handle, derived from `db.transaction`. */
export type Executor = Parameters<Parameters<Db["transaction"]>[0]>[0];

/**
 * One transaction and one event buffer, shared across service calls.
 * Events fire when the outermost transaction commits, and are dropped
 * on rollback. Passing a context into a service method joins its transaction
 * instead of opening a new one.
 */
export type TransactionContext = {
    executor: Executor;
    emit: <K extends keyof AppEventMap>(
        event: K,
        payload: AppEventMap[K],
    ) => void;
};

export type TransactionDeps = {
    /** The bus to emit on. */
    bus: AppNotificationBus;
    /** The db to open a transaction. */
    db: Db;
};

/**
 * Run `fn` inside a transaction, then flush its buffered events on commit.
 * Throwing rolls the transaction back and drops the buffer — no phantom events.
 */
export async function runInTransaction<T>(
    { bus, db }: TransactionDeps,
    fn: (tx: TransactionContext) => Promise<T>,
): Promise<T> {
    const buffered: (() => void)[] = [];
    const result = await db.transaction((executor) =>
        fn({
            executor,
            emit: (event, payload) => {
                buffered.push(() => {
                    bus.emit(event, payload);
                });
            },
        }),
    );
    // Reached only on commit.
    for (const flush of buffered) flush();
    return result;
}

/** Runs `fn` in the given transaction, or a new one if none is passed. */
export function withTransaction(deps: TransactionDeps) {
    return <T>(
        tx: TransactionContext | undefined,
        fn: (tx: TransactionContext) => Promise<T>,
    ): Promise<T> => (tx ? fn(tx) : runInTransaction(deps, fn));
}
