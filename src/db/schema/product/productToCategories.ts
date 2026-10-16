import { boolean, integer, pgTable } from "drizzle-orm/pg-core";
import { products } from "./product";
import { productCategories } from "./productCategories";
import { relations } from "drizzle-orm";

export const productToCategories = pgTable("product_to_categories", {
  productId: integer("product_id")
    .notNull()
    .references(() => products.id, { onDelete: "cascade" }),

  categoryId: integer("category_id")
    .notNull()
    .references(() => productCategories.id, { onDelete: "cascade" }),

  isPrimary: boolean("is_primary").default(false),
});

export type ProductToCategory = typeof productToCategories.$inferSelect;
export type NewProductToCategory = typeof productToCategories.$inferInsert;

export const productToCategoriesRelations = relations(
  productToCategories,
  ({ one }) => ({
    product: one(products, {
      fields: [productToCategories.productId],
      references: [products.id],
    }),
    category: one(productCategories, {
      fields: [productToCategories.categoryId],
      references: [productCategories.id],
    }),
  })
);
