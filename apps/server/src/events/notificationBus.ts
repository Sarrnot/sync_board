export type EventHandler<TPayload> = (payload: TPayload) => void;

export type NotificationBusOptions<TEventMap extends Record<string, unknown>> =
    {
        /**
         * Called when a handler throws. Isolated per handler: a throw never aborts
         * siblings nor escapes `emit`. Synchronous throws only — a handler's async
         * work owns its own errors. Defaults to `console.error`.
         */
        onError?: (error: unknown, event: keyof TEventMap) => void;
    };

/**
 * Generic, strongly-typed in-process notification bus.
 *
 * Notification-only: emit is fire-and-forget, handlers are independent
 * observers — none can stop propagation, veto, or return a value. Need
 * vetoable/ordered semantics? Use a separate pipeline construct.
 *
 * `TEventMap` maps event names to payload types, so emitting/subscribing to an
 * unknown event or wrong payload is a compile error.
 *
 * Dispatch is synchronous: `emit` runs every handler inline, then returns. A
 * handler with slow work must defer it itself; a blocking handler stalls the caller.
 */
export class NotificationBus<TEventMap extends Record<string, unknown>> {
    // One handler set per event. `EventHandler<never>` accepts any concrete
    // handler without a cast; payload type is restored in `emit`.
    readonly #handlers = new Map<keyof TEventMap, Set<EventHandler<never>>>();
    readonly #onError: (error: unknown, event: keyof TEventMap) => void;

    constructor(options?: NotificationBusOptions<TEventMap>) {
        this.#onError =
            options?.onError ??
            ((error, event) => {
                console.error(
                    `event handler for "${String(event)}" threw`,
                    error,
                );
            });
    }

    emit<K extends keyof TEventMap>(event: K, payload: TEventMap[K]): void {
        const set = this.#handlers.get(event);
        if (!set) return;
        // Snapshot so a handler that (un)subscribes during dispatch doesn't
        // mutate the set we're iterating.
        for (const handler of [...set]) {
            try {
                // Cast is safe: `on` only stores a handler under the event
                // whose payload it accepts, so this is its real type.
                const typedHandler = handler as EventHandler<TEventMap[K]>;
                typedHandler(payload);
            } catch (error) {
                this.#onError(error, event);
            }
        }
    }

    /**
     * Subscribe to an event. Returns an unsubscribe function; calling it is
     * equivalent to {@link NotificationBus.off} with the same arguments.
     */
    on<K extends keyof TEventMap>(
        event: K,
        handler: EventHandler<TEventMap[K]>,
    ): () => void {
        let set = this.#handlers.get(event);
        if (!set) {
            set = new Set();
            this.#handlers.set(event, set);
        }
        set.add(handler);
        return () => {
            this.off(event, handler);
        };
    }

    off<K extends keyof TEventMap>(
        event: K,
        handler: EventHandler<TEventMap[K]>,
    ): void {
        const set = this.#handlers.get(event);
        if (!set) return;
        set.delete(handler);
        if (set.size === 0) this.#handlers.delete(event);
    }
}
