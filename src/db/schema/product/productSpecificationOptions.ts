import { pgTable, integer, serial, timestamp } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { productSpecifications } from "./productSpecifications";
import { specificationOptions } from "./specificationOptions";

export const productSpecificationOptions = pgTable("product_specification_options", {
  id: serial("id").primaryKey(),
  productSpecificationId: integer("product_specification_id")
    .notNull()
    .references(() => productSpecifications.id, { onDelete: "cascade" }),
  optionId: integer("option_id")
    .notNull()
    .references(() => specificationOptions.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at").defaultNow(),
});

export const productSpecificationOptionsRelations = relations(
  productSpecificationOptions,
  ({ one }) => ({
    productSpecification: one(productSpecifications, {
      fields: [productSpecificationOptions.productSpecificationId],
      references: [productSpecifications.id],
    }),
    option: one(specificationOptions, {
      fields: [productSpecificationOptions.optionId],
      references: [specificationOptions.id],
    }),
  })
);

export type ProductSpecificationOption = typeof productSpecificationOptions.$inferSelect;
export type NewProductSpecificationOption = typeof productSpecificationOptions.$inferInsert;
