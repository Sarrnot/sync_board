import { z } from "zod";

// Single validated source of truth for process env. Fail fast at startup
// rather than discovering a missing/bad var deep in a request.
const envSchema = z.object({
    PORT: z.coerce.number().int().positive().default(3000),
    DATABASE_URL: z.url(),
});

export const env = envSchema.parse(process.env);
