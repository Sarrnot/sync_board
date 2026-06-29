# http

The REST transport: a shared ts-rest contract and the controllers that fulfil it over the [service layer](../services). Mounted onto Express by `mountApi`. (The WebSocket sync channel is a separate transport.)

## Structure

```
http/
  contract/      # the ts-rest contract: routes + Zod schemas — the public, shared surface
  controllers/   # ts-rest handlers, one module per entity; thin, delegate to services
  mappers/       # entity row -> response DTO (DTO types inferred from the contract)
  middleware/    # Express middleware for the API
  mountApi.ts    # wire contract + controllers + error boundary onto an Express app
```

## Contract

- **The single source of truth for the wire shape**, shared by both sides. Re-exported from the package as `server/contract` (see [package.json](../../package.json) `exports`); the client imports it via `workspace:*`.
- **Dependency-light on purpose**: only ts-rest + Zod, no server/DB imports, so the client can pull it in cheaply. Keep it that way.

## Controllers

- **Thin**: validate (ts-rest, from the contract), call the injected service, map the result. No business logic — that lives in services.
- **Errors**: services throw transport-agnostic [domain errors](../errors); the error middleware maps them to status codes. Controllers don't catch.
- **Mappers** narrow Drizzle rows to the contract's response DTOs, dropping anything not on the wire.

## Testing

Controllers are tested against a real app over HTTP (supertest) wired to the in-process test db — see `src/test/createTestApp.ts`. Assert response bodies with `parseResponse`, which validates them against the contract's own schema so tests can't drift from it.
