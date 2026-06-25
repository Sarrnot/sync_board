/**
 * Base for failures raised deliberately by domain logic. Transport-agnostic on
 * purpose: it carries no HTTP status — each boundary maps the concrete subclass
 * to its own representation (EntityNotFoundError → 404, InvariantError → 500, an
 * RPC error code, …).
 * An arbitrary thrown Error that is *not* a DomainError is an unmodeled failure
 * that also surfaces as a 500.
 */
export abstract class DomainError extends Error {
    constructor(message: string) {
        super(message);
        // Human-readable label for logs and serialized error responses.
        this.name = new.target.name;
    }
}
