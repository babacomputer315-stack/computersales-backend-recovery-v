import { pgTable, varchar, timestamp, serial, integer, boolean } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { specifications } from "./specifications";

export const specificationOptions = pgTable("specification_options", {
  id: serial("id").primaryKey(),
  specificationId: integer("specification_id")
    .notNull()
    .references(() => specifications.id, { onDelete: "cascade" }),
  value: varchar("value", { length: 255 }).notNull(), // The option value (e.g., "ASUS", "Gigabyte")
  label: varchar("label", { length: 255 }).notNull(), // Display label (e.g., "ASUS", "Gigabyte")
  description: varchar("description", { length: 500 }), // Optional description
  order: integer("order").default(0), // For ordering options
  isActive: boolean("is_active").default(true), // Whether this option is available
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const specificationOptionsRelations = relations(
  specificationOptions,
  ({ one }) => ({
    specification: one(specifications, {
      fields: [specificationOptions.specificationId],
      references: [specifications.id],
    }),
  })
);

export type SpecificationOption = typeof specificationOptions.$inferSelect;
export type NewSpecificationOption = typeof specificationOptions.$inferInsert;
