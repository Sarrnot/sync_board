import { DomainError } from "./DomainError.js";

/** A guarantee the code relies on did not hold. */
export class InvariantError extends DomainError {}
