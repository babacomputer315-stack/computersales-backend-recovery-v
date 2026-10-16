import { pgTable, varchar, timestamp, serial } from "drizzle-orm/pg-core";
import { attributeValues } from "./attributeValues";
import { relations } from "drizzle-orm";

export const attributes = pgTable("attributes", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  slug: varchar("slug", { length: 255 }).notNull().unique(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const attributesRelations = relations(attributes, ({ many }) => ({
  values: many(attributeValues),
}));

export type Attribute = typeof attributes.$inferSelect;
export type NewAttribute = typeof attributes.$inferInsert;
