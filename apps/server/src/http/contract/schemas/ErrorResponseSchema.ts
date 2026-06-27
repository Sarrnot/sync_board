import { z } from "zod";

/** Body returned for every non-2xx response (domain errors, validation). */
export const ErrorResponseSchema = z.object({
    message: z.string(),
});
