import { pgTable, uuid, text, timestamp } from "drizzle-orm/pg-core";

export const boards = pgTable("boards", {
    id: uuid().primaryKey().defaultRandom(),
    title: text().notNull(),
    createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp({ withTimezone: true })
        .notNull()
        .defaultNow()
        .$onUpdate(() => new Date()),
});

export type Board = typeof boards.$inferSelect;
export type NewBoard = typeof boards.$inferInsert;
