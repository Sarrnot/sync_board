import { pgTable, uuid, text, timestamp } from "drizzle-orm/pg-core";

export const boards = pgTable("boards", {
    id: uuid("id").primaryKey().defaultRandom(),
    title: text("title").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
        .notNull()
        .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
        .notNull()
        .defaultNow(),
});

export type Board = typeof boards.$inferSelect;
export type NewBoard = typeof boards.$inferInsert;
