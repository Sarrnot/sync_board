import { describe, it, expect, vi } from "vitest";
import { NotificationBus } from "./notificationBus.js";

type TestEventMap = {
    ping: { value: number };
    pong: { label: string };
};

describe("NotificationBus", () => {
    it("delivers an emitted payload to a subscribed handler", () => {
        const bus = new NotificationBus<TestEventMap>();
        const handler = vi.fn<(payload: { value: number }) => void>();

        bus.on("ping", handler);
        bus.emit("ping", { value: 42 });

        expect(handler).toHaveBeenCalledExactlyOnceWith({ value: 42 });
    });

    it("only delivers to handlers of the matching event", () => {
        const bus = new NotificationBus<TestEventMap>();
        const ping = vi.fn();
        const pong = vi.fn();

        bus.on("ping", ping);
        bus.on("pong", pong);
        bus.emit("ping", { value: 1 });

        expect(ping).toHaveBeenCalledOnce();
        expect(pong).not.toHaveBeenCalled();
    });

    it("invokes every subscriber in registration order", () => {
        const bus = new NotificationBus<TestEventMap>();
        const calls: string[] = [];

        bus.on("ping", () => calls.push("first"));
        bus.on("ping", () => calls.push("second"));
        bus.emit("ping", { value: 0 });

        expect(calls).toEqual(["first", "second"]);
    });

    it("stops delivery after the on() unsubscribe is called", () => {
        const bus = new NotificationBus<TestEventMap>();
        const handler = vi.fn();

        const unsubscribe = bus.on("ping", handler);
        bus.emit("ping", { value: 1 });
        unsubscribe();
        bus.emit("ping", { value: 2 });

        expect(handler).toHaveBeenCalledExactlyOnceWith({ value: 1 });
    });

    it("stops delivery after off() is called", () => {
        const bus = new NotificationBus<TestEventMap>();
        const handler = vi.fn();

        bus.on("ping", handler);
        bus.off("ping", handler);
        bus.emit("ping", { value: 1 });

        expect(handler).not.toHaveBeenCalled();
    });

    it("isolates a throwing handler from its siblings and the caller", () => {
        const onError = vi.fn();
        const bus = new NotificationBus<TestEventMap>({ onError });
        const before = vi.fn();
        const boom = new Error("boom");
        const after = vi.fn();

        bus.on("ping", before);
        bus.on("ping", () => {
            throw boom;
        });
        bus.on("ping", after);

        expect(() => {
            bus.emit("ping", { value: 1 });
        }).not.toThrow();
        expect(before).toHaveBeenCalledOnce();
        expect(after).toHaveBeenCalledOnce();
        expect(onError).toHaveBeenCalledExactlyOnceWith(boom, "ping");
    });

    it("applies unsubscribe-during-dispatch on the next emit, not the current one", () => {
        const bus = new NotificationBus<TestEventMap>();
        const second = vi.fn();
        let unsubscribeSecond = (): void => undefined;
        // First handler unsubscribes the second, which hasn't run yet. Snapshot
        // taken at emit time, so `second` still fires this round, then never again.
        bus.on("ping", () => {
            unsubscribeSecond();
        });
        unsubscribeSecond = bus.on("ping", second);

        bus.emit("ping", { value: 1 });
        bus.emit("ping", { value: 2 });

        expect(second).toHaveBeenCalledExactlyOnceWith({ value: 1 });
    });
});
