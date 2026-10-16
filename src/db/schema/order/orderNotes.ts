import { orders } from "./orders";
import { pgTable, serial, text, timestamp, integer } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

export const orderNotes = pgTable("order_notes", {
  id: serial("id").primaryKey(),
  orderId: integer("order_id")
    .notNull()
    .references(() => orders.id, {
      onDelete: "cascade",
    }),
  note: text("note").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const orderNotesRelations = relations(orderNotes, ({ one }) => ({
  order: one(orders, {
    fields: [orderNotes.orderId],
    references: [orders.id],
  }),
}));

export type OrderNote = typeof orderNotes.$inferSelect;
export type NewOrderNote = typeof orderNotes.$inferInsert;
