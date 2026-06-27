import { z } from "zod";

/** Path-parameter id schema, shared by every `:id` route. */
export const IdSchema = z.uuid();
