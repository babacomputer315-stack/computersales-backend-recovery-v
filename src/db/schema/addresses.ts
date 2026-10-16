import { relations } from "drizzle-orm";
import {
  integer,
  pgTable,
  serial,
  timestamp,
  varchar,
} from "drizzle-orm/pg-core";
import { orders } from "./order/orders";
import { users } from "./users";

export const addresses = pgTable("addresses", {
  id: serial("id").primaryKey(),
  fullName: varchar("full_name", { length: 255 }).notNull(),
  phone: varchar("phone", { length: 20 }).notNull(),
  province: varchar("province", { length: 100 }).notNull(),
  provinceCode: varchar("province_code", { length: 20 }),
  city: varchar("city", { length: 100 }).notNull(),
  cityCode: varchar("city_code", { length: 20 }),
  addressLine: varchar("address_line", { length: 255 }).notNull(),
  postalCode: varchar("postal_code", { length: 20 }),
  plaque: varchar("plaque", { length: 20 }),

  userId: integer("user_id").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
});

export const addressesRelations = relations(addresses, ({ many, one }) => ({
  ordersAsShipping: many(orders, { relationName: "shippingAddress" }),
  user: one(users, {
    fields: [addresses.userId],
    references: [users.id],
  }),
}));

export type Address = typeof addresses.$inferSelect;
export type NewAddress = typeof addresses.$inferInsert;
