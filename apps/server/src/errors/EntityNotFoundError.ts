import { DomainError } from "./DomainError.js";

/** An entity addressed by id does not exist. */
export class EntityNotFoundError extends DomainError {
    readonly entity: string;
    readonly id: string;

    constructor(entity: string, id: string) {
        super(`${entity} ${id} not found`);
        this.entity = entity;
        this.id = id;
    }
}
