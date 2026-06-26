# services

The layer between the DB and the REST/WS controllers, and the only writer of the DB. One service class per entity (`BoardService`, `TaskService`, etc.), constructed with its dependencies.

## Structure

```
services/
  lib/              # shared primitives: runInTransaction (unit-of-work), reader (read-executor selection)
  board/            # BoardService + test
  list/             # ListService + test
  task/             # TaskService + test
  createServices.ts # composition root — wires the task -> list -> board DI chain
  index.ts          # barrel — public surface of the layer
```

## Shape

- **Class + DI**: `new TaskService({ db, bus })`. No singletons; the composition root `createServices` wires the `task -> list -> board` dependency chain.
- **Plain prototype methods**, not arrow fields — `@typescript-eslint/unbound-method` (on via `strictTypeChecked`) catches detached-`this` misuse, so no per-method binding.
- **Drizzle types only**: methods speak `Task` / `NewTask` and Drizzle-derived input subsets. No Zod here — request validation and client DTOs live at the controller boundary.
- **Mutations return the affected row(s)** so the controller can build its HTTP response, deletes included.

## Errors

Guard inline raising a domain error from [src/errors/](../errors).

## Transaction context

- **Buffered emit, owned by the service** so callers can't forget. Events fire only after the outermost transaction **commits**; a throw rolls back and drops the buffer — no phantom sync events.
- Every method takes an **optional trailing `tx?`**: passed → join that transaction and its buffer; omitted → open a fresh one. This is what lets one transaction span multiple service calls.
- Reads route through the same `tx` so they see the open transaction's uncommitted writes, staying symmetric with writes.

## Cascade deletes

FKs are `NO ACTION`, so a parent deletes its children top-down within one transaction by calling its **injected** child service (not an import), emitting one event per removed row.

Cascade lives in the parent service, not a separate workflow layer — one cross-entity op doesn't justify it. Extract a separate layer (e.g `workflows/`) when more cross-entity op land.

## Testing

Services run against a **real database** (pglite, in-process) — they're thin Drizzle wrappers, so mocking the executor would only restate the implementation. `src/test/getTestDb.ts` provides it; pass it to `createServices`. Assert emitted events via a bus spy and persistence via `db.select()`. The pglite→`Db` cast is confined to that helper (production stays on postgres.js).

Speed: the WASM instance is created + migrated **once per test file** (vitest isolates files, so no shared-instance race) and each test resets with a fast `TRUNCATE`. The bumped vitest timeout covers cold start, not per-test work.
