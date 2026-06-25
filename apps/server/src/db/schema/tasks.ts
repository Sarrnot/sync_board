import { pgTable, uuid, text, timestamp } from "drizzle-orm/pg-core";
import { lists } from "./lists.js";

export const tasks = pgTable("tasks", {
    id: uuid().primaryKey().defaultRandom(),
    listId: uuid()
        .notNull()
        .references(() => lists.id),
    title: text().notNull(),
    // Fractional index (lexicographic order)
    position: text().notNull(),
    createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp({ withTimezone: true })
        .notNull()
        .defaultNow()
        .$onUpdate(() => new Date()),
});

export type Task = typeof tasks.$inferSelect;
export type NewTask = typeof tasks.$inferInsert;
