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
pnpm dev          # Express + ws with reload
pnpm build        # tsc -b (typecheck is part of build)
pnpm lint         # ESLint
pnpm exec tsc -b --noEmit   # Typecheck only (no emit)
```

## Naming

- **Entity / Drizzle schema files**: `camelCase.ts`, plural — `cards.ts`, `columns.ts`, `boards.ts`.
- **Drizzle table export**: plural camelCase const — `export const cards = pgTable("cards", ...)`.
- **Inferred row type**: PascalCase singular — `export type Card = typeof cards.$inferSelect`.

See the root [CLAUDE.md](../../CLAUDE.md) for cross-cutting naming rules (modules, tests, types).

## Sync responsibilities

Server is authoritative. Mutations arrive via REST, are persisted, then echoed over WebSocket to all connected clients so they can reconcile their local caches.

## Folder structure

```
src/
  ...              # Express app + WebSocket handlers
```

(Structure is still light — expand this section as the server grows.)
