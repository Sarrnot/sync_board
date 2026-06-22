# Events

In-process typed notification bus. Services emit post-mutation events ("this happened"); independent subscribers react. Decouples the service layer (emits) from the WebSocket layer (subscribes, fans out to clients) — neither imports the other. Future subscribers possible (logging, analytics, ...).

## Decisions & why

- **Notify only, no control flow.** Emitting announces something already done. Subscribers can't cancel, block other subscribers, or return a value to the emitter. Need "no, don't do this" or ordered steps? Use a different tool — don't bolt it on.

- **Subscribers run synchronously, in turn.** Emit runs every subscriber immediately, then returns. The bus can't tell fast work from slow, so the subscriber owns its pace: be quick, push slow/blocking work to the background yourself or you stall the emitter.

- **One broken subscriber won't take down the rest.** The bus catches a subscriber crash, reports it, and continues; other subscribers run and the original request still succeeds — a failing side-effect shouldn't undo work that already happened. Only catches immediate crashes; failures in background work a subscriber kicked off are its own job.

- **Observability failures must never break the request.** Nice-to-have observability (logs, metrics, analytics) → on the bus, fail quietly. Must-never-be-lost data (e.g. a legally required audit record) is real data, not a side-effect → save it in the main DB transaction and let it fail loudly.

- **Strongly typed both sides.** The event list and each event's payload are defined in one place; emitting an unknown event or wrong payload won't compile, and subscribers get the right type. This shared list is the only contract between emitter and subscriber, which never import each other.

## How to use it

- Create with `createAppNotificationBus()`.
- `on(event, handler)` subscribes and returns an unsubscribe function; `off(event, handler)` is equivalent.
- Single shared instance, injected where needed.
