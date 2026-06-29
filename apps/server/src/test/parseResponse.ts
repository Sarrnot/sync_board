import { z } from "zod";
import type { AppRoute, ServerInferResponseBody } from "@ts-rest/core";

/**
 * Validate an HTTP response body against the contract's own zod schema for a
 * route + status, returning it typed. The contract is the single source of
 * truth, so this catches the controller/mapper response drifting from it —
 * forgotten or leaked fields, wrong types, etc.; `parse` throws (and so
 * fails the test) on any mismatch.
 *
 * The lone assertion bridges ts-rest's loosely-typed `responses` map (every
 * validate helper it ships returns `unknown`) to its own response inference.
 */
export function parseResponse<
    R extends AppRoute,
    S extends keyof R["responses"] & number,
>(route: R, status: S, body: unknown): ServerInferResponseBody<R, S> {
    const schema = route.responses[status];
    if (!(schema instanceof z.ZodType)) {
        throw new Error(
            `route has no zod response schema for status ${String(status)}`,
        );
    }
    return schema.parse(body) as ServerInferResponseBody<R, S>;
}
