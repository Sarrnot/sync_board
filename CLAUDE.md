# CLAUDE.md

## Project

`sync_board` is a demo collaborative Kanban / task board. Cards/columns sync in real time between clients.

## Monorepo

pnpm workspaces (no Turborepo/Nx). Apps in `apps/*`, shared packages in `packages/*`:

- **`apps/web`** — Vite + React frontend. See [apps/web/CLAUDE.md](apps/web/CLAUDE.md).
- **`apps/server`** — Node + Express backend with WebSocket sync. Database. See [apps/server/CLAUDE.md](apps/server/CLAUDE.md).
- **`packages/eslint-config`** — shared ESLint base extended by each app's `eslint.config.js`.

Run scripts from a package root, or from the repo root with `pnpm --filter <pkg> <script>`. App-specific commands live in each app's `CLAUDE.md`.

Each package owns its own `.env` — copy its `.env.example` to `.env`.

## Commands

Run from the repo root.

```bash
pnpm -r lint                 # ESLint, all apps
pnpm -r typecheck            # Typecheck, all apps
pnpm -r test                 # Tests, all apps
pnpm run verify              # lint + typecheck + test, all apps
pnpm run format              # Prettier --write (pass paths)
pnpm run format:all          # Prettier --write the whole repo
pnpm run format:check        # Prettier --check the whole repo
```

Single app: `pnpm --filter web <script>` or `pnpm --filter server <script>` (e.g. `pnpm --filter web lint`). Available per-app scripts: `lint`, `typecheck`, `test`.

## API & Sync Model (cross-app contract)

REST for CRUD at `/api` (boards/cards/...). WebSocket channel at `/ws` carries sync events (created/updated/deleted/moved) fanned out to other clients. The server is authoritative — clients reconcile against its echoes.

## Database

- PostgreSQL (dev container in `compose.yaml`; `docker compose up -d db`)
- Drizzle ORM (schema + migrations live in `apps/server` — see [apps/server/CLAUDE.md](apps/server/CLAUDE.md))

## Conventions (apply to both apps)

### Simplicity

- **YAGNI / KISS**: build only what the current requirement needs — no speculative abstractions or config for hypothetical futures. When two approaches work, take the one with fewer moving parts.
- **Comments**: short. Explain the "why" (architecture/intent), not what the code already shows.

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
- When implementing or changing functionality, always consider adding tests for it.
- **Testable architecture**: favor structure that is easy to test — keep components presentational, push logic into hooks/pure functions, and isolate side effects behind a single boundary (e.g. data access) so it can be mocked. Prefer pure functions with explicit inputs/outputs over hidden state; inject dependencies rather than reaching for globals.

### Module boundaries

- A module must not import from another module's internals. Multi-file modules (components, features, schemas, etc.) expose their public surface from `index.ts` — cross-module use goes through that `index.ts`. ESLint-enforced — do not bypass.
- Code lives where it is used. Module-specific components/hooks/utils/... stay inside the module. Once something is needed across modules, elevate it into a shared location (generic `components/`, `hooks/`, `lib/`, etc.) rather than importing it from one module into another.

### CLAUDE.md

- **Keep CLAUDE.md files in sync**: when a change makes any of these docs stale (this file, `apps/server/CLAUDE.md`, `apps/web/CLAUDE.md`, etc.), update the affected file in the same change.
- **CLAUDE.md style**: keep them lean — capture architecture, where to find details, and key gotchas worth knowing before searching. Don't list every file/function/field; that detail belongs in the code and only adds churn. Push deep detail into a nested CLAUDE.md and link to it.

## Repo Etiquette

- **Commits**: Conventional Commits. Scope the package name when a change affects a single package (`web`, `server`, `eslint-config`); omit the scope for repo-wide or cross-package changes. Format: `<type>(<scope>): <description>` or `<type>: <description>` — e.g. `feat(web): add column drag`, `fix(server): stale ws reconnect`, `chore: bump vite`. Types in use: `feat`, `fix`, `chore`, `refactor`, `docs`, `test`, `build`, `ci`.
- Commit messages are lowercase after the type and have no trailing period, but preserve the real casing of identifiers (filenames, symbols, env vars) — e.g. `docs: update CLAUDE.md`.

## Scratch Space

- **`tmp/`** — gitignored. Scratch space for Claude's temporary files and the user's own drafts. Safe to read/write freely.
