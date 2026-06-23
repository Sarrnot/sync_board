import { pgTable, uuid, text, timestamp } from "drizzle-orm/pg-core";
import { boards } from "./boards.js";

export const lists = pgTable("lists", {
    id: uuid("id").primaryKey().defaultRandom(),
    boardId: uuid("board_id")
        .notNull()
        .references(() => boards.id),
    title: text("title").notNull(),
    /** Fractional index (lexicographic order) */
    position: text("position").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
        .notNull()
        .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
        .notNull()
        .defaultNow(),
});

export type List = typeof lists.$inferSelect;
export type NewList = typeof lists.$inferInsert;
