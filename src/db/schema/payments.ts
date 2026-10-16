import {
  pgTable,
  serial,
  varchar,
  integer,
  timestamp,
  pgEnum,
} from "drizzle-orm/pg-core";
import { orders } from "./order/orders";
import { relations } from "drizzle-orm";

export const paymentStatusEnum = pgEnum("payment_status", [
  "pending",
  "paid",
  "failed",
  "cancelled",
]);

export const payments = pgTable("payments", {
  id: serial("id").primaryKey(),
  orderId: integer("order_id")
    .notNull()
    .references(() => orders.id, { onDelete: "cascade" }),

  provider: varchar("provider", { length: 100 }).notNull(),
  status: paymentStatusEnum("status").default("pending").notNull(),

  amount: integer("amount").notNull(),
  trackingCode: varchar("tracking_code", { length: 255 }),

  refNumber: varchar("ref_number", { length: 255 }),
  cardNumber: varchar("card_number", { length: 255 }),
  
  description: varchar("description", { length: 255 }),

  gatewayStatus: integer("gateway_status"),

  paidAt: timestamp("paid_at"),

  taxAmount: integer("tax_amount"),

  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const paymentsRelations = relations(payments, ({ one }) => ({
  order: one(orders, {
    fields: [payments.orderId],
    references: [orders.id],
  }),
}));

export type Payment = typeof payments.$inferSelect;
export type NewPayment = typeof payments.$inferInsert;
