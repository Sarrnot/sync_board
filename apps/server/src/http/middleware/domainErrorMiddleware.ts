import type { ErrorRequestHandler } from "express";
import { DomainError } from "../../errors/DomainError.js";
import { EntityNotFoundError } from "../../errors/EntityNotFoundError.js";

/**
 * Maps domain errors thrown by services to HTTP responses
 * Unmodeled errors fall through to Express's default 500 handler.
 */
export const domainErrorMiddleware: ErrorRequestHandler = (
    err,
    _req,
    res,
    next,
) => {
    // Response already started — can't rewrite status/body; let Express close it.
    if (res.headersSent) {
        next(err);
        return;
    }
    if (err instanceof EntityNotFoundError) {
        res.status(404).json({ message: err.message });
        return;
    }
    if (err instanceof DomainError) {
        res.status(500).json({ message: err.message });
        return;
    }
    next(err);
};
