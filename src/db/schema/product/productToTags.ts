import { pgTable, integer, primaryKey } from "drizzle-orm/pg-core";
import { products } from "./product";
import { productTags } from "./productTags";
import { relations } from "drizzle-orm";

export const productToTags = pgTable(
  "product_to_tags",
  {
    productId: integer("product_id")
      .notNull()
      .references(() => products.id),
    tagId: integer("tag_id")
      .notNull()
      .references(() => productTags.id),
  },
  (table) => ({
    pk: primaryKey({ columns: [table.productId, table.tagId] }),
  })
);

export const productTagsRelations = relations(productToTags, ({ one }) => ({
  product: one(products, {
    fields: [productToTags.productId],
    references: [products.id],
  }),
  tag: one(productTags, {
    fields: [productToTags.tagId],
    references: [productTags.id],
  }),
}));
