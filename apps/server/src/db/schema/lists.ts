import { pgTable, uuid, text, timestamp } from "drizzle-orm/pg-core";
import { boards } from "./boards.js";

export const lists = pgTable("lists", {
    id: uuid().primaryKey().defaultRandom(),
    boardId: uuid()
        .notNull()
        .references(() => boards.id),
    title: text().notNull(),
    /** Fractional index (lexicographic order) */
    position: text().notNull(),
    createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp({ withTimezone: true })
        .notNull()
        .defaultNow()
        .$onUpdate(() => new Date()),
});

export type List = typeof lists.$inferSelect;
export type NewList = typeof lists.$inferInsert;
