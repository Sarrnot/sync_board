# db

Drizzle ORM data layer for `sync_board`. PostgreSQL via the postgres.js driver.

## Layout

```
db/
  client.ts        # postgres.js connection + Drizzle singleton (`db`)
  index.ts         # public surface: re-exports `db` and the schema/types
  schema/          # one file per entity (multi-file module)
    boards.ts      # boards + Board/NewBoard types
    lists.ts       # lists (FK -> boards) + List/NewList
    tasks.ts       # tasks (FK -> lists) + Task/NewTask
    index.ts       # re-exports every table + row/insert type
```

## Conventions

- UUID primary keys (`defaultRandom()`).
- `created_at` / `updated_at` are `timestamp` `withTimezone`, `defaultNow()`.
- Ordering uses a string `position` fractional index (lexicographic order). Moving a
  row mints a key between its new neighbors — a single-row update, no neighbor rewrites.
- FKs use the default `NO ACTION`: deleting a parent that still has children
  errors. Deletes are handled top-down in the service (load children, emit
  `*.deleted` events, delete) so the sync layer sees every removed row — a silent
  DB cascade would skip those events.
