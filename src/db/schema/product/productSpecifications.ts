import { pgTable, text, integer, serial, timestamp } from "drizzle-orm/pg-core";
import { products } from "./product";
import { specifications } from "./specifications";
import { specificationOptions } from "./specificationOptions";
import { productSpecificationOptions } from "./productSpecificationOptions";
import { relations } from "drizzle-orm";

export const productSpecifications = pgTable("product_specifications", {
  id: serial("id").primaryKey(),
  productId: integer("product_id")
    .notNull()
    .references(() => products.id),
  specificationId: integer("specification_id")
    .notNull()
    .references(() => specifications.id, { onDelete: "cascade" }),
  value: text("value"), // For text, number types (optional for select/multi-select)
  optionId: integer("option_id") // For single select type
    .references(() => specificationOptions.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const productSpecificationsRelations = relations(
  productSpecifications,
  ({ one, many }) => ({
    product: one(products, {
      fields: [productSpecifications.productId],
      references: [products.id],
    }),
    specification: one(specifications, {
      fields: [productSpecifications.specificationId],
      references: [specifications.id],
    }),
    option: one(specificationOptions, {
      fields: [productSpecifications.optionId],
      references: [specificationOptions.id],
    }),
    // For multi-select specifications
    selectedOptions: many(productSpecificationOptions),
  })
);

export type ProductSpecification = typeof productSpecifications.$inferSelect;
export type NewProductSpecification = typeof productSpecifications.$inferInsert;
