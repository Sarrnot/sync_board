import { pgTable, uuid, text, timestamp } from "drizzle-orm/pg-core";
import { lists } from "./lists.js";

export const tasks = pgTable("tasks", {
    id: uuid("id").primaryKey().defaultRandom(),
    listId: uuid("list_id")
        .notNull()
        .references(() => lists.id),
    title: text("title").notNull(),
    // Fractional index (lexicographic order)
    position: text("position").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
        .notNull()
        .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
        .notNull()
        .defaultNow(),
});

export type Task = typeof tasks.$inferSelect;
export type NewTask = typeof tasks.$inferInsert;
