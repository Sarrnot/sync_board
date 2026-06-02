# CLAUDE.md

## Project

`sync_board` is a demo collaborative Kanban / task board. Cards/columns sync in real time between clients.

## Monorepo

pnpm workspaces (no Turborepo/Nx). Two apps:

- **`apps/web`** — Vite + React frontend. See [apps/web/CLAUDE.md](apps/web/CLAUDE.md).
- **`apps/server`** — Node + Express backend with WebSocket sync. Database. See [apps/server/CLAUDE.md](apps/server/CLAUDE.md).

Run scripts from a package root, or from the repo root with `pnpm --filter <pkg> <script>`. App-specific commands live in each app's `CLAUDE.md`.

## API & Sync Model (cross-app contract)

REST for CRUD at `/api` (boards/cards/...). WebSocket channel at `/ws` carries sync events (created/updated/deleted/moved) fanned out to other clients. The server is authoritative — clients reconcile against its echoes.

## Database

- PostgreSQL
- Drizzle ORM (schema + migrations live in `apps/server`)

## Conventions (apply to both apps)

### Naming

- **Modules / utilities / hooks**: `camelCase.ts` (`useBoardSocket.ts`, `formatDueDate.ts`).
- **Multi-file modules**: folder of related files; with an `index.ts` entry point; public files usually named after the module; (e.g. `Card/Card.tsx`, `Card/CardMenu.tsx`, `Card/index.ts`). See [Module boundaries](#module-boundaries) for the import rule.
- **Test files**: `<name>.test.ts(x)` next to the source.
- **Types**: types/interfaces named in `PascalCase`; prefer `type` aliases unless declaration merging is needed.

App-specific naming (React components, DB entities, etc.) lives in each app's `CLAUDE.md`.

### TypeScript

- Strict TS. No `any`, no non-null assertions (`!`), no `as` casts. `strictTypeChecked` + `stylisticTypeChecked` from `typescript-eslint` are on. Assertions are reserved for rare, justified cases.
- Prefer `unknown` over `any` at boundaries. Narrow external/unknown values with a runtime validator (e.g. Zod) — not with `as`.
- No default exports. Named exports only, everywhere.

### Tests

- Co-locate tests with source. `Card.tsx` and `Card.test.tsx` live in the same folder.

### Module boundaries

- A module must not import from another module's internals. Multi-file modules (components, features, schemas, etc.) expose their public surface from `index.ts` — cross-module use goes through that `index.ts`. ESLint-enforced — do not bypass.
- Code lives where it is used. Module-specific components/hooks/utils/... stay inside the module. Once something is needed across modules, elevate it into a shared location (generic `components/`, `hooks/`, `lib/`, etc.) rather than importing it from one module into another.

## Repo Etiquette

- **Branching**: none — commit directly to `main`. (Solo demo project.)
- **Commits**: Conventional Commits, no scope. Format: `<type>: <description>` — e.g. `feat: add column drag`, `fix: stale ws reconnect`, `chore: bump vite`. Types in use: `feat`, `fix`, `chore`, `refactor`, `docs`, `test`, `build`, `ci`.
- Commit messages are lowercase after the type and have no trailing period.

## Scratch Space

- **`tmp/`** — gitignored. Scratch space for Claude's temporary files and the user's own drafts. Safe to read/write freely.
