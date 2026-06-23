import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { env } from "../config/env.js";
import * as schema from "./schema/index.js";

// Single shared connection + Drizzle instance for the process.
const queryClient = postgres(env.DATABASE_URL);

export const db = drizzle(queryClient, { schema, casing: "snake_case" });
