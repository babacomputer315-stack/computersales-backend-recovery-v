import {
  pgTable,
  varchar,
  text,
  timestamp,
  serial,
  pgEnum,
  integer,
} from "drizzle-orm/pg-core";

export const shippingTypeEnum = pgEnum("shipping_type", ["post", "collect"]);

export const shippingClasses = pgTable("shipping_classes", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  cost: integer("cost"),
  type: shippingTypeEnum("type").default("collect"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export type ShippingClass = typeof shippingClasses.$inferSelect;
export type NewShippingClass = typeof shippingClasses.$inferInsert;
