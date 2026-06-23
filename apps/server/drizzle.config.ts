import { defineConfig } from "drizzle-kit";

process.loadEnvFile(".env");

const url = process.env.DATABASE_URL;
if (!url) {
    throw new Error("DATABASE_URL is required (see .env.example)");
}

export default defineConfig({
    dialect: "postgresql",
    schema: "./src/db/schema/index.ts",
    out: "./migrations",
    dbCredentials: { url },
});
