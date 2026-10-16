import { pgTable, integer, boolean, serial } from "drizzle-orm/pg-core";
import { productCategories } from "./productCategories";
import { specifications } from "./specifications";
import { relations } from "drizzle-orm";

export const categoryToSpecifications = pgTable("category_to_specifications", {
  id: serial("id").primaryKey(),
  categoryId: integer("category_id")
    .notNull()
    .references(() => productCategories.id, { onDelete: "cascade" }),
  specificationId: integer("specification_id")
    .notNull()
    .references(() => specifications.id, { onDelete: "cascade" }),
  isRequired: boolean("is_required").default(false),
  order: integer("order").default(0),
});

export const categoryToSpecificationsRelations = relations(
  categoryToSpecifications,
  ({ one }) => ({
    category: one(productCategories, {
      fields: [categoryToSpecifications.categoryId],
      references: [productCategories.id],
    }),
    specification: one(specifications, {
      fields: [categoryToSpecifications.specificationId],
      references: [specifications.id],
    }),
  })
);
