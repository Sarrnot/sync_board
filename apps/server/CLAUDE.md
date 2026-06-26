# apps/server

Node + Express backend for `sync_board`, with a WebSocket sync channel. See [repo root CLAUDE.md](../../CLAUDE.md) for monorepo-wide rules.

## Tech Stack

- TypeScript
- Node + Express
- `ws` for the WebSocket sync channel
- PostgreSQL via Drizzle ORM (schema + migrations live here)
- Zod for runtime validation of inbound payloads (REST bodies, WS messages)

## Commands

```bash
pnpm dev          # Express + ws with reload (loads .env via --env-file)
pnpm build        # tsc -p tsconfig.build.json — emit dist/
pnpm lint         # ESLint
pnpm typecheck    # tsc --noEmit

pnpm db:generate  # drizzle-kit: emit a versioned migration from schema changes
pnpm db:migrate   # drizzle-kit: apply pending migrations to the DB
```

## Build & Env

- **tsconfigs**: `tsconfig.json` type-checks the whole project; `tsconfig.build.json` narrows to `src` to emit `dist/`.
- **Env**: loaded via `--env-file=.env` (no dotenv). Copy `.env.example` to `.env`.

## Migrations

Schema is the source of truth; migrations are generated, never hand-written.

1. Edit a `src/db/schema/*.ts` file.
2. `pnpm db:generate` — writes a versioned SQL migration into `migrations/`.
3. Review the SQL, then `pnpm db:migrate` to apply it.

## Naming

- **Entity / Drizzle schema files**: `camelCase.ts`, plural — `cards.ts`, `columns.ts`, `boards.ts`.
- **Drizzle table export**: plural camelCase const — `export const cards = pgTable("cards", ...)`.
- **Inferred row type**: PascalCase singular — `export type Card = typeof cards.$inferSelect`.

See the root [CLAUDE.md](../../CLAUDE.md) for cross-cutting naming rules (modules, tests, types).

## Sync responsibilities

Server is authoritative. Mutations arrive via REST, are persisted, then echoed over WebSocket to all connected clients so they can reconcile their local caches.

## Services

One service per entity, the only writer of the DB. They speak Drizzle types, return affected rows, and own sync-event emission. Cascade deletes run top-down through injected child services. See [services/CLAUDE.md](src/services/CLAUDE.md).

## Folder structure

```
src/
  app.ts           # createApp() — Express app factory (no listen; testable)
  index.ts         # entry: createApp() + listen
  config/env.ts    # Zod-validated, typed process env
  db/              # Drizzle client + schema — see db/CLAUDE.md
  errors/          # transport-agnostic domain errors; boundaries map to e.g. HTTP status
  events/          # in-process typed notification bus; services emit, ws subscribes — see events/CLAUDE.md
  services/        # per-entity service layer over the DB — see services/CLAUDE.md
migrations/        # generated SQL migrations (drizzle-kit out dir)
```

(Structure is still light — expand this section as the server grows.)
